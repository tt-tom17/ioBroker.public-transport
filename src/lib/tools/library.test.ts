import { expect } from 'chai';
import * as sinon from 'sinon';
import { Library, type AdapterClassDefinition } from './library';

const PREFIX = 'public-transport.0.Stations.8001261.Departures_';

/** Minimal adapter stub: only what writedp() touches for an already-known state node. */
function createAdapterMock(): { adapter: AdapterClassDefinition; setState: sinon.SinonStub } {
    const setState = sinon.stub().resolves();
    const adapter = {
        name: 'public-transport',
        instance: 0,
        namespace: 'public-transport.0',
        config: {},
        log: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
        setState,
        extendObject: sinon.stub().resolves(),
    } as unknown as AdapterClassDefinition;
    return { adapter, setState };
}

function departureId(index: number): string {
    return `${PREFIX}${String(index).padStart(2, '0')}.Direction`;
}

/**
 * Mirrors what writedp() does to the in-memory db: store the value and stamp ts = now.
 *
 * @param library The library instance holding the in-memory state db.
 * @param index Index of the departure channel to write.
 */
function writeDeparture(library: Library, index: number): void {
    library.setdb(departureId(index), 'state', `Destination ${index}`, 'string', true, Date.now());
}

describe('Library.garbageColleting (issue #87)', () => {
    let clock: sinon.SinonFakeTimers;

    afterEach(() => {
        clock?.restore();
    });

    it('keeps states that were written during the current poll, even when writing them took longer than the offset', async () => {
        clock = sinon.useFakeTimers({ now: 1_000_000, toFake: ['Date'] });
        const { adapter, setState } = createAdapterMock();
        const library = new Library(adapter);

        // Station 8001261 from the issue: 20 departures, ~200 ms per object, so the full write
        // takes ~4 s while the gc offset is 2 s. The call site takes pollStart before writing.
        const pollStart = Date.now();
        for (let i = 0; i < 20; i++) {
            writeDeparture(library, i);
            clock.tick(200);
        }

        await library.garbageColleting(PREFIX, 2000, false, pollStart);

        const reset = setState.getCalls().map(call => call.args[0] as string);
        expect(reset, `gc reset ${reset.length} departure state(s) that were just written`).to.deep.equal([]);
    });

    it('still resets states that the current poll no longer wrote', async () => {
        clock = sinon.useFakeTimers({ now: 1_000_000, toFake: ['Date'] });
        const { adapter, setState } = createAdapterMock();
        const library = new Library(adapter);

        for (let i = 0; i < 20; i++) {
            writeDeparture(library, i);
        }

        // Next poll, 10 s later, returns only 10 departures.
        clock.tick(10_000);
        const pollStart = Date.now();
        for (let i = 0; i < 10; i++) {
            writeDeparture(library, i);
            clock.tick(200);
        }

        await library.garbageColleting(PREFIX, 2000, false, pollStart);

        const reset = setState.getCalls().map(call => call.args[0] as string);
        const stale = Array.from({ length: 10 }, (_, i) => departureId(i + 10));
        expect(reset.sort()).to.deep.equal(stale.sort());
    });

    it('falls back to the offset when no cut-off timestamp is given', async () => {
        clock = sinon.useFakeTimers({ now: 1_000_000, toFake: ['Date'] });
        const { adapter, setState } = createAdapterMock();
        const library = new Library(adapter);

        writeDeparture(library, 0);
        clock.tick(10_000);
        writeDeparture(library, 1);

        await library.garbageColleting(PREFIX, 2000);

        const reset = setState.getCalls().map(call => call.args[0] as string);
        expect(reset).to.deep.equal([departureId(0)]);
    });
});

const JPREFIX = 'public-transport.0.Journeys.MyJourney.Journey_';

/**
 * Seeds an initialised (init=false) container node into the in-memory db, as it would exist after a write.
 *
 * @param library The library instance holding the in-memory state db.
 * @param index Index of the leg channel to seed (becomes Leg_00, Leg_01, …).
 * @param name Channel display name to store in common.name.
 * @param desc Optional channel description to store in common.desc.
 * @returns The datapoint id of the seeded leg channel.
 */
function seedLegChannel(library: Library, index: number, name: string, desc?: string): string {
    const id = `${JPREFIX}00.Leg_${String(index).padStart(2, '0')}`;
    library.setdb(
        id,
        'channel',
        undefined,
        undefined,
        true,
        Date.now(),
        {
            _id: `public-transport.0.${id}`,
            type: 'channel',
            common: desc === undefined ? { name } : { name, desc },
            native: {},
        } as unknown as ioBroker.ChannelObject,
        false,
    );
    return id;
}

describe('Library container metadata refresh', () => {
    let clock: sinon.SinonFakeTimers;

    afterEach(() => {
        clock?.restore();
    });

    it('garbageColleting resets a vanished container name/desc to its neutral leaf placeholder', async () => {
        clock = sinon.useFakeTimers({ now: 1_000_000, toFake: ['Date'] });
        const { adapter } = createAdapterMock();
        const extendObject = adapter.extendObject as sinon.SinonStub;
        const library = new Library(adapter);

        // Poll 1: journey has two legs with dynamic channel names.
        seedLegChannel(library, 0, 'S1 → Hamburg-Altona');
        seedLegChannel(library, 1, 'Bus 42 → Zentrum');

        // Poll 2, 10 s later: only one leg remains. Leg_00 is rewritten (fresh ts), Leg_01 vanished.
        clock.tick(10_000);
        const pollStart = Date.now();
        seedLegChannel(library, 0, 'RE7 → Hamburg Hbf');

        extendObject.resetHistory();
        await library.garbageColleting(JPREFIX, 2000, false, pollStart);

        const calls = extendObject.getCalls().map(c => ({ id: c.args[0] as string, obj: c.args[1] }));
        // Only the vanished Leg_01 is neutralised; the fresh Leg_00 is left untouched.
        expect(calls.map(c => c.id)).to.deep.equal([`${JPREFIX}00.Leg_01`]);
        expect(calls[0].obj).to.deep.equal({ common: { name: 'Leg_01', desc: '' } });
    });

    it('garbageColleting does not re-extend a container that is already neutral', async () => {
        clock = sinon.useFakeTimers({ now: 1_000_000, toFake: ['Date'] });
        const { adapter } = createAdapterMock();
        const extendObject = adapter.extendObject as sinon.SinonStub;
        const library = new Library(adapter);

        // Stale container whose name already equals its leaf and whose desc is already empty.
        seedLegChannel(library, 1, 'Leg_01', '');
        clock.tick(10_000);

        extendObject.resetHistory();
        await library.garbageColleting(JPREFIX, 2000, false, Date.now());

        expect(extendObject.called).to.equal(false);
    });

    it('writedp refreshes an initialised container name only when it actually changed', async () => {
        clock = sinon.useFakeTimers({ now: 1_000_000, toFake: ['Date'] });
        const { adapter } = createAdapterMock();
        const extendObject = adapter.extendObject as sinon.SinonStub;
        const library = new Library(adapter);

        const id = seedLegChannel(library, 0, 'S1 → Altona');
        const channelObj = (name: string): ioBroker.ChannelObject =>
            ({
                _id: `public-transport.0.${id}`,
                type: 'channel',
                common: { name },
                native: {},
            }) as unknown as ioBroker.ChannelObject;

        // Same (dynamic, non-key) name → no extendObject.
        extendObject.resetHistory();
        await library.writedp(id, undefined, channelObj('S1 → Altona'));
        expect(extendObject.called, 'unchanged name must not extend').to.equal(false);

        // Changed name → exactly one extendObject.
        await library.writedp(id, undefined, channelObj('RE7 → Hbf'));
        expect(extendObject.callCount, 'changed name must extend once').to.equal(1);
    });
});

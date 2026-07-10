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

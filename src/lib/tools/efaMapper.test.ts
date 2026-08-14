import { expect } from 'chai';
import type { EfaJourneyLocation, EfaLeg, EfaLocation, EfaStopEvent, EfaTransportation } from '../types/efaJson';
import { mapJourney, mapLine, mapLocation, mapRemarks, mapStopEvent, mapStopovers } from './efaMapper';

/**
 * Fixtures gekürzt aus echten Antworten des VRR-Endpoints (15.08.2026). Bewusst mit den
 * Eigenheiten, die beim ersten Live-Test aufgefallen sind – die Tests halten genau diese fest.
 */

/** Steig 7 des Essener Hauptbahnhofs: `parent` ist die Haltestelle, deren `parent` der Ort. */
const PLATFORM_LOCATION: EfaJourneyLocation = {
    id: 'de:05113:9289:7:7',
    isGlobalId: true,
    name: 'Essen Hauptbahnhof',
    disassembledName: '7',
    type: 'platform',
    coord: [51.450_868, 7.012_824],
    properties: { stopId: '20009289', platform: '7', platformName: '7', plannedPlatformName: '7' },
    parent: {
        id: 'de:05113:9289',
        name: 'Essen Hauptbahnhof',
        type: 'stop',
        productClasses: [0, 1, 2, 4, 5, 7, 13],
        parent: { name: 'Essen', type: 'locality' },
    },
};

const RE_TRANSPORTATION: EfaTransportation = {
    id: 'ddb:90E06: :R:j26',
    name: 'Regionalzug RE 6',
    disassembledName: 'RE6',
    number: 'RE 6',
    product: { id: 6, class: 13, name: 'Regionalzug', iconId: 6 },
    operator: { id: 'DBFV', code: 'DBFV', name: 'DB Regio AG NRW' },
    destination: { id: 'de:05913:5001', name: 'Dortmund Hbf', type: 'stop' },
    properties: { trainNumber: '92031', tripCode: 227, trainName: 'Rhein-Haard-Express' },
};

describe('efaMapper.mapLocation', () => {
    it('uses the stop name itself, because parent is the locality and would overwrite it', () => {
        const location: EfaLocation = {
            id: 'de:05113:9289',
            name: 'Essen, Hauptbahnhof',
            type: 'stop',
            coord: [51.449_732, 7.012_213],
            parent: { name: 'Essen', type: 'locality' },
        };

        const mapped = mapLocation(location);

        expect(mapped.type).to.equal('stop');
        expect(mapped.name).to.equal('Essen, Hauptbahnhof');
    });

    it('reads coord as [latitude, longitude] – the response order is the reverse of the request order', () => {
        const mapped = mapLocation({ id: 'x', name: 'x', type: 'stop', coord: [51.449_732, 7.012_213] });

        expect(mapped).to.have.nested.property('location.latitude', 51.449_732);
        expect(mapped).to.have.nested.property('location.longitude', 7.012_213);
    });

    it('keeps the parent stop of a platform as station and takes its products', () => {
        const mapped = mapLocation(PLATFORM_LOCATION);

        expect(mapped).to.have.nested.property('station.id', 'de:05113:9289');
        expect(mapped).to.have.nested.property('products.suburban', true);
        expect(mapped).to.have.nested.property('products.regional', true);
    });

    it('falls back to assignedStops for the products, where a lookup by id puts them', () => {
        const mapped = mapLocation({
            id: 'de:05113:9289',
            name: 'Essen, Hauptbahnhof',
            type: 'stop',
            assignedStops: [{ id: 'de:05113:9289', name: 'Essen Hauptbahnhof', type: 'stop', productClasses: [1, 5] }],
        });

        expect(mapped).to.have.nested.property('products.suburban', true);
        expect(mapped).to.have.nested.property('products.bus', true);
    });

    it('maps everything that is not a stop to a plain location', () => {
        const poi = mapLocation({ id: 'poiID:1', name: 'Bochum, Rathaus/BVZ', type: 'poi', coord: [51.48, 7.21] });

        expect(poi.type).to.equal('location');
        expect(poi).to.have.property('poi', true);
    });
});

describe('efaMapper.mapLine', () => {
    it('keeps MOT class 16 as a regional product, because the same train is reported as 13 elsewhere', () => {
        const line = mapLine({ name: 'Zug 842', number: '842', product: { class: 16, name: 'Zug' } });

        expect(line?.product).to.equal('regional');
        expect(line?.mode).to.equal('train');
    });

    it('takes the trip number from properties.trainNumber, not from the line number', () => {
        const line = mapLine(RE_TRANSPORTATION);

        expect(line?.name).to.equal('RE6');
        expect(line?.fahrtNr).to.equal('92031');
        expect(line?.operator).to.deep.equal({ type: 'operator', id: 'DBFV', name: 'DB Regio AG NRW' });
    });

    it('falls back to tripCode when no train number is given', () => {
        const line = mapLine({ number: '368', product: { class: 5 }, properties: { tripCode: 227 } });

        expect(line?.fahrtNr).to.equal('227');
        expect(line?.product).to.equal('bus');
        expect(line?.mode).to.equal('bus');
    });

    it('maps the cable car to the product key the admin UI uses', () => {
        expect(mapLine({ product: { class: 8 } })?.product).to.equal('cableCar');
    });
});

describe('efaMapper.mapStopEvent', () => {
    it('reports the estimated time as the actual departure and the difference as delay in seconds', () => {
        const event: EfaStopEvent = {
            location: PLATFORM_LOCATION,
            departureTimePlanned: '2026-08-14T23:07:00Z',
            departureTimeEstimated: '2026-08-14T23:24:00Z',
            transportation: RE_TRANSPORTATION,
            isRealtimeControlled: true,
            realtimeStatus: ['MONITORED'],
        };

        const departure = mapStopEvent(event);

        expect(departure.plannedWhen).to.equal('2026-08-14T23:07:00Z');
        expect(departure.when).to.equal('2026-08-14T23:24:00Z');
        expect(departure.delay).to.equal(17 * 60);
        expect(departure.direction).to.equal('Dortmund Hbf');
        expect(departure.platform).to.equal('7');
    });

    it('reports no delay at all when there is no estimated time – zero would claim punctuality', () => {
        const departure = mapStopEvent({
            location: PLATFORM_LOCATION,
            departureTimePlanned: '2026-08-14T23:30:00Z',
            transportation: RE_TRANSPORTATION,
        });

        expect(departure.delay).to.equal(undefined);
        expect(departure.when).to.equal('2026-08-14T23:30:00Z');
    });

    it('detects a cancellation from the realtime status token', () => {
        const departure = mapStopEvent({
            location: PLATFORM_LOCATION,
            departureTimePlanned: '2026-08-14T23:07:00Z',
            transportation: RE_TRANSPORTATION,
            realtimeStatus: ['MONITORED', 'DEPARTURE_CANCELLED'],
        });

        expect(departure.cancelled).to.equal(true);
    });

    it('detects a cancellation from the boolean field', () => {
        const departure = mapStopEvent({
            location: PLATFORM_LOCATION,
            departureTimePlanned: '2026-08-14T23:07:00Z',
            transportation: RE_TRANSPORTATION,
            isCancelled: true,
        });

        expect(departure.cancelled).to.equal(true);
    });

    it('leaves cancelled unset for a normal departure instead of writing false', () => {
        const departure = mapStopEvent({
            location: PLATFORM_LOCATION,
            departureTimePlanned: '2026-08-14T23:07:00Z',
            transportation: RE_TRANSPORTATION,
            isCancelled: false,
            realtimeStatus: ['MONITORED'],
        });

        expect(departure.cancelled).to.equal(undefined);
    });

    it('uses the arrival times when arrivals were requested', () => {
        const departure = mapStopEvent(
            {
                location: PLATFORM_LOCATION,
                arrivalTimePlanned: '2026-08-14T23:05:00Z',
                arrivalTimeEstimated: '2026-08-14T23:06:00Z',
                departureTimePlanned: '2026-08-14T23:07:00Z',
                transportation: RE_TRANSPORTATION,
            },
            true,
        );

        expect(departure.plannedWhen).to.equal('2026-08-14T23:05:00Z');
        expect(departure.when).to.equal('2026-08-14T23:06:00Z');
    });
});

describe('efaMapper.mapRemarks', () => {
    it('merges infos and hints and drops entries without text', () => {
        const remarks = mapRemarks(
            [
                { type: 'stopInfo', title: 'Bauarbeiten', content: 'Aufzug außer Betrieb' },
                { type: 'stopInfo', content: '   ' },
            ],
            [{ infoType: 'stopInfo', content: 'Ersatzhalt beachten' }, { content: '' }],
        );

        expect(remarks).to.have.length(2);
        expect(remarks?.[0].text).to.equal('Aufzug außer Betrieb');
        expect(remarks?.[1].text).to.equal('Ersatzhalt beachten');
    });

    it('returns undefined when there is nothing to report', () => {
        expect(mapRemarks(undefined, undefined)).to.equal(undefined);
    });
});

describe('efaMapper.mapStopovers', () => {
    it('maps every stop of the sequence with its own planned and actual times', () => {
        const stopovers = mapStopovers([
            {
                id: 'de:05113:9289',
                name: 'Essen Hauptbahnhof',
                type: 'stop',
                departureTimePlanned: '2026-08-14T23:07:00Z',
                departureTimeEstimated: '2026-08-14T23:08:00Z',
                properties: { platform: '9', plannedPlatformName: '9' },
            },
            {
                id: 'de:05113:1234',
                name: 'Essen-Steele',
                type: 'stop',
                arrivalTimePlanned: '2026-08-14T23:14:00Z',
                arrivalTimeEstimated: '2026-08-14T23:16:00Z',
            },
        ]);

        expect(stopovers).to.have.length(2);
        expect(stopovers?.[0].departureDelay).to.equal(60);
        expect(stopovers?.[0].departurePlatform).to.equal('9');
        expect(stopovers?.[1].arrivalDelay).to.equal(120);
    });
});

describe('efaMapper.mapJourney', () => {
    /**
     * Baut einen Fahrt-Abschnitt.
     *
     * @param name Liniennummer
     * @param departure Abfahrtszeit am Start
     * @param arrival Ankunftszeit am Ziel
     */
    function ride(name: string, departure: string, arrival: string): EfaLeg {
        return {
            duration: 900,
            origin: { id: 'a', name: 'A', type: 'stop', departureTimePlanned: departure },
            destination: { id: 'b', name: 'B', type: 'stop', arrivalTimePlanned: arrival },
            transportation: { number: name, disassembledName: name, product: { class: 13, name: 'Regionalzug' } },
        };
    }

    it('treats a leg with MOT class 99 as a footpath, although it does carry a transportation block', () => {
        const journey = mapJourney({
            interchanges: 1,
            legs: [
                ride('RB40', '2026-08-14T23:07:00Z', '2026-08-14T23:20:00Z'),
                {
                    duration: 240,
                    distance: 300,
                    origin: { id: 'b', name: 'B', type: 'stop', departureTimePlanned: '2026-08-14T23:38:00Z' },
                    destination: { id: 'c', name: 'C', type: 'stop', arrivalTimePlanned: '2026-08-14T23:42:00Z' },
                    transportation: { product: { class: 99, name: 'footpath' } },
                },
            ],
        });

        expect(journey.legs[1].walking).to.equal(true);
        expect(journey.legs[1].line).to.equal(undefined);
        expect(journey.legs[1].distance).to.equal(300);
    });

    it('adds the transfer walk as its own leg when the server does not account for it yet', () => {
        const first = ride('RE6', '2026-08-14T22:53:00Z', '2026-08-14T23:09:00Z');
        first.footPathInfo = [{ position: 'AFTER', duration: 420 }];
        first.footPathInfoRedundant = false;

        const journey = mapJourney({
            interchanges: 1,
            legs: [first, ride('S2', '2026-08-14T23:25:00Z', '2026-08-14T23:58:00Z')],
        });

        expect(journey.legs).to.have.length(3);
        expect(journey.legs[1].walking).to.equal(true);
        expect(journey.legs[2].line?.name).to.equal('S2');
    });

    it('does not add a transfer walk that is already covered by the transfer time', () => {
        const first = ride('RE6', '2026-08-14T22:53:00Z', '2026-08-14T23:09:00Z');
        first.footPathInfo = [{ position: 'AFTER', duration: 420 }];
        first.footPathInfoRedundant = true;

        const journey = mapJourney({
            interchanges: 1,
            legs: [first, ride('S2', '2026-08-14T23:25:00Z', '2026-08-14T23:58:00Z')],
        });

        expect(journey.legs).to.have.length(2);
        expect(journey.legs.every(leg => !leg.walking)).to.equal(true);
    });

    it('never appends a walk behind the last leg', () => {
        const last = ride('RE6', '2026-08-14T22:53:00Z', '2026-08-14T23:09:00Z');
        last.footPathInfo = [{ position: 'AFTER', duration: 300 }];
        last.footPathInfoRedundant = false;

        const journey = mapJourney({ interchanges: 0, legs: [last] });

        expect(journey.legs).to.have.length(1);
    });
});

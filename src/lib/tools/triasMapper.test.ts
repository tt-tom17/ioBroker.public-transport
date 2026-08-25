import { expect } from 'chai';
import type { TriasLocationResult, TriasService, TriasStopEventResult, TriasTripResult } from '../types/trias';
import {
    delayInSeconds,
    durationInMinutes,
    isEmptyResult,
    mapJourney,
    mapLine,
    mapLocation,
    mapProduct,
    mapRemarks,
    mapStopEvent,
    ptModesForProducts,
    readError,
} from './triasMapper';

/**
 * Fixtures gekürzt aus echten Antworten der EFA-BW (`efa-bw.de/trias`, 24.08.2026). Sie tragen
 * bewusst die Eigenheiten, die bei der Erhebung aufgefallen sind – die Tests halten genau die
 * fest, damit sie beim Umbau nicht unbemerkt verlorengehen.
 */

/** Ein Regionalzug: Linie, Verkehrsmittel und Attribute liegen unter `ServiceSection`. */
const RE_SERVICE: TriasService = {
    OperatingDayRef: '2026-08-24',
    JourneyRef: 'ddb:90T14:A:H:j26:40',
    ServiceSection: {
        LineRef: 'ddb:90T14:A:H',
        DirectionRef: 'outward',
        Mode: { PtMode: 'rail', RailSubmode: 'local', Name: { Text: 'NRB 17659 Regionalbahn' } },
        PublishedLineName: { Text: 'RE14a' },
        OperatorRef: 'ddb:00',
    },
    Attribute: [
        { Text: { Text: 'Fahrzeuggebundene Einstiegshilfe vorhanden' }, Code: 'EH' },
        // ⚠️ Genau diese Werte machen eine Fehlererkennung am Zahlenformat unmöglich.
        { Text: { Text: '1. Klasse vorhanden' }, Code: '1' },
        { Text: { Text: 'Wagenreihung 28' }, Code: '28' },
    ],
    DestinationStopPointRef: 'de:08237:5001:2:1',
    DestinationText: { Text: 'Horb Bahnhof/ZOB' },
};

const RE_STOP_EVENT: TriasStopEventResult = {
    ResultId: 'ID-859AAEB4',
    StopEvent: {
        ThisCall: {
            CallAtStop: {
                StopPointRef: 'de:08111:6115:4:7',
                StopPointName: { Text: 'Stuttgart Hauptbahnhof (oben)' },
                PlannedBay: { Text: '7' },
                ServiceDeparture: { TimetabledTime: '2026-08-24T15:48:00Z', EstimatedTime: '2026-08-24T15:52:00Z' },
                StopSeqNumber: '1',
            },
        },
        Service: RE_SERVICE,
    },
};

describe('triasMapper => Verkehrsmittel', () => {
    it('erkennt den Regionalverkehr über PtMode=rail', () => {
        expect(mapProduct(RE_SERVICE)).to.deep.equal({ product: 'regional', mode: 'train' });
    });

    it('hebt den Fernverkehr über den Submode auf "national"', () => {
        const service: TriasService = { ServiceSection: { Mode: { PtMode: 'rail', RailSubmode: 'highSpeedRail' } } };
        expect(mapProduct(service)?.product).to.equal('national');
    });

    it('erkennt die S-Bahn über den Submode "suburbanRailway"', () => {
        const service: TriasService = { ServiceSection: { Mode: { PtMode: 'rail', RailSubmode: 'suburbanRailway' } } };
        expect(mapProduct(service)?.product).to.equal('suburban');
    });

    it('führt den Schienenersatzverkehr trotz PtMode=rail als Bus', () => {
        // Sonst zeigte die Oberfläche für einen Bus ein Zugsymbol.
        const service: TriasService = {
            ServiceSection: { Mode: { PtMode: 'rail', RailSubmode: 'replacementRailService' } },
        };
        expect(mapProduct(service)).to.deep.equal({ product: 'bus', mode: 'bus' });
    });

    it('fällt bei nichtssagendem Submode auf den PtMode zurück', () => {
        // Genau diese Kombination liefert die EFA-BW für den Bodenseeverkehr.
        const service: TriasService = { ServiceSection: { Mode: { PtMode: 'water', WaterSubmode: 'unknown' } } };
        expect(mapProduct(service)).to.deep.equal({ product: 'ferry', mode: 'watercraft' });
    });

    it('liefert kein Produkt, wenn das Verkehrsmittel unbekannt ist', () => {
        expect(mapProduct({ ServiceSection: { Mode: { PtMode: 'unknown' } } })).to.equal(undefined);
        expect(mapProduct({})).to.equal(undefined);
    });
});

describe('triasMapper => Linie', () => {
    it('nimmt den veröffentlichten Liniennamen', () => {
        expect(mapLine(RE_SERVICE)?.name).to.equal('RE14a');
    });

    it('fällt ohne veröffentlichten Namen auf die Modusbezeichnung zurück', () => {
        const service: TriasService = {
            ServiceSection: { Mode: { PtMode: 'rail', Name: { Text: 'NRB 17659 Regionalbahn' } } },
        };
        expect(mapLine(service)?.name).to.equal('NRB 17659 Regionalbahn');
    });
});

describe('triasMapper => Fehler und Attribute', () => {
    it('wertet Service-Attribute als Hinweise, nicht als Fehler', () => {
        const hints = mapRemarks(RE_SERVICE.Attribute);
        expect(hints).to.have.length(3);
        expect(hints?.[0]).to.include({ type: 'hint', code: 'EH' });
    });

    it('meldet keinen Fehler, wenn nur Attribute mit numerischem Code vorliegen', () => {
        // Der Kern der TRIAS-Falle: `Code` unter `Attribute` ist nie ein Fehler — auch dann
        // nicht, wenn er wie ein Fehlercode aussieht.
        expect(readError(undefined)).to.equal(undefined);
        expect(readError([])).to.equal(undefined);
    });

    it('liest eine echte Fehlermeldung samt Code und Text', () => {
        const text = readError([{ Code: '-4000', Text: { Text: 'TRIP_NOTRIPFOUND' } }]);
        expect(text).to.equal('-4000: TRIP_NOTRIPFOUND');
    });

    it('erkennt „nichts gefunden" als leeres Ergebnis, nicht als Fehler', () => {
        // Gemessen am 25.08.2026: nachts liefert der Abfahrtsmonitor -4030 statt einer leeren
        // Liste, die Ortssuche -8014/-8020 bei Eingaben ohne Treffer.
        expect(isEmptyResult([{ Code: '-4030', Text: { Text: 'STOPEVENT_NOEVENTFOUND' } }])).to.equal(true);
        expect(isEmptyResult([{ Code: '-8014', Text: { Text: 'LOCATION_NORESULTS' } }])).to.equal(true);
        expect(isEmptyResult([{ Code: '-8020', Text: { Text: 'LOCATION_NORESULTS' } }])).to.equal(true);
        expect(isEmptyResult([{ Code: '-4000', Text: { Text: 'TRIP_NOTRIPFOUND' } }])).to.equal(true);
    });

    it('lässt unbekannte Codes weiterhin Fehler sein', () => {
        expect(isEmptyResult([{ Code: '-9999', Text: { Text: 'TRIP_CANCELLED' } }])).to.equal(false);
        // Eine harmlose Meldung deckt die übrigen nicht zu.
        expect(isEmptyResult([{ Code: '-4030' }, { Code: '-1234' }])).to.equal(false);
        // Ohne Meldung gibt es nichts zu unterdrücken.
        expect(isEmptyResult([])).to.equal(false);
        expect(isEmptyResult(undefined)).to.equal(false);
    });
});

describe('triasMapper => Zeiten', () => {
    it('rechnet die Verspätung in Sekunden', () => {
        expect(delayInSeconds('2026-08-24T15:48:00Z', '2026-08-24T15:52:00Z')).to.equal(240);
    });

    it('liefert keine Verspätung ohne Echtzeit', () => {
        expect(delayInSeconds('2026-08-24T15:48:00Z', undefined)).to.equal(undefined);
    });

    it('versteht ISO-8601-Dauern inklusive Tagen', () => {
        expect(durationInMinutes('PT56M')).to.equal(56);
        expect(durationInMinutes('PT3H48M')).to.equal(228);
        expect(durationInMinutes('P1DT2H30M')).to.equal(1590);
        expect(durationInMinutes('kaputt')).to.equal(undefined);
    });
});

describe('triasMapper => Abfahrten', () => {
    it('übersetzt eine Abfahrt vollständig', () => {
        const departure = mapStopEvent(RE_STOP_EVENT);
        expect(departure.tripId).to.equal('ddb:90T14:A:H:j26:40');
        expect(departure.plannedWhen).to.equal('2026-08-24T15:48:00Z');
        expect(departure.when).to.equal('2026-08-24T15:52:00Z');
        expect(departure.delay).to.equal(240);
        expect(departure.direction).to.equal('Horb Bahnhof/ZOB');
        expect(departure.line?.product).to.equal('regional');
        expect(departure.stop?.name).to.equal('Stuttgart Hauptbahnhof (oben)');
    });

    it('zeigt bei einem Gleiswechsel das tatsächliche Gleis, behält aber das geplante', () => {
        const event: TriasStopEventResult = {
            StopEvent: {
                ThisCall: {
                    CallAtStop: {
                        PlannedBay: { Text: '5' },
                        EstimatedBay: { Text: '7' },
                        ServiceDeparture: { TimetabledTime: '2026-08-24T15:29:00Z' },
                    },
                },
                Service: RE_SERVICE,
            },
        };
        const departure = mapStopEvent(event);
        expect(departure.platform).to.equal('7');
        expect(departure.plannedPlatform).to.equal('5');
    });

    it('wertet für Ankünfte die Ankunftszeit aus', () => {
        const event: TriasStopEventResult = {
            StopEvent: {
                ThisCall: { CallAtStop: { ServiceArrival: { TimetabledTime: '2026-08-24T16:25:00Z' } } },
                Service: RE_SERVICE,
            },
        };
        expect(mapStopEvent(event, true).plannedWhen).to.equal('2026-08-24T16:25:00Z');
    });

    it('bildet eine Ersatzkennung, wenn die Fahrt keine JourneyRef trägt', () => {
        const event: TriasStopEventResult = {
            StopEvent: {
                ThisCall: { CallAtStop: { ServiceDeparture: { TimetabledTime: '2026-08-24T15:48:00Z' } } },
                Service: { ServiceSection: { LineRef: 'ddb:90T14:A:H' } },
            },
        };
        expect(mapStopEvent(event).tripId).to.equal('ddb:90T14:A:H#2026-08-24T15:48:00Z');
    });
});

describe('triasMapper => Orte', () => {
    it('setzt Ortsnamen und Haltestellennamen zusammen', () => {
        const result: TriasLocationResult = {
            Location: {
                StopPoint: { StopPointRef: 'de:08111:6115', StopPointName: { Text: 'Hauptbahnhof' } },
                LocationName: { Text: 'Stuttgart' },
                GeoPosition: { Longitude: '9.18317', Latitude: '48.78473' },
            },
            Probability: '1',
        };
        const stop = mapLocation(result) as { type: string; id: string; name: string; location: { latitude: number } };
        expect(stop.type).to.equal('stop');
        expect(stop.id).to.equal('de:08111:6115');
        expect(stop.name).to.equal('Stuttgart Hauptbahnhof');
        expect(stop.location.latitude).to.equal(48.784_73);
    });

    it('wiederholt den Ortsnamen nicht, wenn er im Haltestellennamen schon steckt', () => {
        const result: TriasLocationResult = {
            Location: {
                StopPoint: { StopPointRef: 'de:08436:8000', StopPointName: { Text: 'Ravensburg Bahnhof' } },
                LocationName: { Text: 'Ravensburg' },
            },
        };
        expect((mapLocation(result) as { name: string }).name).to.equal('Ravensburg Bahnhof');
    });
});

describe('triasMapper => Verbindungen', () => {
    it('übersetzt Abschnitte samt Zeiten und Gleisen', () => {
        const trip: TriasTripResult = {
            Trip: {
                TripId: 'ID-5155823D',
                Duration: 'PT56M',
                Interchanges: '0',
                TripLeg: [
                    {
                        LegId: '1',
                        TimedLeg: {
                            LegBoard: {
                                StopPointName: { Text: 'Stuttgart Hauptbahnhof (oben)' },
                                PlannedBay: { Text: '5' },
                                EstimatedBay: { Text: '7' },
                                ServiceDeparture: {
                                    TimetabledTime: '2026-08-24T15:29:00Z',
                                    EstimatedTime: '2026-08-24T15:30:00Z',
                                },
                            },
                            LegAlight: {
                                StopPointName: { Text: 'Karlsruhe Hauptbahnhof' },
                                ServiceArrival: { TimetabledTime: '2026-08-24T16:25:00Z' },
                            },
                            Service: RE_SERVICE,
                        },
                    },
                ],
            },
        };
        const journey = mapJourney(trip);
        expect(journey.legs).to.have.length(1);
        const leg = journey.legs[0];
        expect(leg.departure).to.equal('2026-08-24T15:30:00Z');
        expect(leg.departureDelay).to.equal(60);
        expect(leg.departurePlatform).to.equal('7');
        expect(leg.plannedDeparturePlatform).to.equal('5');
        expect(leg.destination?.name).to.equal('Karlsruhe Hauptbahnhof');
    });

    it('kennzeichnet Fußwege als solche', () => {
        const trip: TriasTripResult = {
            Trip: {
                TripLeg: [
                    {
                        LegId: '2',
                        ContinuousLeg: {
                            Duration: 'PT8M',
                            LegStart: { LocationName: { Text: 'A' } },
                            LegEnd: { LocationName: { Text: 'B' } },
                        },
                    },
                ],
            },
        };
        const leg = mapJourney(trip).legs[0];
        expect(leg.walking).to.equal(true);
        expect(leg.public).to.equal(false);
    });
});

describe('triasMapper => Produktfilter für die Anfrage', () => {
    it('nimmt "rail" mit auf, wenn Busse gewünscht sind', () => {
        // Sonst fehlte der Schienenersatzverkehr lautlos: PtMode `rail`, Produkt `bus`.
        const modes = ptModesForProducts({ bus: true });
        expect(modes).to.include('bus');
        expect(modes).to.include('rail');
    });

    it('schränkt auf Schienenverkehr ein, wenn nur Züge gewünscht sind', () => {
        const modes = ptModesForProducts({ regional: true, national: true });
        expect(modes).to.include('rail');
        expect(modes).to.not.include('bus');
    });

    it('verzichtet auf den Filter, wenn nichts eingeschränkt ist', () => {
        expect(ptModesForProducts(undefined)).to.equal(undefined);
        expect(ptModesForProducts({})).to.equal(undefined);
        expect(ptModesForProducts({ bus: false })).to.equal(undefined);
    });
});

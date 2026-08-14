/**
 * Übersetzt EFA-JSON (Mentz, `outputFormat=rapidJSON`) in das FPTF-/hafas-client-Format, das
 * der Adapter intern überall verwendet. Dadurch sieht der restliche Code keinen Unterschied
 * zwischen HAFAS, db-vendo, MOTIS und EFA.
 *
 * Grundlage: `claude:/home/tom/Claude/trias-docs/efa-json-fptf-mapping.md` (§2–§6), verifiziert
 * durch zwei PoC-Läufe gegen den VRR-Endpoint am 18.07.2026.
 *
 * Drei Eigenheiten von EFA, die hier gekapselt werden:
 * 1. `coord` kommt in der Antwort als `[latitude, longitude]` – umgekehrt zur Eingabe.
 * 2. Es gibt keinen fertigen Verspätungswert; `delay` wird aus Soll und Ist berechnet.
 * 3. Ein Umstieg erzeugt KEIN eigenes Fuß-Leg – der Umsteigeweg hängt als `footPathInfo`
 *    am Transit-Abschnitt und wird hier zu FPTF-Fußwegen synthetisiert.
 */
import type * as Hafas from 'hafas-client';
import type {
    EfaHint,
    EfaInfo,
    EfaJourney,
    EfaJourneyLocation,
    EfaLeg,
    EfaLocation,
    EfaStopEvent,
    EfaTransportation,
} from '../types/efaJson';

/**
 * MOT-Klasse (`transportation.product.class`) → FPTF-Produkt und -Verkehrsmittelart.
 *
 * Die Produkt-IDs entsprechen den Schlüsseln von `ioBroker.Products`, damit der Produktfilter
 * der Stations-Konfiguration ohne Übersetzungstabelle greift.
 *
 * ⚠️ Klasse 16 ist NICHT der Fernverkehr: Im PoC lieferte derselbe RE 2 im Abfahrtsmonitor
 * `class: 16` ("Zug") und in der Verbindungsauskunft `class: 13` ("Regionalzug"). Klasse 16
 * wird deshalb bewusst als `regional` geführt und nicht als `nationalExpress`.
 */
const MOT_MAP: Readonly<Record<number, { product: string; mode: Hafas.Line['mode'] }>> = {
    0: { product: 'national', mode: 'train' }, // Zug (Fernverkehr)
    1: { product: 'suburban', mode: 'train' }, // S-Bahn
    2: { product: 'subway', mode: 'train' }, // U-Bahn
    3: { product: 'tram', mode: 'train' }, // Stadtbahn
    4: { product: 'tram', mode: 'train' }, // Straßenbahn
    5: { product: 'bus', mode: 'bus' }, // Stadtbus
    6: { product: 'bus', mode: 'bus' }, // Regionalbus
    7: { product: 'bus', mode: 'bus' }, // Schnellbus
    8: { product: 'cableCar', mode: 'gondola' }, // Seil-/Zahnradbahn ('cableCar' = Schlüssel der Admin-UI)
    9: { product: 'ferry', mode: 'watercraft' }, // Schiff/Fähre
    10: { product: 'bus', mode: 'bus' }, // AST/Rufbus
    11: { product: 'tram', mode: 'train' }, // Sonstige (u. a. Schwebebahn)
    12: { product: 'aircraft', mode: 'aircraft' }, // Flugzeug
    13: { product: 'regional', mode: 'train' }, // Regionalzug
    14: { product: 'regional', mode: 'train' }, // Regionalzug
    15: { product: 'national', mode: 'train' }, // Fernzug
    16: { product: 'regional', mode: 'train' }, // "Zug" (Sammelklasse, siehe Hinweis oben)
    17: { product: 'bus', mode: 'bus' }, // Schienenersatzverkehr
    18: { product: 'regional', mode: 'train' }, // Zug
    19: { product: 'bus', mode: 'bus' }, // Bürgerbus
};

/**
 * MOT-Klasse für Fußwege. EFA liefert Fußwege NICHT als Abschnitt ohne Verkehrsmittel, sondern
 * mit einer eigenen Gattung (`product.class: 99`, `product.name: "footpath"`) und ohne
 * Liniennamen – wer nur auf ein fehlendes `transportation` prüft, führt sie als Fahrt.
 * Am 15.08.2026 am VRR-Endpoint belegt.
 */
const MOT_FOOTPATH = 99;

/**
 * Erkennt einen Fußweg-Abschnitt: entweder die Fußweg-Gattung oder gar kein Verkehrsmittel.
 *
 * @param transportation Der `transportation`-Block des Abschnitts
 */
function isFootpath(transportation?: EfaTransportation): boolean {
    return !transportation?.product || transportation.product.class === MOT_FOOTPATH;
}

/**
 * Realtime-Status-Token, die einen Ausfall bedeuten. Die Namen sind schema-gesichert
 * (JSON-Schema 10.6.21.17), nicht aus einer Stichprobe geraten.
 */
const CANCELLED_STATUS: ReadonlySet<string> = new Set(['TRIP_CANCELLED', 'DEPARTURE_CANCELLED', 'ARRIVAL_CANCELLED']);

/**
 * Rechnet die Verspätung in Sekunden aus Soll- und Ist-Zeit aus. EFA liefert keinen fertigen
 * Wert; ohne Ist-Zeit gibt es auch keine Verspätung (nicht 0 – das hieße "pünktlich").
 *
 * @param planned Soll-Zeit als ISO-String
 * @param estimated Ist-/Prognosezeit als ISO-String
 * @returns Verspätung in Sekunden oder `undefined`
 */
function delayInSeconds(planned?: string, estimated?: string): number | undefined {
    if (!planned || !estimated) {
        return undefined;
    }
    const diff = Date.parse(estimated) - Date.parse(planned);
    return Number.isFinite(diff) ? Math.round(diff / 1000) : undefined;
}

/**
 * Liest die Koordinaten eines EFA-Ortes.
 *
 * ⚠️ In der Antwort steht die Breite zuerst (`[lat, lon]`) – in der Anfrage ist es umgekehrt.
 *
 * @param coord Das `coord`-Array aus der EFA-Antwort
 */
function toLocation(coord?: number[]): Hafas.Location | undefined {
    if (!coord || coord.length < 2 || !Number.isFinite(coord[0]) || !Number.isFinite(coord[1])) {
        return undefined;
    }
    return { type: 'location', latitude: coord[0], longitude: coord[1] };
}

/**
 * Wandelt die MOT-Klassen einer Haltestelle in die FPTF-Produktliste um.
 *
 * @param productClasses `location.productClasses` aus der EFA-Antwort
 */
function toProducts(productClasses?: number[]): Hafas.Products | undefined {
    if (!productClasses?.length) {
        return undefined;
    }
    const products: Hafas.Products = {};
    for (const mot of productClasses) {
        const mapped = MOT_MAP[mot];
        if (mapped) {
            products[mapped.product] = true;
        }
    }
    return Object.keys(products).length > 0 ? products : undefined;
}

/**
 * Übersetzt einen EFA-Ort in ein FPTF-Objekt. Haltestellen werden zu `stop`, alles andere
 * (POI, Adresse, Straße) zu `location` – FPTF kennt für Nicht-Haltestellen keinen eigenen Typ.
 *
 * @param location Der EFA-Ort
 */
export function mapLocation(location?: EfaLocation): Hafas.Stop | Hafas.Location {
    if (!location) {
        return { type: 'location' };
    }
    const coords = toLocation(location.coord);
    if (location.type === 'stop' || location.type === 'platform') {
        // `name` ist der vollständige Haltestellenname ("Essen Hauptbahnhof"); `parent` ist bei
        // einem Steig die Haltestelle und bei einer Haltestelle der ORT ("Essen") – deshalb darf
        // parent den Namen nicht ersetzen.
        const parent = location.type === 'platform' && location.parent?.type === 'stop' ? location.parent : undefined;
        const stop: Hafas.Stop = {
            type: 'stop',
            id: location.id,
            name: location.name ?? location.disassembledName,
            location: coords,
            products: toProducts(
                location.productClasses ?? parent?.productClasses ?? location.assignedStops?.[0]?.productClasses,
            ),
            station: parent ? { type: 'station', id: parent.id, name: parent.name } : undefined,
        };
        return stop;
    }
    return {
        type: 'location',
        id: location.id,
        name: location.name,
        poi: location.type === 'poi' || undefined,
        address: location.type === 'address' ? location.name : undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
    };
}

/**
 * Baut die FPTF-Linie aus den EFA-Fahrtdaten.
 *
 * `number` ist bei EFA die LINIE ("RE 2"), die Fahrtnummer steht in
 * `properties.trainNumber` (Rückfall: `properties.tripCode`).
 *
 * @param transportation Der `transportation`-Block einer Abfahrt oder eines Abschnitts
 */
export function mapLine(transportation?: EfaTransportation): Hafas.Line | undefined {
    if (!transportation) {
        return undefined;
    }
    const mapped = transportation.product?.class !== undefined ? MOT_MAP[transportation.product.class] : undefined;
    const operatorName = transportation.operator?.name;
    const line: Hafas.Line = {
        type: 'line',
        id: transportation.id,
        name: transportation.disassembledName ?? transportation.number ?? transportation.name,
        fahrtNr: transportation.properties?.trainNumber ?? transportation.properties?.tripCode?.toString(),
        product: mapped?.product ?? transportation.product?.name,
        mode: mapped?.mode,
        operator: operatorName
            ? { type: 'operator', id: transportation.operator?.code ?? operatorName, name: operatorName }
            : undefined,
        public: true,
    };
    return line;
}

/**
 * Führt Störungstexte (`infos`) und Kurzhinweise (`hints`) zu FPTF-Remarks zusammen.
 * Leere Texte werden verworfen, damit keine Hinweis-Datenpunkte ohne Inhalt entstehen.
 *
 * @param infos Störungs-/Hinweistexte
 * @param hints Kurzhinweise
 */
export function mapRemarks(infos?: EfaInfo[], hints?: EfaHint[]): Hafas.Hint[] | undefined {
    const remarks: Hafas.Hint[] = [];
    for (const info of infos ?? []) {
        const text = info.content?.trim() || info.subtitle?.trim() || info.title?.trim();
        if (text) {
            remarks.push({ type: 'status', code: info.type, summary: info.title, text });
        }
    }
    for (const hint of hints ?? []) {
        const text = hint.content?.trim();
        if (text) {
            remarks.push({ type: 'hint', code: hint.infoType, text });
        }
    }
    return remarks.length > 0 ? remarks : undefined;
}

/**
 * Entscheidet, ob eine Fahrt/ein Abschnitt ausfällt.
 *
 * @param isCancelled Das boolesche EFA-Feld
 * @param realtimeStatus Die Statusliste der Echtzeitdaten
 */
function isCancelled(isCancelled?: boolean, realtimeStatus?: string[]): boolean | undefined {
    if (isCancelled === true) {
        return true;
    }
    if (realtimeStatus?.some(status => CANCELLED_STATUS.has(status))) {
        return true;
    }
    return undefined;
}

/**
 * Bildet eine Abfahrt des Abfahrtsmonitors auf eine FPTF-Alternative ab.
 *
 * @param event Ein `stopEvent` aus der DM-Antwort
 * @param arrival true, wenn Ankünfte statt Abfahrten abgefragt wurden
 */
export function mapStopEvent(event: EfaStopEvent, arrival = false): Hafas.Alternative {
    const planned = arrival
        ? (event.arrivalTimePlanned ?? event.location?.arrivalTimePlanned)
        : (event.departureTimePlanned ?? event.location?.departureTimePlanned);
    const estimated = arrival
        ? (event.arrivalTimeEstimated ?? event.location?.arrivalTimeEstimated)
        : (event.departureTimeEstimated ?? event.location?.departureTimeEstimated);
    const platform = event.location?.properties?.platform ?? event.location?.properties?.platformName;
    const plannedPlatform = event.location?.properties?.plannedPlatformName;

    return {
        // FPTF verlangt eine tripId. EFA hat keine eigene ID je Halt, deshalb aus Fahrt und
        // Soll-Zeit zusammengesetzt – innerhalb einer Antwort eindeutig und stabil über Polls.
        tripId: `${event.transportation?.id ?? event.transportation?.name ?? 'trip'}#${planned ?? ''}`,
        direction: event.transportation?.destination?.name,
        line: mapLine(event.transportation),
        stop: mapLocation(event.location) as Hafas.Stop,
        when: estimated ?? planned,
        plannedWhen: planned,
        delay: delayInSeconds(planned, estimated),
        platform: platform,
        plannedPlatform: plannedPlatform ?? platform,
        cancelled: isCancelled(event.isCancelled, event.realtimeStatus),
        remarks: mapRemarks(event.infos, event.hints),
        origin: event.transportation?.origin ? mapLocation(event.transportation.origin) : undefined,
        destination: event.transportation?.destination ? mapLocation(event.transportation.destination) : undefined,
    };
}

/**
 * Übersetzt die Haltefolge eines Abschnitts in FPTF-Zwischenhalte.
 *
 * @param stopSequence `leg.stopSequence` aus der EFA-Antwort
 */
export function mapStopovers(stopSequence?: EfaJourneyLocation[]): Hafas.StopOver[] | undefined {
    if (!stopSequence?.length) {
        return undefined;
    }
    return stopSequence.map(stop => ({
        stop: mapLocation(stop) as Hafas.Stop,
        departure: stop.departureTimeEstimated ?? stop.departureTimePlanned,
        plannedDeparture: stop.departureTimePlanned,
        departureDelay: delayInSeconds(stop.departureTimePlanned, stop.departureTimeEstimated),
        departurePlatform: stop.properties?.platform,
        plannedDeparturePlatform: stop.properties?.plannedPlatformName ?? stop.properties?.platform,
        arrival: stop.arrivalTimeEstimated ?? stop.arrivalTimePlanned,
        plannedArrival: stop.arrivalTimePlanned,
        arrivalDelay: delayInSeconds(stop.arrivalTimePlanned, stop.arrivalTimeEstimated),
        arrivalPlatform: stop.properties?.platform,
        plannedArrivalPlatform: stop.properties?.plannedPlatformName ?? stop.properties?.platform,
    }));
}

/**
 * Bildet einen Verbindungsabschnitt ab.
 *
 * @param leg Ein `leg` aus der Trip-Antwort
 */
function mapLeg(leg: EfaLeg): Hafas.Leg {
    const walking = isFootpath(leg.transportation);
    return {
        origin: mapLocation(leg.origin),
        destination: mapLocation(leg.destination),
        departure: leg.origin?.departureTimeEstimated ?? leg.origin?.departureTimePlanned,
        plannedDeparture: leg.origin?.departureTimePlanned,
        departureDelay: delayInSeconds(leg.origin?.departureTimePlanned, leg.origin?.departureTimeEstimated),
        departurePlatform: leg.origin?.properties?.platform,
        plannedDeparturePlatform: leg.origin?.properties?.plannedPlatformName ?? leg.origin?.properties?.platform,
        arrival: leg.destination?.arrivalTimeEstimated ?? leg.destination?.arrivalTimePlanned,
        plannedArrival: leg.destination?.arrivalTimePlanned,
        arrivalDelay: delayInSeconds(leg.destination?.arrivalTimePlanned, leg.destination?.arrivalTimeEstimated),
        arrivalPlatform: leg.destination?.properties?.platform,
        plannedArrivalPlatform:
            leg.destination?.properties?.plannedPlatformName ?? leg.destination?.properties?.platform,
        line: walking ? undefined : mapLine(leg.transportation),
        direction: walking ? undefined : leg.transportation?.destination?.name,
        stopovers: mapStopovers(leg.stopSequence),
        walking: walking || undefined,
        public: true,
        distance: leg.distance,
        cancelled: isCancelled(undefined, leg.realtimeStatus),
        remarks: mapRemarks(leg.infos, leg.hints),
    };
}

/**
 * Erzeugt aus einem Umsteigeweg (`footPathInfo`) einen FPTF-Fußweg.
 *
 * EFA modelliert den Umstieg als Anhang am Transit-Abschnitt, FPTF dagegen als eigenen
 * Abschnitt mit `walking: true`. Ohne diese Synthese hätte eine Verbindung mit Umstieg im
 * Adapter eine Lücke zwischen Ankunft und nächster Abfahrt.
 *
 * @param from Ort, an dem der Fußweg beginnt
 * @param to Ort, an dem der Fußweg endet
 * @param duration Dauer des Fußwegs in Sekunden
 */
function buildWalkingLeg(
    from: EfaJourneyLocation | undefined,
    to: EfaJourneyLocation | undefined,
    duration?: number,
): Hafas.Leg {
    const departure = from?.arrivalTimeEstimated ?? from?.arrivalTimePlanned;
    const arrival = to?.departureTimeEstimated ?? to?.departureTimePlanned;
    return {
        origin: mapLocation(from),
        destination: mapLocation(to),
        departure,
        plannedDeparture: from?.arrivalTimePlanned,
        arrival,
        plannedArrival: to?.departureTimePlanned,
        walking: true,
        public: true,
        // Sekunden aus footPathInfo; nur setzen, wenn EFA sie liefert.
        distance: undefined,
        line: undefined,
        remarks: duration
            ? [{ type: 'hint', code: 'footpath', text: `Transfer on foot: ${Math.round(duration / 60)} min` }]
            : undefined,
    };
}

/**
 * Bildet eine komplette Verbindung ab und ergänzt die Umsteigewege als eigene Fußweg-Abschnitte.
 *
 * @param journey Eine `journey` aus der Trip-Antwort
 */
export function mapJourney(journey: EfaJourney): Hafas.Journey {
    const legs: Hafas.Leg[] = [];
    const efaLegs = journey.legs ?? [];

    for (let i = 0; i < efaLegs.length; i++) {
        const leg = efaLegs[i];
        legs.push(mapLeg(leg));

        // Umsteigeweg NACH diesem Abschnitt: nur einfügen, wenn ein weiterer Abschnitt folgt.
        // `footPathInfoRedundant: true` heißt, dass der Weg bereits in der Umsteigezeit zwischen
        // den beiden Abschnitten steckt – ihn dann zusätzlich als Abschnitt zu zeigen, würde die
        // Zeit doppelt zählen. Der VRR setzt das Flag bei bahnsteiggleichen Umstiegen durchweg
        // (15.08.2026 geprüft); andere EFA-Verbünde liefern hier auch `false`.
        const next = efaLegs[i + 1];
        if (!next || leg.footPathInfoRedundant) {
            continue;
        }
        const after = leg.footPathInfo?.find(info => info.position === 'AFTER');
        const before = next.footPathInfo?.find(info => info.position === 'BEFORE');
        const transfer = after ?? before;
        // Kein synthetischer Fußweg, wenn der nächste Abschnitt ohnehin schon einer ist.
        if (transfer && !isFootpath(next.transportation)) {
            legs.push(buildWalkingLeg(leg.destination, next.origin, transfer.duration));
        }
    }

    return { type: 'journey', legs };
}

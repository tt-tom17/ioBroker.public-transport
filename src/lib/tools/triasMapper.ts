/**
 * Übersetzt TRIAS-Antworten (VDV 431-2 v1.2) nach FPTF, dem Datenmodell von hafas-client.
 *
 * TRIAS ist ein **Standard**: Verkehrsmittel, Zeitangaben und Fehlercodes sind in der
 * VDV-Schnittstellenbeschreibung samt XSD festgelegt. Die Zuordnungstabellen unten stammen
 * deshalb aus der Enumeration des Schemas (`Trias_ModesSupport.xsd`) und nicht aus einer
 * Stichprobe an einem einzelnen Server – so trägt derselbe Mapper auch für einen zweiten
 * TRIAS-Anbieter. Gegenprobe am 24.08.2026: Die neun an der EFA-BW real gelieferten
 * Mode-Kombinationen sind sämtlich Teil der Enumeration.
 *
 * ⚠️ Zeiten kommen durchgängig in **UTC/Zulu**; sie werden unverändert weitergereicht, weil
 * FPTF ISO-8601 mit Zonenangabe erwartet.
 */
import type * as Hafas from 'hafas-client';
import type {
    TriasAttribute,
    TriasCallAtStop,
    TriasErrorMessage,
    TriasLocationResult,
    TriasService,
    TriasStopEventResult,
    TriasText,
    TriasTripLeg,
    TriasTripResult,
} from '../types/trias';

/** FPTF-Produkt und -Verkehrsmittelart, wie sie der Adapter kennt. */
interface ProductMapping {
    /** Schlüssel aus `ioBroker.Products` – muss zu den Keys der Admin-UI passen, sonst greift der Produktfilter ins Leere. */
    product: string;
    mode: Hafas.Line['mode'];
}

/**
 * Grundzuordnung je `PtMode` (alle 15 Werte der `PtModesEnumeration`).
 *
 * Sie gilt immer dann, wenn kein Submode gesetzt ist oder der Submode nichts Abweichendes
 * aussagt. `all` und `unknown` sind Sammelwerte des Schemas und liefern bewusst kein Produkt –
 * der Aufrufer entscheidet dann, ob er die Fahrt ungefiltert durchlässt.
 */
const PT_MODE_MAP: Readonly<Record<string, ProductMapping>> = {
    air: { product: 'aircraft', mode: 'aircraft' },
    bus: { product: 'bus', mode: 'bus' },
    trolleyBus: { product: 'bus', mode: 'bus' },
    tram: { product: 'tram', mode: 'train' },
    coach: { product: 'bus', mode: 'bus' },
    rail: { product: 'regional', mode: 'train' },
    intercityRail: { product: 'national', mode: 'train' },
    urbanRail: { product: 'suburban', mode: 'train' },
    metro: { product: 'subway', mode: 'train' },
    water: { product: 'ferry', mode: 'watercraft' },
    cableway: { product: 'cableCar', mode: 'gondola' },
    funicular: { product: 'cableCar', mode: 'gondola' },
    // Der Adapter kennt kein eigenes Taxi-Produkt; Anruf-Sammeltaxis laufen deshalb unter Bus,
    // behalten aber die FPTF-Verkehrsmittelart `taxi`.
    taxi: { product: 'bus', mode: 'taxi' },
};

/**
 * Submodes, die **vom `PtMode` abweichen**. Alle übrigen Submodes der Enumeration folgen der
 * Grundzuordnung oben – die Tabelle bleibt dadurch kurz und trotzdem vollständig.
 *
 * Die Abweichungen sind fast alle im Schienenverkehr zu Hause, weil `rail` alles von der
 * Regionalbahn bis zum Nachtzug umfasst:
 * - Fernverkehrsarten heben von `regional` auf `national`,
 * - `suburbanRailway` ist die S-Bahn,
 * - ⚠️ `replacementRailService` ist trotz `PtMode=rail` ein **Bus** (Schienenersatzverkehr) –
 *   wer ihn als Zug führt, zeigt dem Anwender ein falsches Symbol,
 * - ⚠️ `rackAndPinionRailway` (Zahnradbahn) wird wie bei den übrigen Backends unter `cableCar`
 *   geführt, weil der Adapter keine eigene Kategorie dafür hat.
 */
const SUBMODE_OVERRIDES: Readonly<Record<string, ProductMapping>> = {
    // RailSubmodeEnumeration
    highSpeedRail: { product: 'national', mode: 'train' },
    suburbanRailway: { product: 'suburban', mode: 'train' },
    longDistance: { product: 'national', mode: 'train' },
    international: { product: 'national', mode: 'train' },
    sleeperRailService: { product: 'national', mode: 'train' },
    nightRail: { product: 'national', mode: 'train' },
    carTransportRailService: { product: 'national', mode: 'train' },
    crossCountryRail: { product: 'national', mode: 'train' },
    replacementRailService: { product: 'bus', mode: 'bus' },
    rackAndPinionRailway: { product: 'cableCar', mode: 'gondola' },
    // MetroSubmodeEnumeration: `urbanRailway` ist die S-Bahn, nicht die U-Bahn.
    urbanRailway: { product: 'suburban', mode: 'train' },
    // AirSubmodeEnumeration: Ein Kanalschiff ist trotz Einordnung unter `air` kein Flug.
    canalBarge: { product: 'ferry', mode: 'watercraft' },
};

/**
 * Feldnamen aller Submode-Ausprägungen (`RailSubmode`, `BusSubmode`, …). TRIAS benennt das
 * Feld je Modus anders, es ist aber immer höchstens eines gesetzt.
 */
const SUBMODE_FIELDS = [
    'RailSubmode',
    'BusSubmode',
    'TramSubmode',
    'MetroSubmode',
    'WaterSubmode',
    'AirSubmode',
    'CoachSubmode',
    'FunicularSubmode',
    'TelecabinSubmode',
    'TaxiSubmode',
] as const;

/**
 * Sammelwerte des Schemas, die keine Aussage über das Verkehrsmittel treffen. Sie werden
 * übersprungen, damit die Grundzuordnung des `PtMode` greift.
 */
const UNSPECIFIC_MODES: ReadonlySet<string> = new Set(['unknown', 'undefined', 'all', 'undefinedFunicular']);

/**
 * Liest den Nutztext aus einem TRIAS-Textelement.
 *
 * @param text Das Textelement
 */
export function textOf(text?: TriasText | string): string | undefined {
    if (typeof text === 'string') {
        return text.trim() || undefined;
    }
    const value = text?.Text;
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

/**
 * Rechnet die Abweichung zwischen Soll- und Ist-Zeit in Sekunden um – die Einheit, die FPTF
 * für `delay` erwartet.
 *
 * @param planned Sollzeit (ISO 8601)
 * @param estimated Istzeit (ISO 8601)
 */
export function delayInSeconds(planned?: string, estimated?: string): number | undefined {
    if (!planned || !estimated) {
        return undefined;
    }
    const from = Date.parse(planned);
    const to = Date.parse(estimated);
    if (Number.isNaN(from) || Number.isNaN(to)) {
        return undefined;
    }
    return Math.round((to - from) / 1000);
}

/**
 * Wandelt eine ISO-8601-Dauer (`PT3H48M`) in Minuten.
 *
 * TRIAS gibt Fahrt- und Umstiegsdauern ausschließlich in dieser Form an. Tage werden
 * mitgerechnet, weil Nachtverbindungen über Mitternacht laufen.
 *
 * @param duration Die Dauer im ISO-8601-Format
 */
export function durationInMinutes(duration?: string): number | undefined {
    if (!duration) {
        return undefined;
    }
    const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(duration.trim());
    if (!match) {
        return undefined;
    }
    const [, days, hours, minutes, seconds] = match;
    const total = Number(days ?? 0) * 1440 + Number(hours ?? 0) * 60 + Number(minutes ?? 0) + Number(seconds ?? 0) / 60;
    return total > 0 ? Math.round(total) : undefined;
}

/**
 * Bestimmt Produkt und Verkehrsmittelart einer Fahrt.
 *
 * Vorgehen: erst der Submode (er ist genauer), sonst der `PtMode`. Sammelwerte wie `unknown`
 * werden dabei übergangen, damit z. B. `water` + `WaterSubmode=unknown` trotzdem als Fähre
 * erkannt wird – genau diese Kombination liefert die EFA-BW für den Bodenseeverkehr.
 *
 * @param service Die Fahrt aus der TRIAS-Antwort
 */
export function mapProduct(service?: TriasService): ProductMapping | undefined {
    const mode = service?.ServiceSection?.Mode;
    if (!mode) {
        return undefined;
    }
    for (const field of SUBMODE_FIELDS) {
        const value = mode[field];
        if (typeof value === 'string' && !UNSPECIFIC_MODES.has(value)) {
            const override = SUBMODE_OVERRIDES[value];
            if (override) {
                return override;
            }
            break; // Submode bekannt, aber ohne Abweichung -> PtMode entscheidet
        }
    }
    const ptMode = mode.PtMode;
    return ptMode && !UNSPECIFIC_MODES.has(ptMode) ? PT_MODE_MAP[ptMode] : undefined;
}

/**
 * Baut die FPTF-Linie einer Fahrt.
 *
 * @param service Die Fahrt aus der TRIAS-Antwort
 */
export function mapLine(service?: TriasService): Hafas.Line | undefined {
    if (!service) {
        return undefined;
    }
    const section = service.ServiceSection;
    const mapping = mapProduct(service);
    // `PublishedLineName` ist der Name, den der Verbund anzeigt (z. B. `RE14a`). Fehlt er,
    // bleibt der ausformulierte Modusname („NRB 17659 Regionalbahn") als Rückfallebene.
    const name = textOf(section?.PublishedLineName) ?? textOf(section?.Mode?.Name);
    return {
        type: 'line',
        id: section?.LineRef,
        name: name,
        product: mapping?.product,
        mode: mapping?.mode,
        operator: section?.OperatorRef
            ? { type: 'operator', id: section.OperatorRef, name: section.OperatorRef }
            : undefined,
    };
}

/**
 * Übersetzt einen Halt.
 *
 * @param call Der Halt aus der TRIAS-Antwort
 */
export function mapStop(call?: TriasCallAtStop & { LocationName?: TriasText }): Hafas.Stop | undefined {
    const id = call?.StopPointRef;
    const name = textOf(call?.StopPointName) ?? textOf(call?.LocationName);
    if (!id && !name) {
        return undefined;
    }
    return { type: 'stop', id: id, name: name };
}

/**
 * Übersetzt einen Treffer der Ortssuche.
 *
 * @param result Der Treffer aus der TRIAS-Antwort
 */
export function mapLocation(result: TriasLocationResult): Hafas.Stop | Hafas.Location {
    const stopPoint = result.Location?.StopPoint;
    const position = result.Location?.GeoPosition;
    const latitude = position?.Latitude !== undefined ? Number(position.Latitude) : undefined;
    const longitude = position?.Longitude !== undefined ? Number(position.Longitude) : undefined;
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

    // TRIAS trennt Ortsnamen (`LocationName`, z. B. „Stuttgart") und Haltestellennamen
    // (`StopPointName`, z. B. „Hauptbahnhof"). Für die Anzeige ist die Kombination die
    // brauchbare Angabe – der Haltestellenname allein ist in einer Trefferliste mehrdeutig.
    const ort = textOf(result.Location?.LocationName);
    const halt = textOf(stopPoint?.StopPointName);
    const name = ort && halt && !halt.includes(ort) ? `${ort} ${halt}` : (halt ?? ort);

    if (!stopPoint?.StopPointRef) {
        return {
            type: 'location',
            name: name,
            latitude: hasCoordinates ? latitude : undefined,
            longitude: hasCoordinates ? longitude : undefined,
        };
    }
    return {
        type: 'stop',
        id: stopPoint.StopPointRef,
        name: name,
        location: hasCoordinates ? { type: 'location', latitude: latitude, longitude: longitude } : undefined,
    };
}

/**
 * Übersetzt die Service-Attribute (Fahrradmitnahme, Klimaanlage …) in FPTF-Hinweise.
 *
 * ⚠️ Hier steckt die TRIAS-Falle: Diese Elemente führen ebenfalls ein Feld `Code`, das aber
 * **nie** einen Fehler bezeichnet – gemessen wurden neben Kürzeln wie `FK` auch `"1"`, `"28"`
 * und lange technische Kennungen. Fehler stehen ausschließlich unter `ErrorMessage`
 * (s. {@link readError}); eine Unterscheidung am Feldnamen oder daran, ob der Wert numerisch
 * ist, wäre falsch.
 *
 * @param attributes Die Attribute der Fahrt
 */
export function mapRemarks(attributes?: TriasAttribute[]): Hafas.Hint[] | undefined {
    const hints = (attributes ?? [])
        .map(attribute => ({ text: textOf(attribute.Text), code: attribute.Code }))
        .filter((hint): hint is { text: string; code: string | undefined } => Boolean(hint.text))
        // `as const` statt einer Typzusicherung: Eine Zusicherung auf Hafas.Hint hält ESLint für
        // überflüssig und entfernt sie mit --fix, wodurch der Literaltyp verlorengeht.
        .map(hint => ({ type: 'hint' as const, code: hint.code, text: hint.text }));
    return hints.length > 0 ? hints : undefined;
}

/**
 * Liest den Ausfall-Status einer Fahrt.
 *
 * TRIAS liefert die Flags als Text (`true`/`false`), nicht als Boolean – ein direkter
 * Wahrheitstest auf den String wäre für `"false"` fälschlich wahr.
 *
 * @param service Die Fahrt aus der TRIAS-Antwort
 */
function isCancelled(service?: TriasService): boolean | undefined {
    if (service?.Cancelled === undefined) {
        return undefined;
    }
    return String(service.Cancelled).toLowerCase() === 'true';
}

/**
 * Übersetzt ein Abfahrts-/Ankunftsereignis des Abfahrtsmonitors.
 *
 * @param result Das Ereignis aus der TRIAS-Antwort
 * @param arrival true = Ankunft statt Abfahrt auswerten
 */
export function mapStopEvent(result: TriasStopEventResult, arrival = false): Hafas.Alternative {
    const call = result.StopEvent?.ThisCall?.CallAtStop;
    const service = result.StopEvent?.Service;
    const times = arrival ? call?.ServiceArrival : call?.ServiceDeparture;
    const planned = times?.TimetabledTime;
    const estimated = times?.EstimatedTime;

    // Der geplante Steig ist die Fahrplanangabe, der geschätzte die aktuelle. Weichen sie ab,
    // ist das ein Gleiswechsel – gemessen am 24.08.2026 (Gleis 5 geplant, Gleis 7 tatsächlich).
    const plannedPlatform = textOf(call?.PlannedBay);
    const platform = textOf(call?.EstimatedBay) ?? plannedPlatform;

    return {
        // `JourneyRef` ist die Fahrtkennung des Verbunds und über Polls hinweg stabil. Fehlt
        // sie, wird wie im EFA-Backend aus Linie und Sollzeit ein Ersatz gebildet.
        tripId: service?.JourneyRef ?? `${service?.ServiceSection?.LineRef ?? 'trip'}#${planned ?? ''}`,
        direction: textOf(service?.DestinationText),
        line: mapLine(service),
        stop: mapStop(call),
        when: estimated ?? planned,
        plannedWhen: planned,
        delay: delayInSeconds(planned, estimated),
        platform: platform,
        plannedPlatform: plannedPlatform,
        cancelled: isCancelled(service),
        remarks: mapRemarks(service?.Attribute),
        origin: service?.OriginText
            ? { type: 'stop', id: service.OriginStopPointRef, name: textOf(service.OriginText) }
            : undefined,
        destination: service?.DestinationText
            ? {
                  type: 'stop',
                  id: service.DestinationStopPointRef,
                  name: textOf(service.DestinationText),
              }
            : undefined,
    };
}

/**
 * Übersetzt einen Abschnitt einer Verbindung.
 *
 * TRIAS kennt drei Ausprägungen: `TimedLeg` (Fahrt), `ContinuousLeg` (Fußweg/individuell) und
 * `InterchangeLeg` (expliziter Umstieg). Alle drei werden behandelt, auch wenn die EFA-BW am
 * 24.08.2026 ausschließlich `TimedLeg` lieferte – ein unbehandelter Legtyp wäre eine stille
 * Lücke im Verlauf, und der Standard sieht die anderen beiden ausdrücklich vor.
 *
 * @param leg Der Abschnitt aus der TRIAS-Antwort
 */
export function mapLeg(leg: TriasTripLeg): Hafas.Leg | undefined {
    if (leg.TimedLeg) {
        const timed = leg.TimedLeg;
        const board = timed.LegBoard;
        const alight = timed.LegAlight;
        const departurePlanned = board?.ServiceDeparture?.TimetabledTime;
        const departureEstimated = board?.ServiceDeparture?.EstimatedTime;
        const arrivalPlanned = alight?.ServiceArrival?.TimetabledTime;
        const arrivalEstimated = alight?.ServiceArrival?.EstimatedTime;
        const plannedDeparturePlatform = textOf(board?.PlannedBay);
        const plannedArrivalPlatform = textOf(alight?.PlannedBay);

        return {
            tripId: timed.Service?.JourneyRef,
            origin: mapStop(board),
            destination: mapStop(alight),
            departure: departureEstimated ?? departurePlanned,
            plannedDeparture: departurePlanned,
            departureDelay: delayInSeconds(departurePlanned, departureEstimated),
            departurePlatform: textOf(board?.EstimatedBay) ?? plannedDeparturePlatform,
            plannedDeparturePlatform: plannedDeparturePlatform,
            arrival: arrivalEstimated ?? arrivalPlanned,
            plannedArrival: arrivalPlanned,
            arrivalDelay: delayInSeconds(arrivalPlanned, arrivalEstimated),
            arrivalPlatform: textOf(alight?.EstimatedBay) ?? plannedArrivalPlatform,
            plannedArrivalPlatform: plannedArrivalPlatform,
            line: mapLine(timed.Service),
            direction: textOf(timed.Service?.DestinationText),
            cancelled: isCancelled(timed.Service),
            remarks: mapRemarks(timed.Service?.Attribute),
            stopovers: (timed.LegIntermediates ?? [])
                .map(stop => ({
                    stop: mapStop(stop),
                    arrival: stop.ServiceArrival?.EstimatedTime ?? stop.ServiceArrival?.TimetabledTime,
                    plannedArrival: stop.ServiceArrival?.TimetabledTime,
                    departure: stop.ServiceDeparture?.EstimatedTime ?? stop.ServiceDeparture?.TimetabledTime,
                    plannedDeparture: stop.ServiceDeparture?.TimetabledTime,
                }))
                .filter(stopover => stopover.stop),
        };
    }

    const continuous = leg.ContinuousLeg ?? leg.InterchangeLeg;
    if (!continuous) {
        return undefined;
    }
    // Fußweg bzw. Umstieg: FPTF kennzeichnet beides über `walking: true`; eine Linie gibt es
    // nicht.
    //
    // ⚠️ Die Zeiten stehen in `TimeWindowStart`/`TimeWindowEnd` — `ServiceDeparture` und
    // `ServiceArrival` gehören zum `TimedLeg` und fehlen hier immer. Gemessen am 25.08.2026:
    // ein `ContinuousLeg` führt `TimeWindowStart`, `TimeWindowEnd`, `Duration` und `Length`,
    // ein `InterchangeLeg` zusätzlich `WalkDuration` und `BufferTime`. Ohne diese Zeiten bleibt
    // eine Verbindung, die mit einem Fußweg beginnt oder endet, ohne Abfahrt, Ankunft und Dauer.
    const minutes = durationInMinutes(continuous.Duration);
    const start = continuous.LegStart;
    const end = continuous.LegEnd;
    const departure = continuous.TimeWindowStart ?? start?.ServiceDeparture?.TimetabledTime;
    const arrival = continuous.TimeWindowEnd ?? end?.ServiceArrival?.TimetabledTime;
    const length = Number(continuous.Length);
    return {
        origin: mapStop(start),
        destination: mapStop(end),
        departure: departure,
        plannedDeparture: departure,
        arrival: arrival,
        plannedArrival: arrival,
        walking: true,
        // FPTF sieht die Weglänge in Metern für Fußwege vor; TRIAS liefert sie als `Length`.
        distance: Number.isFinite(length) ? length : undefined,
        public: false,
        remarks: minutes ? ([{ type: 'hint', text: `${minutes} min` }] as Hafas.Hint[]) : undefined,
    };
}

/**
 * Übersetzt eine vollständige Verbindung.
 *
 * ⚠️ Die Umstiegszahl kommt aus `Trip/Interchanges` und **nicht** aus der Anzahl der
 * Abschnitte: Die EFA-BW modelliert Umstiege implizit als aufeinanderfolgende `TimedLeg`
 * ohne eigenen `InterchangeLeg` (gemessen 24.08.2026 – drei Fahrtabschnitte bei
 * `Interchanges=2`). Wer die Legs zählt, käme je nach Server auf ein anderes Ergebnis.
 *
 * @param result Die Verbindung aus der TRIAS-Antwort
 */
export function mapJourney(result: TriasTripResult): Hafas.Journey {
    const trip = result.Trip;
    const legs = (trip?.TripLeg ?? []).map(mapLeg).filter((leg): leg is Hafas.Leg => Boolean(leg));

    // Rückfallebene für die Ränder: Der Adapter bildet Abfahrt, Ankunft und Dauer der Verbindung
    // aus `legs[0].departure` und `legs[n].arrival` (journeys.ts). Fehlt dort die Zeit — ein
    // Abschnitt ohne `TimeWindow* ` —, stünde die Verbindung ohne Zeiten und mit Dauer `-1` da.
    // `Trip/StartTime` und `Trip/EndTime` gelten für die gesamte Verbindung und schließen die Lücke.
    const erster = legs[0];
    if (erster && !erster.departure && trip?.StartTime) {
        erster.departure = trip.StartTime;
        erster.plannedDeparture ??= trip.StartTime;
    }
    const letzter = legs[legs.length - 1];
    if (letzter && !letzter.arrival && trip?.EndTime) {
        letzter.arrival = trip.EndTime;
        letzter.plannedArrival ??= trip.EndTime;
    }

    return {
        type: 'journey',
        refreshToken: trip?.TripId ?? result.ResultId,
        legs: legs,
    };
}

/**
 * Abfahrtszeitpunkt einer Verbindung in Millisekunden.
 *
 * Gebraucht, um vergangene Verbindungen auszusortieren: Die EFA-BW liefert zu einer Anfrage ab
 * „jetzt" auch Trips, die davor liegen (gemessen 25.08.2026 nachts: 3 von 13, tagsüber 1 von 7).
 * Wer die Liste einfach kürzt, zeigt dem Anwender Verbindungen von gestern.
 *
 * @param result Das Ergebnis einer Verbindungsauskunft
 */
export function tripStartTime(result: TriasTripResult): number | undefined {
    const start = result.Trip?.StartTime;
    const zeit = start ? new Date(start).getTime() : Number.NaN;
    return Number.isFinite(zeit) ? zeit : undefined;
}

/**
 * Sucht die echte Fehlermeldung einer Antwort.
 *
 * **Der einzige Ort, an dem ein `Code` einen Fehler bedeutet.** Gemessen am 24.08.2026:
 * `TripResponse.ErrorMessage.Code = "-4000"` mit dem Text unter `ErrorMessage.Text.Text`.
 * Die Doku nennt zusätzlich Fehlermeldungen je Ergebniselement, deshalb nimmt die Funktion
 * beide Ebenen entgegen.
 *
 * Bekannte Codes (`EFA9_Errorcodes_V1.2.pdf`): `-4000` keine Verbindung zur gewünschten Zeit,
 * `-4001` Datum außerhalb der Fahrplanperiode, `-4006` nur Fußweg gefunden, `-4007` Start =
 * Ziel, `-4030` keine Abfahrten, `-7000` keine Linien, `-9999` Fahrt fällt aus.
 *
 * @param messages Die Fehlermeldungen der Antwort
 */
export function readError(messages?: TriasErrorMessage[]): string | undefined {
    const relevant = (messages ?? []).filter(message => message.Code !== undefined || textOf(message.Text));
    if (relevant.length === 0) {
        return undefined;
    }
    return relevant.map(message => `${message.Code ?? '?'}: ${textOf(message.Text) ?? 'unknown error'}`).join(' | ');
}

/**
 * Codes, die keinen Fehler bezeichnen, sondern ein leeres Ergebnis.
 *
 * TRIAS kennt keine leere Antwort: Statt einer leeren Ergebnisliste kommt eine `ErrorMessage`.
 * Gemessen am 25.08.2026 gegen `efa-bw.de/trias`: Freiburg im Breisgau Bad
 * (`de:08311:30605`) meldet um 02:30 Uhr im 60-Minuten-Fenster `-4030`, dieselbe Anfrage mit
 * 480 Minuten liefert zehn Abfahrten. Wer diese Codes als Fehler behandelt, protokolliert jede
 * Nachtstunde als Störung — HAFAS und EFA geben in derselben Lage eine leere Liste zurück.
 *
 * `-8014` und `-8020` kommen aus der Ortssuche, solange die Eingabe zu keinem Treffer führt.
 */
const EMPTY_RESULT_CODES = new Set(['-4000', '-4030', '-8014', '-8020']);

/**
 * Prüft, ob eine Fehlermeldung nur „nichts gefunden" bedeutet.
 *
 * Nur wenn **alle** gemeldeten Codes bekannt harmlos sind: Eine unbekannte Meldung in derselben
 * Antwort macht sie wieder zum Fehler, damit ein echter Defekt nicht neben einem `-4030`
 * untergeht.
 *
 * @param messages Die Fehlermeldungen der Antwort
 */
export function isEmptyResult(messages?: TriasErrorMessage[]): boolean {
    const relevant = (messages ?? []).filter(message => message.Code !== undefined || textOf(message.Text));
    return relevant.length > 0 && relevant.every(message => EMPTY_RESULT_CODES.has(String(message.Code)));
}

/**
 * Ordnet die abweichenden Submodes ihrem `PtMode` zu.
 *
 * Nötig für den Rückschluss vom Produkt auf den PtMode: Ein Submode kann ein Produkt in einen
 * fremden PtMode verschieben – der Schienenersatzverkehr etwa hat `PtMode=rail`, ist für den
 * Anwender aber ein Bus. Nur die Modi mit solchen Abweichungen stehen hier.
 */
const SUBMODE_BY_MODE: Readonly<Record<string, readonly string[]>> = {
    rail: [
        'highSpeedRail',
        'suburbanRailway',
        'longDistance',
        'international',
        'sleeperRailService',
        'nightRail',
        'carTransportRailService',
        'crossCountryRail',
        'replacementRailService',
        'rackAndPinionRailway',
    ],
    metro: ['urbanRailway'],
    air: ['canalBarge'],
};

/**
 * Bestimmt die `PtMode`-Werte, die nötig sind, um die gewünschten Produkte abzudecken.
 *
 * Damit lässt sich der Produktfilter **serverseitig** vorschalten (`PtModeFilter` im Request) –
 * ein Vorteil gegenüber dem EFA-Backend, wo erst nach dem Mapping gefiltert werden kann.
 *
 * Die Zuordnung ist nicht umkehrbar eindeutig (`national`, `regional` und `suburban` sind
 * allesamt `rail`), deshalb fällt das Ergebnis bewusst **großzügig** aus: Es schließt nur aus,
 * was sicher nicht gebraucht wird. Die genaue Auswahl trifft danach der Filter über das
 * FPTF-Produkt. Zu eng gefiltert hieße hier: Fahrten verschwinden lautlos.
 *
 * @param products Der Produktfilter aus den Abfrage-Optionen
 * @returns die benötigten PtMode-Werte, oder `undefined`, wenn eine Einschränkung nichts brächte
 */
export function ptModesForProducts(products?: Record<string, boolean | undefined>): string[] | undefined {
    const entries = Object.entries(products ?? {});
    const wanted = new Set(entries.filter(([, enabled]) => enabled).map(([id]) => id));
    if (wanted.size === 0) {
        return undefined;
    }

    const modes = new Set<string>();
    for (const [ptMode, mapping] of Object.entries(PT_MODE_MAP)) {
        if (wanted.has(mapping.product)) {
            modes.add(ptMode);
        }
    }
    for (const [ptMode, submodes] of Object.entries(SUBMODE_BY_MODE)) {
        if (submodes.some(submode => wanted.has(SUBMODE_OVERRIDES[submode].product))) {
            modes.add(ptMode);
        }
    }

    // Deckt die Auswahl ohnehin alle Modi ab, wäre der Filter nur unnötiger Ballast im Request.
    return modes.size > 0 && modes.size < Object.keys(PT_MODE_MAP).length ? [...modes] : undefined;
}

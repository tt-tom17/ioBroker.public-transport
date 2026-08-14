/**
 * Typen der EFA-JSON-Schnittstelle (Mentz, `outputFormat=rapidJSON`).
 *
 * Bewusst KEINE vollständige Abbildung des Hersteller-Schemas (10.6.21.17, ~300 kB), sondern nur
 * die Felder, die {@link ../tools/efaMapper} tatsächlich liest. Alles ist optional: EFA-Server
 * liefern je nach Verbund und Anfrage unterschiedlich vollständige Antworten, und ein fehlendes
 * Feld darf niemals einen Laufzeitfehler auslösen.
 *
 * Quelle der Feldnamen: `claude:/home/tom/Claude/trias-docs/efa-json-fptf-mapping.md` (Bauplan,
 * gegen das JSON-Schema geprüft) sowie zwei PoC-Läufe gegen den VRR-Endpoint (18.07.2026).
 */

/** Kopfdaten, die jede EFA-Antwort mitliefert. */
export interface EfaServerInfo {
    controllerVersion?: string;
    serverID?: string;
    /** Serverzeit als ISO-String – NICHT als Zeitbasis verwenden, siehe efaMapper. */
    serverTime?: string;
    virtDir?: string;
}

/**
 * Meldung des Systems, nicht des Fahrplans. Harmlose Hinweise kommen hier ebenfalls an –
 * insbesondere `code: -8011` mit leerem Text (Broker-Hinweis), der KEIN Fehler ist.
 */
export interface EfaSystemMessage {
    type?: string;
    module?: string;
    code?: number;
    text?: string;
    subType?: string;
}

/** Zusatzangaben zu einem Ort; `platform` ist der Steig/das Gleis. */
export interface EfaLocationProperties {
    platform?: string;
    plannedPlatformName?: string;
    platformName?: string;
    stopId?: string;
    areaNiveau?: string;
    downloads?: unknown;
}

/**
 * Ort (Haltestelle, Steig, POI, Adresse).
 *
 * ⚠️ `coord` ist in der ANTWORT `[latitude, longitude]` – umgekehrt zur Eingabe-Reihenfolge
 * `<lon>:<lat>:WGS84[dd.ddddd]`. Diese Verdrehung ist die häufigste Fehlerquelle im EFA-Mapping.
 */
export interface EfaLocation {
    id?: string;
    /** true = `id` ist eine globale DHID (`de:05113:9289`) und damit stabil. */
    isGlobalId?: boolean;
    name?: string;
    disassembledName?: string;
    /** 'stop' | 'platform' | 'poi' | 'address' | 'street' | 'locality' | 'suburb' | … */
    type?: string;
    coord?: number[];
    /** Trefferqualität der Ortssuche (höher = besser). */
    matchQuality?: number;
    isBest?: boolean;
    /** MOT-Klassen, die dieser Ort bedient (siehe MOT-Tabelle im efaMapper). */
    productClasses?: number[];
    parent?: EfaLocation;
    /**
     * Zugeordnete Haltestellen. Bei der Suche über eine ID liefert EFA `productClasses` NUR
     * hier – nicht am Treffer selbst (am 15.08.2026 am VRR-Endpoint beobachtet).
     */
    assignedStops?: EfaLocation[];
    properties?: EfaLocationProperties;
}

/**
 * Ort innerhalb einer Verbindung: derselbe Kern wie {@link EfaLocation}, ergänzt um die
 * Soll-/Ist-Zeiten. Wird für Leg-Start/-Ziel und für jeden Zwischenhalt (`stopSequence`) benutzt.
 */
export interface EfaJourneyLocation extends EfaLocation {
    departureTimePlanned?: string;
    departureTimeEstimated?: string;
    departureTimeBaseTimetable?: string;
    arrivalTimePlanned?: string;
    arrivalTimeEstimated?: string;
    arrivalTimeBaseTimetable?: string;
}

/** Verkehrsmittel-Gattung. `class` ist die MOT-ID (siehe MOT-Tabelle im efaMapper). */
export interface EfaProduct {
    id?: number;
    class?: number;
    name?: string;
    iconId?: number;
}

/** Verkehrsunternehmen. */
export interface EfaOperator {
    id?: string;
    name?: string;
    code?: string;
}

/** Fahrt-Detailangaben; hier steht die Fahrtnummer. */
export interface EfaTransportationProperties {
    /** Zugnummer, z. B. "10216" – im PoC befüllt. */
    trainNumber?: string;
    /** Interne Fahrtnummer; Rückfallwert für `fahrtNr`. */
    tripCode?: number;
    trainName?: string;
    trainType?: string;
    globalId?: string;
}

/** Linie/Fahrt eines Abfahrts- oder Verbindungsabschnitts. */
export interface EfaTransportation {
    id?: string;
    /** Vollständiger Linienname, z. B. "RE 2 Rhein-Haard-Express". */
    name?: string;
    /** Kurzform, z. B. "RE 2". */
    disassembledName?: string;
    /** Liniennummer, z. B. "RE 2" (NICHT die Fahrtnummer). */
    number?: string;
    description?: string;
    product?: EfaProduct;
    operator?: EfaOperator;
    destination?: EfaLocation;
    origin?: EfaLocation;
    properties?: EfaTransportationProperties;
}

/** Freitext-Hinweis (Störung, Bauarbeiten, Serviceinfo). */
export interface EfaInfo {
    priority?: string;
    id?: string;
    version?: number;
    type?: string;
    infoLinkText?: string;
    content?: string;
    subtitle?: string;
    title?: string;
    properties?: Record<string, unknown>;
}

/** Kurzhinweis an einer Fahrt. */
export interface EfaHint {
    content?: string;
    contentHtml?: string;
    infoType?: string;
    providerCode?: string;
}

/** Eine Abfahrt bzw. Ankunft des Abfahrtsmonitors (`XML_DM_REQUEST`). */
export interface EfaStopEvent {
    location?: EfaJourneyLocation;
    departureTimePlanned?: string;
    departureTimeEstimated?: string;
    departureTimeBaseTimetable?: string;
    arrivalTimePlanned?: string;
    arrivalTimeEstimated?: string;
    transportation?: EfaTransportation;
    isRealtimeControlled?: boolean;
    /** u. a. 'MONITORED', 'TRIP_CANCELLED', 'DEPARTURE_CANCELLED', 'ARRIVAL_CANCELLED'. */
    realtimeStatus?: string[];
    isCancelled?: boolean;
    infos?: EfaInfo[];
    hints?: EfaHint[];
    previousLocations?: EfaJourneyLocation[];
    onwardLocations?: EfaJourneyLocation[];
}

/** Ein Element des Umsteige-/Fußwegs (Treppe, Aufzug, …). */
export interface EfaFootPathElem {
    description?: string;
    type?: string;
    levelFrom?: number;
    levelTo?: number;
    level?: string;
    origin?: EfaLocation;
    destination?: EfaLocation;
}

/**
 * Umsteigeweg. Hängt am Transit-Abschnitt (`position: 'BEFORE' | 'AFTER'`) – ein Umstieg
 * erzeugt in EFA KEIN eigenes Fuß-Leg. Genau daraus synthetisiert der Mapper die FPTF-Fußwege.
 */
export interface EfaFootPathInfo {
    position?: string;
    duration?: number;
    footPathElem?: EfaFootPathElem[];
}

/** Ein Abschnitt einer Verbindung. */
export interface EfaLeg {
    /** Dauer in Sekunden. */
    duration?: number;
    /** Länge in Metern (vor allem bei Fußwegen). */
    distance?: number;
    origin?: EfaJourneyLocation;
    destination?: EfaJourneyLocation;
    transportation?: EfaTransportation;
    /** Alle Halte des Abschnitts inkl. Start und Ziel. */
    stopSequence?: EfaJourneyLocation[];
    footPathInfo?: EfaFootPathInfo[];
    footPathInfoRedundant?: boolean;
    interchange?: Record<string, unknown>;
    isRealtimeControlled?: boolean;
    realtimeStatus?: string[];
    infos?: EfaInfo[];
    hints?: EfaHint[];
    coords?: number[][];
}

/** Eine komplette Verbindung (`XML_TRIP_REQUEST2`). */
export interface EfaJourney {
    rating?: number;
    isAdditional?: boolean;
    /** Anzahl der Umstiege. */
    interchanges?: number;
    legs?: EfaLeg[];
}

/** Antwort des Abfahrtsmonitors. */
export interface EfaDepartureMonitorResponse {
    version?: string;
    serverInfo?: EfaServerInfo;
    systemMessages?: EfaSystemMessage[];
    locations?: EfaLocation[];
    stopEvents?: EfaStopEvent[];
}

/** Antwort der Verbindungsauskunft. */
export interface EfaTripResponse {
    version?: string;
    serverInfo?: EfaServerInfo;
    systemMessages?: EfaSystemMessage[];
    journeys?: EfaJourney[];
}

/** Antwort der Ortssuche. */
export interface EfaStopFinderResponse {
    version?: string;
    serverInfo?: EfaServerInfo;
    systemMessages?: EfaSystemMessage[];
    locations?: EfaLocation[];
}

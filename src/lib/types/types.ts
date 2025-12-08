type departureOpt = {
    when?: Date | null; // Datum & Uhrzeit der Abfahrten; `null` bedeutet "jetzt"
    direction?: string | null; // zeige nur Abfahrten in Richtung dieser Station
    line?: string | null; // filtere nach Linien-ID
    duration?: number; // zeige Abfahrten für die nächsten n Minuten (Standard: 10)
    results?: number | null; // max. Anzahl der Ergebnisse; `null` bedeutet "was auch immer HAFAS liefert"
    subStops?: boolean; // parse & zeige Unterhaltestellen von Stationen? (Standard: true)
    entrances?: boolean; // parse & zeige Eingänge von Haltestellen/Stationen? (Standard: true)
    linesOfStops?: boolean; // parse & zeige Linien an der Haltestelle/Station? (Standard: false)
    remarks?: boolean; // parse & zeige Hinweise & Warnungen? (Standard: true)
    stopovers?: boolean; // hole & parse vorherige/nächste Zwischenstopps? (Standard: false)
    // Abfahrten an verwandten Stationen
    // z.B. solche, die auf der Metro-Karte zusammengehören
    includeRelatedStations?: boolean; // Standard: true
    language?: string; // Sprache für die Ergebnisse (Standard: 'de')
};

// Default-Werte
export const defaultDepartureOpt: Partial<departureOpt> = {
    duration: 60,
    results: 3,
    language: 'de',
};

type journeyOpt = {
    // Verwende entweder `departure` oder `arrival` um ein Datum/Uhrzeit anzugeben.
    departure?: Date | null; // Datum & Uhrzeit der Abfahrten; `null` bedeutet "jetzt" (Standard)
    arrival?: Date | null; // Datum & Uhrzeit der Ankunft

    earlierThan?: string | null; // Referenz um frühere Verbindungen als die letzte Abfrage zu erhalten
    laterThan?: string | null; // Referenz um spätere Verbindungen als die letzte Abfrage zu erhalten

    results?: number | null; // Anzahl der Verbindungen – `null` bedeutet "was auch immer HAFAS liefert"
    via?: string | null; // lasse Verbindungen über diese Station laufen
    stopovers?: boolean; // gebe Stationen auf dem Weg zurück? (Standard: false)
    transfers?: number; // Maximale Anzahl von Umstiegen. Standard: -1 (HAFAS entscheidet)
    transferTime?: number; // minimale Zeit für einen einzelnen Umstieg in Minuten (Standard: 0)
    accessibility?: 'none' | 'partial' | 'complete'; // Barrierefreiheit (Standard: 'none')
    bike?: boolean; // nur fahrradfreundliche Verbindungen (Standard: false)
    walkingSpeed?: 'slow' | 'normal' | 'fast'; // Gehgeschwindigkeit (Standard: 'normal')
    // Berücksichtige Fußweg zu nahegelegenen Stationen am Beginn einer Verbindung?
    startWithWalking?: boolean; // Standard: true
    products?: {
        // diese Einträge können von Profil zu Profil variieren
        suburban?: boolean; // S-Bahn (Standard: true)
        subway?: boolean; // U-Bahn (Standard: true)
        tram?: boolean; // Straßenbahn (Standard: true)
        bus?: boolean; // Bus (Standard: true)
        ferry?: boolean; // Fähre (Standard: true)
        express?: boolean; // Fernverkehr (Standard: true)
        regional?: boolean; // Regionalverkehr (Standard: true)
    };
    tickets?: boolean; // gebe Tickets zurück? nur mit einigen Profilen verfügbar (Standard: false)
    polylines?: boolean; // gebe eine Form für jede Teilstrecke zurück? (Standard: false)
    subStops?: boolean; // parse & zeige Unterhaltestellen von Stationen? (Standard: true)
    entrances?: boolean; // parse & zeige Eingänge von Haltestellen/Stationen? (Standard: true)
    remarks?: boolean; // parse & zeige Hinweise & Warnungen? (Standard: true)
    scheduledDays?: boolean; // parse an welchen Tagen jede Verbindung gültig ist (Standard: false)
    language?: string; // Sprache für die Ergebnisse (Standard: 'de')
};

// Default-Werte
export const defaultJourneyOpt: Partial<journeyOpt> = {
    departure: null,
    arrival: null,
    earlierThan: null,
    laterThan: null,
    results: null,
    via: null,
    stopovers: false,
    transfers: -1,
    transferTime: 0,
    accessibility: 'none',
    bike: false,
    walkingSpeed: 'normal',
    startWithWalking: true,
    products: {
        suburban: true,
        subway: true,
        tram: true,
        bus: true,
        ferry: true,
        express: true,
        regional: true,
    },
    tickets: false,
    polylines: false,
    subStops: true,
    entrances: true,
    remarks: true,
    scheduledDays: false,
    language: 'de',
};

export type Products = {
    suburban: boolean;
    subway: boolean;
    tram: boolean;
    bus: boolean;
    ferry: boolean;
    express?: boolean;
    regional?: boolean;
    regionalExpress?: boolean;
    national?: boolean;
    nationalExpress?: boolean;
};

// Reduzierter Typ für ioBroker-States (nur benötigte Felder)
export type DepartureState = {
    when: string | null;
    plannedWhen: string | null;
    delay: number | null;
    direction: string | null;
    platform: string | null;
    plannedPlatform: string | null;
    line: {
        name: string | null;
        fahrtNr: string | null;
        productName: string | null;
        mode: string | null;
        operator: string | null;
    };
    remarks: {
        hint: string | null; // alle hints zusammengefasst
        warning: string | null; // alle warnings zusammengefasst
        status: string | null; // alle status zusammengefasst
    };
    stopinfo: {
        name: string | null;
        id: string | null;
        type: string | null;
        location: {
            latitude: number | null;
            longitude: number | null;
        } | null;
    };
};

export type StationState = {
    id: string | undefined;
    name: string | undefined;
    type: string | undefined;
    location?:
        | {
              latitude: number | undefined;
              longitude: number | undefined;
          }
        | undefined;
};

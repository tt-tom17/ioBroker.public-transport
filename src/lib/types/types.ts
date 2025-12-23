type departureOpt = {
    when?: Date | undefined; // Datum & Uhrzeit der Abfahrten; `undefined` bedeutet "jetzt"
    direction?: string | undefined; // zeige nur Abfahrten in Richtung dieser Station
    line?: string | undefined; // filtere nach Linien-ID
    duration?: number; // zeige Abfahrten für die nächsten n Minuten (Standard: 10)
    results?: number | undefined; // max. Anzahl der Ergebnisse; `undefined` bedeutet "was auch immer HAFAS liefert"
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
    departure?: Date | undefined; // Datum & Uhrzeit der Abfahrten; `undefined` bedeutet "jetzt" (Standard)
    arrival?: Date | undefined; // Datum & Uhrzeit der Ankunft

    earlierThan?: string | undefined; // Referenz um frühere Verbindungen als die letzte Abfrage zu erhalten
    laterThan?: string | undefined; // Referenz um spätere Verbindungen als die letzte Abfrage zu erhalten

    results?: number | undefined; // Anzahl der Verbindungen – `undefined` bedeutet "was auch immer HAFAS liefert"
    via?: string | undefined; // lasse Verbindungen über diese Station laufen
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
        regionalExpress?: boolean; // Regional-Express (Standard: true)
        national?: boolean; // Nah- und Fernverkehr (Standard: true)
        nationalExpress?: boolean; // ICE, IC, EC (Standard: true)
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
    results: 3,
    language: 'de',
};

export type Products = {
    suburban?: boolean;
    subway?: boolean;
    tram?: boolean;
    bus?: boolean;
    ferry?: boolean;
    express?: boolean;
    regional?: boolean;
    regionalExpress?: boolean;
    national?: boolean;
    nationalExpress?: boolean;
};

type Location = {
    latitude: number | undefined;
    longitude: number | undefined;
};

export type StationState = {
    id: string | undefined;
    name: string | undefined;
    type: string | undefined;
    location?: Location | undefined;
    stops?:
        | {
              name: string | undefined;
              id: string | undefined;
              type: string | undefined;
              location?: Location | undefined;
              products?: Products | undefined;
          }[]
        | undefined;
};

export type Stopstate = {
    name: string | undefined;
    id: string | undefined;
    type: string | undefined;
    location?: Location | undefined;
    products?: Products | undefined;
    station?: {
        name: string | undefined;
        id: string | undefined;
        type: string | undefined;
        location?: Location | undefined;
        products?: Products | undefined;
        tansitAuthority?: string | undefined;
        facilities?:
            | {
                  Zentrale?: string | undefined;
                  parkingLots?: boolean | undefined;
                  bicycleParkingRacks?: boolean | undefined;
                  localPublicTransport?: boolean | undefined;
                  toilets?: boolean | undefined;
                  lockers?: boolean | undefined;
                  travelShop?: boolean | undefined;
                  stepFreeAccess?: string | undefined;
                  boardingAid?: string | undefined;
                  taxis?: boolean | undefined;
                  travelCenter?: boolean | undefined;
                  railwayMission?: boolean | undefined;
                  dbLounge?: boolean | undefined;
                  lostAndFound?: boolean | undefined;
                  carRental?: boolean | undefined;
              }
            | undefined;
    };
};

type Line = {
    name: string | undefined;
    fahrtNr: string | undefined;
    productName: string | undefined;
    mode: string | undefined;
    product: string | undefined;
    operator: string | undefined;
};

export type Remark = {
    hint: string | undefined; // alle hints zusammengefasst
    warning: string | undefined; // alle warnings zusammengefasst
    status: string | undefined; // alle status zusammengefasst
};

// Reduzierter Typ für ioBroker-States (nur benötigte Felder)
export type DepartureState = {
    when: string | undefined;
    plannedWhen: string | undefined;
    delay: number | undefined;
    direction: string | undefined;
    platform: string | undefined;
    plannedPlatform: string | undefined;
    line: Line | undefined;
    remarks: Remark | undefined;
    stopinfo: StationState | undefined;
};

export type LegState = {
    stationFrom: StationState | undefined;
    stationTo: StationState | undefined;
    departure: string | undefined;
    plannedDeparture: string | undefined;
    departureDelay: number | undefined;
    arrival: string | undefined;
    plannedArrival: string | undefined;
    arrivalDelay: number | undefined;
    line: Line | undefined;
    direction: string | undefined;
    arrivalPlatform: string | undefined;
    plannedArrivalPlatform: string | undefined;
    departurePlatform: string | undefined;
    plannedDeparturePlatform: string | undefined;
    arrivalPrognosisType: string | undefined;
    departurePrognosisType: string | undefined;
    walking?: boolean | undefined;
    distance?: number | undefined;
    remarks: Remark | undefined;
    alternatives:
        | {
              tripId: string | undefined;
              line: Line | undefined;
              direction: string | undefined;
              when: string | undefined;
              plannedWhen: string | undefined;
              delay: number | undefined;
          }[]
        | undefined;
};

export type JourneyState = {
    section: LegState[] | undefined;
    stationFrom?: StationState | undefined;
    stationTo?: StationState | undefined;
    refreshToken?: string | undefined;
    remarks?: Remark | undefined;
};

/**
 * Schlanke Typen für die **geparste** TRIAS-Antwort (VDV 431-2 v1.2) der EFA-BW.
 *
 * Bewusst keine Ableitung aus dem offiziellen XSD: Das vollständige Schema beschreibt den
 * ganzen VDV-Umfang, die NVBW-Instanz liefert davon nur einen Ausschnitt. Diese Typen bilden
 * ab, was am **lebenden Endpunkt gemessen** wurde (24.08.2026) — nicht, was die Doku verspricht.
 *
 * Alle Felder sind optional: TRIAS lässt praktisch jedes Element weg, wenn es nichts zu sagen
 * hat, und ein fehlendes Feld darf den Adapter nie zum Absturz bringen.
 *
 * ⚠️ Der Parser ist mit `removeNSPrefix: true` konfiguriert — `siri:RequestorRef` erscheint
 * hier als `RequestorRef`. Die Pfade unten sind deshalb präfixfrei.
 */

/** Mehrsprachiger Text: TRIAS verpackt jeden Anzeigetext in `<Text>` + `<Language>`. */
export interface TriasText {
    Text?: string;
    Language?: string;
}

/** Soll-/Ist-Zeitpaar. Beide Zeiten kommen in **UTC/Zulu** (`2026-08-24T15:48:00Z`). */
export interface TriasServiceTime {
    /** Fahrplanzeit (Soll). */
    TimetabledTime?: string;
    /** Prognosezeit (Ist) – fehlt, wenn für die Fahrt keine Echtzeit vorliegt. */
    EstimatedTime?: string;
}

/**
 * Ein Halt im Fahrtverlauf – als Abfahrtsereignis (`ThisCall`) wie als Ein-/Ausstieg einer
 * Verbindung (`LegBoard`/`LegAlight`) dieselbe Struktur.
 *
 * ⚠️ `PlannedBay` und `EstimatedBay` können **auseinanderfallen** (gemessen: Gleis 5 geplant,
 * Gleis 7 tatsächlich) – das ist ein Gleiswechsel und für Anwender die wichtigere Angabe.
 */
export interface TriasCallAtStop {
    StopPointRef?: string;
    StopPointName?: TriasText;
    /** Geplanter Steig/Gleis. */
    PlannedBay?: TriasText;
    /** Tatsächlicher Steig/Gleis, falls abweichend. */
    EstimatedBay?: TriasText;
    ServiceDeparture?: TriasServiceTime;
    ServiceArrival?: TriasServiceTime;
    StopSeqNumber?: string;
    /** Störungsflags am einzelnen Halt. */
    NotServicedStop?: string;
    NoBoardingAtStop?: string;
    NoAlightingAtStop?: string;
    UnplannedStop?: string;
}

/**
 * Verkehrsmittel. Die Produktzuordnung läuft über `PtMode` plus den passenden Submode – TRIAS
 * benennt das Submode-Feld je Modus anders (`RailSubmode`, `BusSubmode`, …), deshalb sind sie
 * hier einzeln aufgeführt statt als Index-Signatur: so fällt beim Mapping auf, wenn ein Modus
 * noch nicht behandelt ist.
 */
export interface TriasMode {
    /** z. B. `rail`, `bus`, `tram`, `metro`, `water`, `telecabin`, `funicular`, `unknown`. */
    PtMode?: string;
    RailSubmode?: string;
    BusSubmode?: string;
    TramSubmode?: string;
    MetroSubmode?: string;
    WaterSubmode?: string;
    TelecabinSubmode?: string;
    FunicularSubmode?: string;
    AirSubmode?: string;
    CoachSubmode?: string;
    TaxiSubmode?: string;
    /** Ausformulierte Bezeichnung, z. B. „NRB 17659 Regionalbahn". */
    Name?: TriasText;
}

/**
 * Service-Attribut (Fahrradmitnahme, Klimaanlage, Einstiegshilfe …).
 *
 * ⚠️ **Der Grund, warum die Fehlererkennung am Pfad hängen muss:** `Code` ist hier zwar
 * meistens ein Buchstabenkürzel (`FK`, `GL`, `EH`), gemessen wurden aber auch **`"1"`,
 * `"1A"`, `"28"`** und lange technische Kennungen. Eine Unterscheidung „numerisch = Fehler,
 * alphanumerisch = Attribut" wäre also falsch und würde harmlose Attribute als Fehler melden.
 */
export interface TriasAttribute {
    Text?: TriasText;
    Code?: string;
}

/** Die Fahrt selbst (Linie, Ziel, Verkehrsmittel). */
export interface TriasService {
    OperatingDayRef?: string;
    /** Eindeutige Kennung der Fahrt, taugt als FPTF `tripId`. */
    JourneyRef?: string;
    /**
     * ⚠️ Linie, Richtung und Verkehrsmittel liegen **unterhalb von `ServiceSection`** – die
     * Datenmodellbeschreibung führt sie direkt unter `Service`. Am Endpunkt gemessen.
     */
    ServiceSection?: {
        LineRef?: string;
        DirectionRef?: string;
        Mode?: TriasMode;
        /** Anzeigename der Linie, z. B. `RE14a`. */
        PublishedLineName?: TriasText;
        OperatorRef?: string;
    };
    Attribute?: TriasAttribute[];
    OriginStopPointRef?: string;
    OriginText?: TriasText;
    DestinationStopPointRef?: string;
    DestinationText?: TriasText;
    /** Verweise auf Meldungen im Response-Kontext. */
    SituationFullRef?: Array<{ ParticipantRef?: string; SituationNumber?: string }>;
    /** Störungsflags der ganzen Fahrt. */
    Cancelled?: string;
    Unplanned?: string;
    Deviation?: string;
}

/** Ein Abfahrts-/Ankunftsereignis des Abfahrtsmonitors. */
export interface TriasStopEventResult {
    ResultId?: string;
    StopEvent?: {
        /** Der abgefragte Halt. */
        ThisCall?: { CallAtStop?: TriasCallAtStop };
        PreviousCall?: Array<{ CallAtStop?: TriasCallAtStop }>;
        OnwardCall?: Array<{ CallAtStop?: TriasCallAtStop }>;
        Service?: TriasService;
    };
}

/** Ein Fahrtabschnitt mit Verkehrsmittel. */
export interface TriasTimedLeg {
    LegBoard?: TriasCallAtStop;
    LegAlight?: TriasCallAtStop;
    LegIntermediates?: TriasCallAtStop[];
    Service?: TriasService;
}

/**
 * Fußweg oder individueller Abschnitt.
 *
 * ⚠️ Am BW-Endpunkt bisher **nicht beobachtet**: Umstiege werden dort als aufeinanderfolgende
 * `TimedLeg` mit `Trip/Interchanges > 0` geliefert, ohne eigenen Leg. Der Typ bleibt trotzdem
 * bestehen – bei Start-/Zielpunkten abseits einer Haltestelle ist er laut VDV vorgesehen, und
 * ein unbehandelter Legtyp wäre eine stille Lücke im Verlauf.
 */
export interface TriasContinuousLeg {
    LegStart?: TriasCallAtStop & { LocationName?: TriasText };
    LegEnd?: TriasCallAtStop & { LocationName?: TriasText };
    /** ISO-8601-Dauer, z. B. `PT8M`. */
    Duration?: string;
    /** Beginn des Fußwegs – hier stehen die Zeiten, nicht in `LegStart`. */
    TimeWindowStart?: string;
    /** Ende des Fußwegs. */
    TimeWindowEnd?: string;
    /** Weglänge in Metern, z. B. `358`. */
    Length?: string;
    Service?: { IndividualMode?: string };
}

/** Expliziter Umstieg zwischen zwei Fahrten. */
export interface TriasInterchangeLeg {
    LegStart?: TriasCallAtStop & { LocationName?: TriasText };
    LegEnd?: TriasCallAtStop & { LocationName?: TriasText };
    /** Gesamtdauer des Umstiegs, Gehzeit **und** Puffer, z. B. `PT14M`. */
    Duration?: string;
    /** Beginn des Umstiegs – wie beim Fußweg stehen die Zeiten hier, nicht in `LegStart`. */
    TimeWindowStart?: string;
    /** Ende des Umstiegs. */
    TimeWindowEnd?: string;
    /** Reine Gehzeit ohne Puffer, z. B. `PT7M`. */
    WalkDuration?: string;
    /** Pufferzeit für den Umstieg. */
    BufferTime?: string;
    /** Weglänge in Metern. */
    Length?: string;
    InterchangeMode?: string;
}

/** Ein Abschnitt einer Verbindung – genau eine der drei Ausprägungen ist gesetzt. */
export interface TriasTripLeg {
    LegId?: string;
    TimedLeg?: TriasTimedLeg;
    ContinuousLeg?: TriasContinuousLeg;
    InterchangeLeg?: TriasInterchangeLeg;
}

/** Eine vollständige Verbindung. */
export interface TriasTripResult {
    ResultId?: string;
    Trip?: {
        TripId?: string;
        /** ISO-8601-Dauer der Gesamtverbindung, z. B. `PT3H48M`. */
        Duration?: string;
        StartTime?: string;
        EndTime?: string;
        /** Anzahl Umstiege – bei impliziten Umstiegen die einzige Quelle dafür. */
        Interchanges?: string;
        Distance?: string;
        TripLeg?: TriasTripLeg[];
    };
}

/** Treffer der Ortssuche. */
export interface TriasLocationResult {
    Location?: {
        StopPoint?: {
            StopPointRef?: string;
            StopPointName?: TriasText;
            LocalityRef?: string;
        };
        LocationName?: TriasText;
        GeoPosition?: { Longitude?: string; Latitude?: string };
    };
    Complete?: string;
    /** Trefferwahrscheinlichkeit 0–1; die Liste kommt bereits absteigend sortiert. */
    Probability?: string;
}

/**
 * Fehlermeldung. **Der einzige Ort, an dem ein `Code` einen echten Fehler bedeutet.**
 * Gemessen auf Response-Ebene (`TripResponse.ErrorMessage`), laut Doku zusätzlich je Result.
 */
export interface TriasErrorMessage {
    /** Numerischer Fehlercode, z. B. `-4000` (keine Verbindung), `-4030` (keine Abfahrten). */
    Code?: string;
    Text?: TriasText;
}

/** Gemeinsamer Rahmen aller Antworten. */
interface TriasResponseBase {
    ErrorMessage?: TriasErrorMessage[];
}

export interface TriasLocationInformationResponse extends TriasResponseBase {
    LocationResult?: TriasLocationResult[];
}

export interface TriasStopEventResponse extends TriasResponseBase {
    StopEventResult?: TriasStopEventResult[];
}

export interface TriasTripResponse extends TriasResponseBase {
    TripResult?: TriasTripResult[];
}

/** Wurzel der geparsten Antwort. */
export interface TriasEnvelope {
    Trias?: {
        ServiceDelivery?: {
            ResponseTimestamp?: string;
            ProducerRef?: string;
            /** `false` signalisiert einen Fehler auf Transportebene. */
            Status?: string;
            DeliveryPayload?: {
                LocationInformationResponse?: TriasLocationInformationResponse;
                StopEventResponse?: TriasStopEventResponse;
                TripResponse?: TriasTripResponse;
            };
        };
    };
}

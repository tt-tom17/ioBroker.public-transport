/**
 * TriasService – Backend-Service für TRIAS-Systeme (VDV 431-2, Version 1.2, XML).
 *
 * Wie beim EFA-Backend gibt es keinen fertigen Client im hafas-client-Format, deshalb liefert
 * `createClient()` einen **Shim**: ein Objekt mit den hafas-client-Methoden, das intern
 * TRIAS-Requests als XML absetzt und die Antworten über {@link ../tools/triasMapper} nach FPTF
 * übersetzt. Timeout, Wiederholungen und die Produktbereinigung kommen aus
 * {@link BaseTransportService}.
 *
 * **TRIAS ist ein Standard.** Die Requests werden deshalb nicht aus Beispieldateien abgeleitet,
 * sondern aus dem Schema (`Trias_StopEvents.xsd`, `Trias_Trips.xsd`, `Trias_Locations.xsd`).
 * Das ist kein Formalismus: Die Parameter stehen in `xs:sequence`, ihre **Reihenfolge ist
 * vorgeschrieben**. Die Bausteine unten halten sie ein, damit derselbe Client auch bei einem
 * TRIAS-Anbieter außerhalb Baden-Württembergs funktioniert.
 *
 * Erstes Zielsystem ist MobiData BW (NVBW). Anders als bei EFA verlangt TRIAS **je Endnutzer
 * einen eigenen Zugangsschlüssel** (`RequestorRef`), den der Anwender selbst beantragt.
 */
import type * as Hafas from 'hafas-client';
import { XMLParser } from 'fast-xml-parser';
import type { PublicTransport } from '../../main';
import { mapJourney, mapLocation, mapStopEvent, ptModesForProducts, readError } from '../tools/triasMapper';
import type { TriasEnvelope, TriasLocationResult, TriasStopEventResult, TriasTripResult } from '../types/trias';
import { BaseTransportService } from './baseTransportService';

/**
 * Basis-URLs der unterstützten TRIAS-Netze, ausgewählt über den Profilnamen aus der
 * Adapter-Konfiguration (`trias:<profil>` im Dropdown des Admin-Tabs).
 *
 * Die Adresse ist bewusst **keine Einstellung**, wie schon beim EFA-Backend: Jeder Anbieter
 * hat eigene Nutzungsbedingungen, die der Adapter für seine Anwender mit abbildet (bei der
 * NVBW die Attribution). Ein frei eingetragener Fremdserver würde das still aushebeln. Ein
 * neues Netz ist deshalb eine Code-Änderung nach Klärung der Bedingungen – kein Konfigfeld.
 */
const TRIAS_NETWORKS: Record<string, string> = {
    /** MobiData BW (NVBW) – deckt ganz Baden-Württemberg samt VVS, KVV, naldo und DING ab. */
    bw: 'https://efa-bw.de/trias',
};

/** Schnittstellenversion im Wurzelelement. Die NVBW-Instanz fährt 1.2. */
const TRIAS_VERSION = '1.2';

/** Namensräume des Wurzelelements. TRIAS mischt den eigenen mit dem von SIRI. */
const NS_TRIAS = 'http://www.vdv.de/trias';
const NS_SIRI = 'http://www.siri.org.uk/siri';

/**
 * Obergrenze für angeforderte Abfahrten. Bei aktivem Produktfilter wird großzügiger angefragt,
 * weil nach dem Mapping noch nachgefiltert wird – aber nie unbegrenzt, damit eine breit
 * eingestellte Station keine Massenabfrage auslöst.
 */
const MAX_DEPARTURE_RESULTS = 50;

/**
 * Voreinstellung für die Anzahl der Verbindungen.
 *
 * ⚠️ `NumberOfResults` ist im `TripRequest` **nicht Teil des Schemas** – der Mentz-Server
 * beachtet es trotzdem und liefert damit deutlich kleinere Antworten (gemessen 24.08.2026:
 * 178 kB ohne, 87 kB mit). Es wird deshalb gesendet, aber nie als verbindlich behandelt: Der
 * Server lieferte auf „2" drei Verbindungen, und ein anderer TRIAS-Anbieter darf den
 * Parameter schlicht ignorieren. Gekürzt wird in jedem Fall selbst.
 */
const DEFAULT_JOURNEY_RESULTS = 5;

export class TriasService extends BaseTransportService {
    /** Profilname des Netzes, z. B. `bw`. Bestimmt die Basis-URL, s. {@link TRIAS_NETWORKS}. */
    private readonly profile: string;

    /** Zugangsschlüssel des Anwenders. Wird nie protokolliert, s. {@link maskKey}. */
    private readonly requestorRef: string;

    /**
     * `removeNSPrefix` blendet die Namensraum-Präfixe aus (`siri:RequestorRef` →
     * `RequestorRef`), sonst müsste jeder Pfad im Mapper das Präfix mitschleppen.
     * `isArray` erzwingt Listen für die Elemente, die je nach Trefferzahl mal einzeln und mal
     * mehrfach kommen – ohne das müsste jede Auswertung `Array.isArray()` prüfen und würde
     * genau dann falsch liegen, wenn es nur einen Treffer gibt.
     */
    private readonly parser = new XMLParser({
        ignoreAttributes: false,
        removeNSPrefix: true,
        parseTagValue: false,
        trimValues: true,
        isArray: (name: string): boolean =>
            [
                'LocationResult',
                'StopEventResult',
                'TripResult',
                'TripLeg',
                'Attribute',
                'SituationFullRef',
                'LegIntermediates',
                'ErrorMessage',
                'PreviousCall',
                'OnwardCall',
            ].includes(name),
    });

    /**
     * @param adapter Die Adapter-Instanz
     * @param clientName Name/User-Agent, der an den Server übergeben wird
     * @param profile Profilname des Netzes aus der Instanz-Konfiguration (z. B. `bw`)
     * @param requestorRef Der vom Anbieter zugeteilte Zugangsschlüssel des Anwenders
     */
    constructor(adapter: PublicTransport, clientName: string, profile: string, requestorRef: string) {
        super(adapter, clientName);
        this.profile = profile.trim();
        this.requestorRef = (requestorRef ?? '').trim();
    }

    protected get serviceName(): string {
        return 'TRIAS';
    }

    /**
     * Löst den Profilnamen in die Basis-URL auf. Fail-fast wie bei HAFAS und EFA: ohne bzw. mit
     * unbekanntem Profil startet der Adapter bewusst NICHT mit einem stillen Default, weil
     * sonst Fahrplandaten einer völlig anderen Region ausgeliefert würden.
     */
    private resolveEndpoint(): string {
        const available = Object.keys(TRIAS_NETWORKS)
            .map(name => `'${name}'`)
            .join(', ');
        if (!this.profile) {
            throw new Error(
                `No TRIAS network configured. Please select a TRIAS network (${available}) in the adapter settings.`,
            );
        }
        const endpoint = TRIAS_NETWORKS[this.profile];
        if (!endpoint) {
            throw new Error(`unknown TRIAS network: ${this.profile}. available networks: ${available}.`);
        }
        return endpoint.replace(/\/+$/, '');
    }

    /**
     * Baut den Shim. Ein echter Client wird nicht erzeugt; geprüft wird deshalb beim Start,
     * dass Netz **und** Zugangsschlüssel gesetzt sind – ohne Schlüssel antwortet der Server mit
     * HTTP 403, und das erst beim ersten Poll zu bemerken wäre unnötig spät.
     */
    protected createClient(): Hafas.HafasClient {
        this.resolveEndpoint();
        if (!this.requestorRef) {
            throw new Error(
                'No TRIAS access key configured. TRIAS providers issue an individual key per user; ' +
                    'please request one from the provider and enter it in the adapter settings.',
            );
        }
        const client: Hafas.HafasClient = {
            departures: (station, options) => this.requestStopEvents(station, options, false),
            arrivals: async (station, options) => ({
                arrivals: (await this.requestStopEvents(station, options, true)).departures,
            }),
            journeys: (from, to, options) => this.requestJourneys(from, to, options),
            locations: (name, options) => this.requestLocations(name, options?.results),
            stop: id => this.requestStop(this.toStation(id).id),
            nearby: () => Promise.reject(new Error('The TRIAS backend does not support nearby searches.')),
            // Pflichtmethode des Interfaces, die der Adapter nirgends aufruft. TRIAS kennt keine
            // Entsprechung, deshalb die eigene Uhrzeit statt einer erfundenen Serverangabe.
            serverInfo: () => Promise.resolve({ serverTime: new Date().toISOString() }),
        };
        return client;
    }

    /**
     * Maskiert den Zugangsschlüssel in einem Text.
     *
     * Der Schlüssel ist ein personengebundenes Geheimnis. Er darf auch dann nicht im Log
     * landen, wenn zur Fehlersuche der ganze Request protokolliert wird – Anwender hängen
     * Logauszüge an Fehlermeldungen an.
     *
     * @param text Der zu maskierende Text
     */
    private maskKey(text: string): string {
        return this.requestorRef ? text.split(this.requestorRef).join('***') : text;
    }

    /**
     * Maskiert XML-Sonderzeichen.
     *
     * Pflicht, weil die Requests aus Textbausteinen entstehen: Ein Haltestellenname mit `&`
     * („Bahnhof & Busbahnhof") würde sonst ein ungültiges Dokument erzeugen.
     *
     * @param value Der einzusetzende Wert
     */
    private escapeXml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Formatiert einen Zeitpunkt als TRIAS-Zeitangabe.
     *
     * ⚠️ TRIAS erwartet und liefert **UTC/Zulu** – anders als EFA-JSON, das die Anfragezeit in
     * lokaler Zeit will. Die Millisekunden werden abgeschnitten, weil `xs:dateTime` sie zwar
     * erlaubt, manche Server sie aber nicht erwarten.
     *
     * @param when Der gewünschte Zeitpunkt (Standard: jetzt)
     */
    private formatTime(when?: Date | string | number): string {
        const date = when ? new Date(when) : new Date();
        return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
    }

    /**
     * Verpackt eine Anfrage in den TRIAS-Rahmen.
     *
     * Aufbau nach `Trias_RequestSupport.xsd`: Zeitstempel, Kennung des Anfragenden, eine
     * Nachrichtenkennung, dann die eigentliche Anfrage.
     *
     * @param payload Der Inhalt des `RequestPayload`
     */
    private envelope(payload: string): string {
        return (
            `<?xml version="1.0" encoding="UTF-8"?>` +
            `<Trias version="${TRIAS_VERSION}" xmlns="${NS_TRIAS}" xmlns:siri="${NS_SIRI}">` +
            `<ServiceRequest>` +
            `<siri:RequestTimestamp>${this.formatTime()}</siri:RequestTimestamp>` +
            `<siri:RequestorRef>${this.escapeXml(this.requestorRef)}</siri:RequestorRef>` +
            `<siri:MessageIdentifier>${this.escapeXml(this.clientName)}</siri:MessageIdentifier>` +
            `<RequestPayload>${payload}</RequestPayload>` +
            `</ServiceRequest>` +
            `</Trias>`
        );
    }

    /**
     * Setzt eine TRIAS-Anfrage ab und gibt die geparste Antwort zurück.
     *
     * @param name Sprechender Name der Anfrage fürs Log
     * @param payload Der Inhalt des `RequestPayload`
     */
    private async request(name: string, payload: string): Promise<TriasEnvelope> {
        const url = this.resolveEndpoint();
        const body = this.envelope(payload);
        this.adapter.log.debug(`[TRIAS] POST ${url} (${name}): ${this.maskKey(body)}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                Accept: 'text/xml',
                'User-Agent': this.clientName,
            },
            body: body,
        });
        if (!response.ok) {
            const error = new Error(`TRIAS request failed: ${response.status} ${response.statusText}`) as Error & {
                isCausedByServer?: boolean;
            };
            // 5xx als Serverfehler markieren, damit die Basisklasse den Aufruf wiederholt.
            // 403 bedeutet dagegen fast immer einen ungültigen Zugangsschlüssel – ein
            // Wiederholen würde daran nichts ändern.
            error.isCausedByServer = response.status >= 500;
            throw error;
        }
        return this.parser.parse(await response.text()) as TriasEnvelope;
    }

    /**
     * Wertet die Fehlermeldung einer Antwort aus.
     *
     * ⚠️ **Die zentrale TRIAS-Falle:** In derselben Antwort steht `Code` auch unter
     * `Service/Attribute` – dort bezeichnet es Service-Merkmale wie Fahrradmitnahme, gemessen
     * wurden Werte wie `FK`, aber auch `"1"` und `"28"`. Wer Fehler am Feldnamen oder daran
     * erkennt, ob der Wert numerisch ist, meldet Dutzende Fehler, die keine sind. Deshalb wird
     * ausschließlich der Pfad `…Response/ErrorMessage` ausgewertet.
     *
     * Ein Fehler mit vorhandenen Daten wird nur protokolliert: TRIAS meldet z. B. `-4006`
     * („nur Fußweg gefunden") zusammen mit einem verwertbaren Ergebnis.
     *
     * @param messages Die Fehlermeldungen aus dem passenden Response-Element
     * @param hasResults true, wenn die Antwort trotzdem verwertbare Daten enthält
     */
    private checkError(messages: Parameters<typeof readError>[0], hasResults: boolean): void {
        const text = readError(messages);
        if (!text) {
            return;
        }
        if (hasResults) {
            this.adapter.log.debug(`[TRIAS] Server message: ${text}`);
            return;
        }
        throw new Error(`TRIAS server reported: ${text}`);
    }

    /**
     * Baut eine Ortsreferenz.
     *
     * ⚠️ Laut Schema ist `LocationName` in `LocationRef` ein **Pflichtelement**. Die EFA-BW
     * verzichtet darauf (gemessen 24.08.2026: Anfrage ohne Namen liefert HTTP 200 mit Daten),
     * ein strenger TRIAS-Server könnte das anders sehen. Der Name wird deshalb mitgeschickt,
     * sobald er bekannt ist.
     *
     * @param id Die Haltestellen-ID (DHID/IFOPT, z. B. `de:08111:6115`)
     * @param name Der Haltestellenname, falls bekannt
     */
    private locationRef(id: string, name?: string): string {
        const nameElement = name ? `<LocationName><Text>${this.escapeXml(name)}</Text></LocationName>` : '';
        return `<LocationRef><StopPointRef>${this.escapeXml(id)}</StopPointRef>${nameElement}</LocationRef>`;
    }

    /**
     * Baut den serverseitigen Produktfilter.
     *
     * ⚠️ **`<Exclude>false</Exclude>` ist zwingend.** Der Schema-Default ist `true`, der Filter
     * wirkt dann als **Ausschlussliste** – gemessen am 24.08.2026: Eine Anfrage mit
     * `<PtMode>bus</PtMode>` ohne `Exclude` lieferte ausschließlich Züge. Ein vergessenes
     * Element kehrt den Filter also lautlos um.
     *
     * @param products Der Produktfilter aus den Abfrage-Optionen
     */
    private ptModeFilter(products?: Hafas.Products): string {
        const modes = ptModesForProducts(products);
        if (!modes || modes.length === 0) {
            return '';
        }
        const list = modes.map(mode => `<PtMode>${mode}</PtMode>`).join('');
        return `<PtModeFilter><Exclude>false</Exclude>${list}</PtModeFilter>`;
    }

    /**
     * Löst die von hafas-client erlaubten Stations-Angaben (String oder Objekt) zu ID und Namen auf.
     *
     * @param station Die Station als ID oder Objekt
     */
    private toStation(station: string | Hafas.Station | Hafas.Stop | Hafas.Location): { id: string; name?: string } {
        if (typeof station === 'string') {
            return { id: station };
        }
        const id = station.id;
        if (!id) {
            throw new Error('TRIAS requests need a station id.');
        }
        return { id: id, name: 'name' in station ? station.name : undefined };
    }

    /**
     * Abfahrtsmonitor (`StopEventRequest`).
     *
     * Produktfilter und Zeitfenster gehen **serverseitig** mit (`PtModeFilter`, `TimeWindow`) –
     * das spart Bandbreite gegenüber dem EFA-Backend, wo beides erst nach dem Mapping greifen
     * kann. Beide Grenzen sind aber weich: Der Produktfilter kennt nur die groben PtModes, und
     * das Zeitfenster lieferte im Test eine etwas größere Spanne als angefordert. Deshalb wird
     * nach dem Mapping trotzdem nachgefiltert.
     *
     * Reihenfolge der Parameter nach `Trias_StopEvents.xsd`: PtModeFilter, LineFilter,
     * OperatorFilter, NumberOfResults, TimeWindow, StopEventType, Include*-Schalter.
     *
     * @param station Die Station (ID oder Objekt)
     * @param options Abfrage-Optionen
     * @param arrival true = Ankünfte statt Abfahrten
     */
    private async requestStopEvents(
        station: string | Hafas.Station | Hafas.Stop | Hafas.Location,
        options: Hafas.DeparturesArrivalsOptions | undefined,
        arrival: boolean,
    ): Promise<Hafas.Departures> {
        const { id, name } = this.toStation(station);
        const requested = options?.results ?? 10;
        const productFilter = options?.products;
        const limit = Math.min(
            MAX_DEPARTURE_RESULTS,
            productFilter && Object.keys(productFilter).length > 0 ? requested * 3 : requested,
        );
        const duration = options?.duration;
        const timeWindow = duration && duration > 0 ? `<TimeWindow>PT${Math.round(duration)}M</TimeWindow>` : '';

        const response = await this.request(
            arrival ? 'arrivals' : 'departures',
            `<StopEventRequest>` +
                `<Location>${this.locationRef(id, name)}<DepArrTime>${this.formatTime(options?.when)}</DepArrTime></Location>` +
                `<Params>${this.ptModeFilter(productFilter)}<NumberOfResults>${limit}</NumberOfResults>${
                    timeWindow
                }<StopEventType>${arrival ? 'arrival' : 'departure'}</StopEventType>` +
                `<IncludeRealtimeData>true</IncludeRealtimeData>` +
                `</Params>` +
                `</StopEventRequest>`,
        );

        const payload = response.Trias?.ServiceDelivery?.DeliveryPayload?.StopEventResponse;
        const results: TriasStopEventResult[] = payload?.StopEventResult ?? [];
        this.checkError(payload?.ErrorMessage, results.length > 0);

        let departures = results.map(result => mapStopEvent(result, arrival));
        departures = this.filterByProducts(departures, productFilter);
        departures = this.filterByDuration(departures, options?.when, duration);
        departures = this.sortByEffectiveTime(departures);
        return { departures: departures.slice(0, requested), realtimeDataUpdatedAt: undefined };
    }

    /**
     * Verbindungsauskunft (`TripRequest`).
     *
     * ⚠️ `InterchangeLimit` ist im Schema `xs:positiveInteger` – der Wert `0` für „nur
     * Direktverbindungen" ist damit formal unzulässig. Die EFA-BW akzeptiert ihn (gemessen:
     * antwortet mit `-4000`, wenn keine direkte Verbindung existiert), ein strenger Server
     * könnte den Request ablehnen. Der Wert wird deshalb nur durchgereicht, wenn der Anwender
     * ihn ausdrücklich gesetzt hat.
     *
     * Reihenfolge nach `Trias_Trips.xsd`: Origin, Destination, [Via/NotVia/NoChangeAt], Params
     * mit PtModeFilter, InterchangeLimit, Include*-Schaltern.
     *
     * @param fromId ID der Startstation
     * @param toId ID der Zielstation
     * @param options Abfrage-Optionen
     */
    private async requestJourneys(
        fromId: string | Hafas.Station | Hafas.Stop | Hafas.Location,
        toId: string | Hafas.Station | Hafas.Stop | Hafas.Location,
        options?: Hafas.JourneysOptions,
    ): Promise<Hafas.Journeys> {
        const from = this.toStation(fromId);
        const to = this.toStation(toId);
        const requested = options?.results ?? DEFAULT_JOURNEY_RESULTS;
        const transfers = options?.transfers;
        const interchangeLimit =
            typeof transfers === 'number' && transfers >= 0 ? `<InterchangeLimit>${transfers}</InterchangeLimit>` : '';

        const response = await this.request(
            'journeys',
            `<TripRequest>` +
                `<Origin>${this.locationRef(from.id, from.name)}<DepArrTime>${this.formatTime(options?.departure)}</DepArrTime></Origin>` +
                `<Destination>${this.locationRef(to.id, to.name)}</Destination>` +
                `<Params>${this.ptModeFilter(options?.products)}${
                    interchangeLimit
                }<IncludeIntermediateStops>${options?.stopovers ? 'true' : 'false'}</IncludeIntermediateStops>` +
                `<IncludeRealtimeData>true</IncludeRealtimeData>` +
                // Kein Standardelement, aber vom Mentz-Server beachtet und damit der wirksamste
                // Hebel gegen sehr große Antworten. Siehe DEFAULT_JOURNEY_RESULTS.
                `<NumberOfResults>${requested}</NumberOfResults>` +
                `</Params>` +
                `</TripRequest>`,
        );

        const payload = response.Trias?.ServiceDelivery?.DeliveryPayload?.TripResponse;
        const results: TriasTripResult[] = payload?.TripResult ?? [];
        this.checkError(payload?.ErrorMessage, results.length > 0);

        // Selbst kürzen: Der Server lieferte im Test mehr Verbindungen als angefordert, und bei
        // einem Anbieter ohne diese Erweiterung kommt die volle Liste.
        return { journeys: results.slice(0, requested).map(mapJourney) };
    }

    /**
     * Ortssuche (`LocationInformationRequest`).
     *
     * Reihenfolge nach `Trias_Locations.xsd`: InitialInput, dann Restrictions mit Type,
     * NumberOfResults.
     *
     * @param query Der Suchbegriff
     * @param results Gewünschte Trefferzahl
     */
    private async requestLocations(
        query: string,
        results = 10,
    ): Promise<ReadonlyArray<Hafas.Station | Hafas.Stop | Hafas.Location>> {
        const response = await this.request(
            'locations',
            `<LocationInformationRequest>` +
                `<InitialInput><LocationName>${this.escapeXml(query)}</LocationName></InitialInput>` +
                `<Restrictions><Type>stop</Type><NumberOfResults>${results}</NumberOfResults></Restrictions>` +
                `</LocationInformationRequest>`,
        );

        const payload = response.Trias?.ServiceDelivery?.DeliveryPayload?.LocationInformationResponse;
        const found: TriasLocationResult[] = payload?.LocationResult ?? [];
        this.checkError(payload?.ErrorMessage, found.length > 0);
        // Die Liste kommt bereits nach `Probability` absteigend sortiert.
        return found.slice(0, results).map(mapLocation);
    }

    /**
     * Details zu einer Haltestelle.
     *
     * TRIAS hat keinen eigenen Request dafür; die Ortssuche nimmt aber auch eine `LocationRef`
     * entgegen (`xs:choice` zwischen `InitialInput` und `LocationRef`), womit sich eine ID
     * auflösen lässt.
     *
     * @param id Die Haltestellen-ID
     */
    private async requestStop(id: string): Promise<Hafas.Station | Hafas.Stop | Hafas.Location> {
        const response = await this.request(
            'stop',
            `<LocationInformationRequest>` +
                `${this.locationRef(id)}` +
                `<Restrictions><Type>stop</Type><NumberOfResults>1</NumberOfResults></Restrictions>` +
                `</LocationInformationRequest>`,
        );

        const payload = response.Trias?.ServiceDelivery?.DeliveryPayload?.LocationInformationResponse;
        const found: TriasLocationResult[] = payload?.LocationResult ?? [];
        this.checkError(payload?.ErrorMessage, found.length > 0);
        if (found.length === 0) {
            throw new Error(`TRIAS: no stop found for id ${id}`);
        }
        return mapLocation(found[0]);
    }
}

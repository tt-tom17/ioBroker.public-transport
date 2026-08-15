/**
 * EfaService – Backend-Service für EFA-JSON-Systeme (Mentz, `outputFormat=rapidJSON`).
 *
 * Anders als HAFAS, db-vendo und MOTIS gibt es für EFA keinen fertigen Client im
 * hafas-client-Format. `createClient()` liefert deshalb einen **Shim**: ein Objekt mit den
 * hafas-client-Methoden, das intern die drei EFA-Requests absetzt und die Antworten über
 * {@link ../tools/efaMapper} nach FPTF übersetzt. Timeout, Wiederholungen und die
 * Produkt-Bereinigung kommen unverändert aus {@link BaseTransportService}.
 *
 * Erstes Zielsystem ist der VRR (Rhein-Ruhr, größter deutscher Verbund). Dieselbe Software
 * läuft bei zahlreichen weiteren Verbünden; die Basis-URL steht deshalb nicht im Code
 * verstreut, sondern gesammelt in {@link EFA_NETWORKS} – ein weiterer Verbund ist ein
 * Eintrag dort plus ein Eintrag im Profil-Dropdown des Admin-Tabs.
 */
import type * as Hafas from 'hafas-client';
import type { PublicTransport } from '../../main';
import { mapJourney, mapLocation, mapStopEvent } from '../tools/efaMapper';
import type {
    EfaDepartureMonitorResponse,
    EfaLocation,
    EfaStopFinderResponse,
    EfaSystemMessage,
    EfaTripResponse,
} from '../types/efaJson';
import { BaseTransportService } from './baseTransportService';

/**
 * Schnittstellenversion, die alle bekannten EFA-Server der 10er-Reihe akzeptieren. Sie gehört
 * laut Hersteller-Doku in jede Anfrage; ohne sie antworten manche Server in einem älteren
 * Format.
 */
const EFA_INTERFACE_VERSION = '10.4.18.18';

/**
 * Systemmeldung, die KEIN Fehler ist: Der Broker-Hinweis mit leerem Text kommt bei jeder
 * erfolgreichen Antwort mit und darf die Abfrage nicht scheitern lassen.
 */
const EFA_HARMLESS_MESSAGE_CODE = -8011;

/** Zeitzone, in der EFA-Server die Anfragezeit (`itdDate`/`itdTime`) erwarten. */
const EFA_REQUEST_TIMEZONE = 'Europe/Berlin';

/**
 * Obergrenze für die Anzahl der beim Server angeforderten Abfahrten. Ist ein Produktfilter
 * aktiv, wird großzügiger angefragt (es wird erst nach dem Mapping gefiltert) – aber nie
 * unbegrenzt, damit eine breit eingestellte Station keine Massenabfrage auslöst.
 */
const EFA_MAX_DEPARTURE_RESULTS = 50;

/**
 * Basis-URLs der unterstützten EFA-Verbünde, ausgewählt über den Profilnamen aus der
 * Adapter-Konfiguration (`efa:<profil>` im Dropdown des Admin-Tabs).
 *
 * Die Adresse ist bewusst **nicht** konfigurierbar: Ein Verbund verlangt in der Regel eine
 * eigene Nutzungsvereinbarung, die der Adapter für seine Anwender mit abbildet (beim VRR
 * etwa Attribution mit Logo und Link). Ein frei eingetragener Fremdserver würde dieses
 * Einvernehmen still aushebeln. Ein neuer Verbund ist deshalb eine Code-Änderung – nach
 * Klärung der Nutzungsbedingungen – und keine Einstellung.
 */
const EFA_NETWORKS: Record<string, string> = {
    /** Verkehrsverbund Rhein-Ruhr – Open Service API, registrierungsfrei nutzbar. */
    vrr: 'https://openservice.vrr.de/openservice',
};

export class EfaService extends BaseTransportService {
    /** Profilname des Verbunds, z. B. `vrr`. Bestimmt die Basis-URL, s. {@link EFA_NETWORKS}. */
    private readonly profile: string;

    /**
     * @param adapter Die Adapter-Instanz
     * @param clientName Name/User-Agent, der an den Server übergeben wird
     * @param profile Profilname des Verbunds aus der Instanz-Konfiguration (z. B. `vrr`)
     */
    constructor(adapter: PublicTransport, clientName: string, profile: string) {
        super(adapter, clientName);
        this.profile = profile.trim();
    }

    /**
     * Löst einen Profilnamen in die Basis-URL des Verbunds auf. Fail-fast wie bei HAFAS: ohne
     * bzw. mit unbekanntem Profil startet der Adapter bewusst NICHT mit einem stillen Default,
     * weil sonst Fahrplandaten einer völlig anderen Region ausgeliefert würden.
     *
     * @returns die Basis-URL ohne abschließenden Schrägstrich
     */
    private resolveEndpoint(): string {
        const available = Object.keys(EFA_NETWORKS)
            .map(name => `'${name}'`)
            .join(', ');
        if (!this.profile) {
            throw new Error(
                `No EFA network configured. Please select an EFA network (${available}) in the adapter settings.`,
            );
        }
        const endpoint = EFA_NETWORKS[this.profile];
        if (!endpoint) {
            throw new Error(`unknown EFA network: ${this.profile}. available networks: ${available}.`);
        }
        return endpoint.replace(/\/+$/, '');
    }

    protected get serviceName(): string {
        return 'EFA';
    }

    /**
     * Baut den Shim. Ein echter Client wird nicht erzeugt – die Prüfung beschränkt sich
     * deshalb darauf, dass das konfigurierte Profil einem bekannten Verbund entspricht
     * (fail-fast beim Start statt erst beim ersten Poll).
     */
    protected createClient(): Hafas.HafasClient {
        this.resolveEndpoint();
        const client: Hafas.HafasClient = {
            departures: (station, options) => this.requestDepartures(station, options, false),
            arrivals: async (station, options) => ({
                arrivals: (await this.requestDepartures(station, options, true)).departures,
            }),
            journeys: (from, to, options) => this.requestJourneys(from, to, options),
            locations: (name, options) => this.requestLocations(name, options?.results),
            stop: (id, _options) => this.requestStop(id),
            nearby: () => Promise.reject(new Error('The EFA backend does not support nearby searches.')),
            // Pflichtmethode des Interfaces, die der Adapter nirgends aufruft. EFA kennt keine
            // Entsprechung, deshalb nur die eigene Uhrzeit statt einer erfundenen Serverangabe.
            serverInfo: () => Promise.resolve({ serverTime: new Date().toISOString() }),
        };
        return client;
    }

    /**
     * Setzt eine EFA-Anfrage ab und gibt die geparste Antwort zurück.
     *
     * @param path Request-Pfad, z. B. `XML_DM_REQUEST`
     * @param params Die zusätzlichen Anfrage-Parameter
     */
    private async request<T>(path: string, params: Record<string, string>): Promise<T> {
        const query = new URLSearchParams({
            outputFormat: 'rapidJSON',
            coordOutputFormat: 'WGS84[dd.ddddd]',
            version: EFA_INTERFACE_VERSION,
            ...params,
        });
        const url = `${this.resolveEndpoint()}/${path}?${query.toString()}`;
        this.adapter.log.debug(`[EFA] GET ${url}`);

        const response = await fetch(url, {
            headers: { Accept: 'application/json', 'User-Agent': this.clientName },
        });
        if (!response.ok) {
            const error = new Error(`EFA request failed: ${response.status} ${response.statusText}`) as Error & {
                isCausedByServer?: boolean;
            };
            // 5xx als Serverfehler markieren, damit die Basisklasse den Aufruf wiederholt.
            error.isCausedByServer = response.status >= 500;
            throw error;
        }
        return (await response.json()) as T;
    }

    /**
     * Wertet die `systemMessages` der Antwort aus. Der Broker-Hinweis `-8011` wird
     * übersprungen; alles andere mit Text wird protokolliert und – wenn kein Ergebnis
     * geliefert wurde – als Fehler geworfen.
     *
     * @param messages Die Systemmeldungen der Antwort
     * @param hasResults true, wenn die Antwort trotzdem verwertbare Daten enthält
     */
    private checkSystemMessages(messages: EfaSystemMessage[] | undefined, hasResults: boolean): void {
        const relevant = (messages ?? []).filter(
            message => message.code !== EFA_HARMLESS_MESSAGE_CODE && (message.text ?? '').trim().length > 0,
        );
        if (relevant.length === 0) {
            return;
        }
        const text = relevant.map(message => `${message.code ?? '?'}: ${message.text}`).join(' | ');
        if (hasResults) {
            this.adapter.log.debug(`[EFA] Server message: ${text}`);
            return;
        }
        throw new Error(`EFA server reported: ${text}`);
    }

    /**
     * Formatiert einen Zeitpunkt als EFA-Anfrageparameter. EFA erwartet die **lokale**
     * Serverzeit, nicht UTC – die Antwortzeiten kommen umgekehrt in UTC zurück.
     *
     * @param when Der gewünschte Zeitpunkt (Standard: jetzt)
     */
    private formatRequestTime(when?: Date | string | number): { itdDate: string; itdTime: string } {
        const date = when ? new Date(when) : new Date();
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: EFA_REQUEST_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).formatToParts(date);
        const get = (type: string): string => parts.find(part => part.type === type)?.value ?? '';
        return {
            itdDate: `${get('year')}${get('month')}${get('day')}`,
            itdTime: `${get('hour')}${get('minute')}`,
        };
    }

    /**
     * Löst die von hafas-client erlaubten Stations-Angaben (String oder Objekt) zu einer ID auf.
     *
     * @param station Die Station als ID oder Objekt
     */
    private toStationId(station: string | Hafas.Station | Hafas.Stop | Hafas.Location): string {
        const id = typeof station === 'string' ? station : station.id;
        if (!id) {
            throw new Error('EFA requests need a station id.');
        }
        return id;
    }

    /**
     * Abfahrtsmonitor (`XML_DM_REQUEST`).
     *
     * Zwei Filter werden bewusst NACH dem Mapping angewendet, weil EFA sie nicht in der
     * Anfrage kennt bzw. serverabhängig umsetzt: das Zeitfenster (`duration`) und der
     * Produktfilter. Damit trotzdem genug Abfahrten übrig bleiben, wird bei aktivem
     * Produktfilter großzügiger angefragt.
     *
     * @param station Die Station (ID oder Objekt)
     * @param options Abfrage-Optionen
     * @param arrival true = Ankünfte statt Abfahrten
     */
    private async requestDepartures(
        station: string | Hafas.Station | Hafas.Stop | Hafas.Location,
        options: Hafas.DeparturesArrivalsOptions | undefined,
        arrival: boolean,
    ): Promise<Hafas.Departures> {
        const requested = options?.results ?? 10;
        const productFilter = options?.products;
        const limit = Math.min(
            EFA_MAX_DEPARTURE_RESULTS,
            productFilter && Object.keys(productFilter).length > 0 ? requested * 3 : requested,
        );
        const time = this.formatRequestTime(options?.when);

        const response = await this.request<EfaDepartureMonitorResponse>('XML_DM_REQUEST', {
            type_dm: 'any',
            name_dm: this.toStationId(station),
            mode: 'direct',
            useProxFootSearch: '0',
            useRealtime: '1',
            limit: String(limit),
            itdDateTimeDepArr: arrival ? 'arr' : 'dep',
            ...time,
        });
        this.checkSystemMessages(response.systemMessages, (response.stopEvents ?? []).length > 0);

        let departures = (response.stopEvents ?? []).map(event => mapStopEvent(event, arrival));
        departures = this.filterByProducts(departures, productFilter);
        departures = this.filterByDuration(departures, options?.when, options?.duration);
        departures = this.sortByEffectiveTime(departures);

        return { departures: departures.slice(0, requested) };
    }

    /**
     * Wirft Abfahrten heraus, deren Produkt in der Stations-Konfiguration abgewählt ist.
     * Ohne Filter oder bei unbekanntem Produkt bleibt die Abfahrt erhalten – ein unbekanntes
     * Produkt darf nichts verschlucken.
     *
     * @param departures Die gemappten Abfahrten
     * @param products Der Produktfilter aus der Konfiguration
     */
    private filterByProducts(departures: Hafas.Alternative[], products?: Hafas.Products): Hafas.Alternative[] {
        const active = Object.entries(products ?? {});
        if (active.length === 0) {
            return departures;
        }
        const allowed = new Set(active.filter(([, enabled]) => enabled).map(([id]) => id));
        if (allowed.size === 0) {
            return departures;
        }
        return departures.filter(departure => {
            const product = departure.line?.product;
            return !product || allowed.has(product);
        });
    }

    /**
     * Begrenzt die Abfahrten auf das konfigurierte Zeitfenster (in Minuten ab dem
     * Abfragezeitpunkt). EFA kennt keinen entsprechenden Anfrageparameter.
     *
     * Maßgeblich ist die **tatsächliche** Abfahrtszeit (`when`), nicht die Sollzeit: Sonst
     * bliebe eine Fahrt im Fenster, die real erst Stunden später fährt.
     *
     * @param departures Die gemappten Abfahrten
     * @param when Startzeitpunkt der Abfrage
     * @param duration Zeitfenster in Minuten
     */
    private filterByDuration(
        departures: Hafas.Alternative[],
        when?: Date | string | number,
        duration?: number,
    ): Hafas.Alternative[] {
        if (!duration || duration <= 0) {
            return departures;
        }
        const start = when ? new Date(when).getTime() : Date.now();
        const end = start + duration * 60_000;
        return departures.filter(departure => {
            const time = Date.parse(departure.when ?? departure.plannedWhen ?? '');
            return !Number.isFinite(time) || time <= end;
        });
    }

    /**
     * Sortiert nach der tatsächlichen Abfahrtszeit.
     *
     * EFA liefert die Liste in der Reihenfolge der **Sollzeiten**. Das genügt nicht: Der VRR
     * meldet z.B. für Nacht-Express-Fahrten die Sollzeit 00:00 mit einer Ist-Zeit mehrere
     * Stunden später (beobachtet am 15.08.2026: NE7 Soll 00:00, Ist 07:05). Solche Einträge
     * stünden sonst am Anfang der Abfahrtstafel, obwohl sie zuletzt fahren.
     *
     * @param departures Die gemappten Abfahrten
     */
    private sortByEffectiveTime(departures: Hafas.Alternative[]): Hafas.Alternative[] {
        return [...departures].sort((a, b) => {
            const timeA = Date.parse(a.when ?? a.plannedWhen ?? '');
            const timeB = Date.parse(b.when ?? b.plannedWhen ?? '');
            if (!Number.isFinite(timeA) || !Number.isFinite(timeB)) {
                return 0;
            }
            return timeA - timeB;
        });
    }

    /**
     * Verbindungsauskunft (`XML_TRIP_REQUEST2`).
     *
     * @param from Startstation
     * @param to Zielstation
     * @param options Abfrage-Optionen
     */
    private async requestJourneys(
        from: string | Hafas.Station | Hafas.Stop | Hafas.Location,
        to: string | Hafas.Station | Hafas.Stop | Hafas.Location,
        options: Hafas.JourneysOptions | undefined,
    ): Promise<Hafas.Journeys> {
        const arriveBy = options?.arrival !== undefined && options.arrival !== null;
        const time = this.formatRequestTime(arriveBy ? options?.arrival : options?.departure);
        const params: Record<string, string> = {
            type_origin: 'any',
            name_origin: this.toStationId(from),
            type_destination: 'any',
            name_destination: this.toStationId(to),
            calcNumberOfTrips: String(options?.results ?? 5),
            useRealtime: '1',
            itdTripDateTimeDepArr: arriveBy ? 'arr' : 'dep',
            ...time,
        };
        // Umstiegsgrenze nur mitsenden, wenn sie gesetzt ist: -1 heißt im Adapter
        // "Backend entscheidet" und darf NICHT als 0 (= nur Direktverbindungen) ankommen.
        if (typeof options?.transfers === 'number' && options.transfers >= 0) {
            params.ptOptionsActive = '1';
            params.maxChanges = String(options.transfers);
        }
        if (typeof options?.via === 'string' && options.via.length > 0) {
            params.type_via = 'any';
            params.name_via = options.via;
        }

        const response = await this.request<EfaTripResponse>('XML_TRIP_REQUEST2', params);
        this.checkSystemMessages(response.systemMessages, (response.journeys ?? []).length > 0);

        return { journeys: (response.journeys ?? []).map(journey => mapJourney(journey)) };
    }

    /**
     * Ortssuche (`XML_STOPFINDER_REQUEST`), sortiert nach Trefferqualität.
     *
     * @param query Suchbegriff oder ID
     * @param results Maximale Trefferzahl
     */
    private async requestLocations(query: string, results?: number): Promise<(Hafas.Stop | Hafas.Location)[]> {
        const response = await this.request<EfaStopFinderResponse>('XML_STOPFINDER_REQUEST', {
            type_sf: 'any',
            name_sf: query,
            anyMaxSizeHitList: String(results ?? 10),
        });
        this.checkSystemMessages(response.systemMessages, (response.locations ?? []).length > 0);

        // Der vom Server als bester markierte Treffer gewinnt, danach die Trefferqualität.
        const locations = [...(response.locations ?? [])].sort(
            (a, b) =>
                Number(b.isBest ?? false) - Number(a.isBest ?? false) || (b.matchQuality ?? 0) - (a.matchQuality ?? 0),
        );
        return locations.slice(0, results ?? 10).map(location => mapLocation(location));
    }

    /**
     * Details zu einer Station. EFA hat dafür keinen eigenen Request – die Ortssuche mit der
     * ID liefert denselben Datensatz.
     *
     * @param id Die Stations-ID (oder ein Stop-Objekt)
     */
    private async requestStop(id: string | Hafas.Stop): Promise<Hafas.Stop | Hafas.Location> {
        const stationId = this.toStationId(id);
        const response = await this.request<EfaStopFinderResponse>('XML_STOPFINDER_REQUEST', {
            type_sf: 'any',
            name_sf: stationId,
            anyMaxSizeHitList: '5',
        });
        const locations = response.locations ?? [];
        this.checkSystemMessages(response.systemMessages, locations.length > 0);

        // Exakte ID zuerst, dann der vom Server als bester markierte Treffer.
        const match: EfaLocation | undefined =
            locations.find(location => location.id === stationId) ??
            locations.find(location => location.isBest) ??
            locations[0];
        if (!match) {
            throw new Error(`EFA did not return any location for id '${stationId}'.`);
        }
        return mapLocation(match);
    }
}

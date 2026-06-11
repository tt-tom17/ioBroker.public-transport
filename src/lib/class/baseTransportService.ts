/**
 * BaseTransportService - gemeinsame Basisklasse für alle ÖPNV-Backend-Services
 * (HAFAS, db-vendo, MOTIS).
 *
 * Alle drei Backends sprechen dieselbe `hafas-client`-kompatible API. Diese Klasse
 * bündelt daher den kompletten gemeinsamen Code (Client-Lebenszyklus + die vier
 * Abfrage-Methoden) an einer Stelle. Die konkreten Services müssen nur noch festlegen,
 * WIE ihr Client erzeugt wird (`createClient()`) und WIE sie heißen (`serviceName`).
 *
 * Zusätzlich kapselt sie die Fehlerbehandlung: Jeder Backend-Aufruf läuft durch
 * `call()`, das einen Timeout setzt und vorübergehende (transiente) Fehler automatisch
 * wiederholt.
 */
import type * as Hafas from 'hafas-client';
import type { PublicTransport } from '../../main';
import type { ITransportService } from '../types/transportService';

/**
 * Maximale Anzahl zusätzlicher Wiederholungsversuche bei transienten Backend-Fehlern
 * (z.B. Server-5xx, Netzwerkfehler, Rate-Limit). Der erste Versuch zählt NICHT mit:
 * Bei dem Wert 2 wird ein Request also insgesamt bis zu 3-mal ausgeführt (1 + 2 Retries).
 */
const TRANSPORT_MAX_RETRIES = 2;

/**
 * Basis-Wartezeit in Millisekunden zwischen zwei Versuchen. Die tatsächliche Pause wächst
 * linear mit der Versuchsnummer (vor dem 1. Retry 1×, vor dem 2. Retry 2× usw.), damit ein
 * kurzzeitig gestörtes Backend nicht sofort erneut mit Anfragen überrollt wird (einfacher
 * "Backoff"). Bei 500 ms wird also 500 ms, dann 1000 ms gewartet.
 */
const TRANSPORT_RETRY_DELAY_MS = 500;

/**
 * Maximale Dauer in Millisekunden, die ein EINZELNER Backend-Aufruf dauern darf, bevor er
 * als fehlgeschlagen gilt. Verhindert, dass ein hängender Request den gesamten (sequentiell
 * ablaufenden) Poll-Durchlauf blockiert. Gilt pro Versuch – nicht über alle Wiederholungen
 * zusammengerechnet.
 */
const TRANSPORT_REQUEST_TIMEOUT_MS = 30_000;

export abstract class BaseTransportService implements ITransportService {
    protected client: Hafas.HafasClient | null = null;
    protected readonly adapter: PublicTransport;
    protected readonly clientName: string;

    /**
     * @param adapter Die Adapter-Instanz (liefert die ioBroker-Timer für Timeout/Backoff,
     *                die beim Shutdown automatisch aufgeräumt werden)
     * @param clientName Name/User-Agent, der an den Backend-Client übergeben wird
     */
    constructor(adapter: PublicTransport, clientName: string) {
        this.adapter = adapter;
        this.clientName = clientName;
    }

    /**
     * Erzeugt den konkreten Backend-Client. Einziger echter Unterschied zwischen den
     * Services – wird von `init()` aufgerufen.
     */
    protected abstract createClient(): Hafas.HafasClient;

    /**
     * Sprechender Name des Service (z.B. "HAFAS") für Fehler- und Timeout-Meldungen.
     */
    protected abstract get serviceName(): string;

    /**
     * Initialisiert den Backend-Client. Muss vor der Nutzung der Abfrage-Methoden
     * aufgerufen werden. Wirft bei einem Fehler – ein Rückgabewert wird nicht benötigt.
     */
    public init(): void {
        try {
            this.client = this.createClient();
        } catch (error) {
            throw new Error(`The ${this.serviceName} client could not be initialized: ${(error as Error).message}`);
        }
    }

    /**
     * Gibt den initialisierten Client zurück oder wirft einen Fehler.
     */
    protected getClient(): Hafas.HafasClient {
        if (!this.client) {
            throw new Error(`${this.serviceName}Service has not been initialized yet. Please call init() first.`);
        }
        return this.client;
    }

    /**
     * Führt einen Backend-Aufruf mit Timeout und automatischer Wiederholung aus.
     *
     * Ablauf: Der Aufruf wird gestartet und mit {@link TRANSPORT_REQUEST_TIMEOUT_MS}
     * zeitlich begrenzt. Schlägt er mit einem transienten Fehler fehl (siehe
     * {@link isRetryable}), wird nach einer wachsenden Pause erneut versucht – bis zu
     * {@link TRANSPORT_MAX_RETRIES}-mal. Nicht-transiente Fehler (z.B. ungültige Anfrage)
     * werden sofort weitergereicht.
     *
     * @param operation Die eigentliche Client-Operation
     * @returns Das Ergebnis des Aufrufs
     */
    private async call<T>(operation: (client: Hafas.HafasClient) => Promise<T>): Promise<T> {
        let lastError: unknown;
        for (let attempt = 0; attempt <= TRANSPORT_MAX_RETRIES; attempt++) {
            try {
                return await this.withTimeout(operation(this.getClient()));
            } catch (error) {
                lastError = error;
                if (!this.isRetryable(error) || attempt === TRANSPORT_MAX_RETRIES) {
                    break;
                }
                // ioBroker-eigenes delay(): wird beim Adapter-Shutdown sauber aufgelöst.
                await this.adapter.delay(TRANSPORT_RETRY_DELAY_MS * (attempt + 1));
            }
        }
        throw lastError;
    }

    /**
     * Entscheidet, ob ein Fehler vorübergehend (transient) und damit wiederholbar ist.
     * `hafas-client` markiert solche Fehler mit `shouldRetry`; Server-5xx zusätzlich mit
     * `isCausedByServer`. Eigene Timeout-Fehler werden ebenfalls als wiederholbar gewertet.
     *
     * @param error Der aufgetretene Fehler
     */
    private isRetryable(error: unknown): boolean {
        const e = error as { shouldRetry?: boolean; isCausedByServer?: boolean; isTimeout?: boolean } | undefined;
        return e?.shouldRetry === true || e?.isCausedByServer === true || e?.isTimeout === true;
    }

    /**
     * Begrenzt eine Promise zeitlich. Läuft sie länger als {@link TRANSPORT_REQUEST_TIMEOUT_MS},
     * wird mit einem als wiederholbar markierten Timeout-Fehler abgelehnt. Der zugrunde
     * liegende Request kann im Hintergrund weiterlaufen, blockiert aber den Ablauf nicht mehr.
     *
     * @param promise Die zu begrenzende Promise
     */
    private withTimeout<T>(promise: Promise<T>): Promise<T> {
        let timer: ioBroker.Timeout | undefined;
        const timeout = new Promise<never>((_resolve, reject) => {
            // ioBroker-eigener Timer: wird beim Adapter-Shutdown automatisch aufgeräumt.
            timer = this.adapter.setTimeout(() => {
                const err = new Error(
                    `${this.serviceName} request timed out after ${TRANSPORT_REQUEST_TIMEOUT_MS} ms`,
                ) as Error & { isTimeout: boolean };
                err.isTimeout = true;
                reject(err);
            }, TRANSPORT_REQUEST_TIMEOUT_MS);
        });
        // Es gewinnt, was zuerst fertig ist: das eigentliche Ergebnis oder der Timeout.
        // Der originale Fehler des Aufrufs wird unveraendert weitergereicht (wichtig fuer
        // isRetryable). Der Timer wird in jedem Fall aufgeräumt.
        return Promise.race([promise, timeout]).finally(() => this.adapter.clearTimeout(timer));
    }

    /**
     * Suche nach Orten/Stationen.
     *
     * @param query Suchbegriff für Orte/Stationen
     * @param options optionale Suchoptionen
     */
    async getLocations(
        query: string,
        options?: Hafas.LocationsOptions,
    ): Promise<ReadonlyArray<Hafas.Station | Hafas.Stop | Hafas.Location>> {
        return this.call(client => client.locations(query, options));
    }

    /**
     * Liefert Abfahrten für eine gegebene Stations-ID.
     *
     * @param stationId ID der Station
     * @param options optionale Abfrage-Optionen
     */
    async getDepartures(stationId: string, options?: Hafas.DeparturesArrivalsOptions): Promise<Hafas.Departures> {
        return this.call(client => client.departures(stationId, options));
    }

    /**
     * Liefert Routeninformationen zwischen zwei Stationen.
     *
     * @param fromId ID der Startstation
     * @param toId ID der Zielstation
     * @param options optionale Routen-Optionen
     */
    async getJourneys(fromId: string, toId: string, options?: Hafas.JourneysOptions): Promise<Hafas.Journeys> {
        return this.call(client => client.journeys(fromId, toId, options));
    }

    /**
     * Holt Details zu einer Station/einem Haltpunkt.
     *
     * @param stationId ID der Station/des Haltpunkts
     * @param options optionale Abfrageoptionen
     */
    async getStop(
        stationId: string,
        options?: Hafas.StopOptions,
    ): Promise<Hafas.Station | Hafas.Stop | Hafas.Location> {
        return this.call(client => client.stop(stationId, options));
    }
}

import * as utils from '@iobroker/adapter-core';
import { VendoService } from './lib/class/dbVendoService';
import { DepartureRequest } from './lib/class/departure';
import { DeparturePolling } from './lib/class/departurePolling';
import { EfaService } from './lib/class/efaService';
import { HafasService } from './lib/class/hafasService';
import { JourneyPolling } from './lib/class/journeyPolling';
import { JourneysRequest } from './lib/class/journeys';
import { MotisService } from './lib/class/motisService';
import { StationRequest } from './lib/class/station';
import { Library } from './lib/tools/library';
import type { ITransportService } from './lib/types/transportService';

/** Mindestwert für die Objektanzahl-Warnschwelle (objectsWarnLimit) */
const OBJECTS_WARN_LIMIT_MIN = 5000;

export class PublicTransport extends utils.Adapter {
    library: Library;
    unload: boolean = false;
    hService!: HafasService;
    vService!: VendoService;
    mService!: MotisService;
    eService!: EfaService;
    activeService!: ITransportService | undefined;
    depRequest!: DepartureRequest;
    journeysRequest!: JourneysRequest;
    stationRequest!: StationRequest;
    private departurePolling!: DeparturePolling;
    private journeyPolling!: JourneyPolling;

    /**
     * Creates an instance of the adapter.
     *
     * @param options The adapter options
     */
    public constructor(options: Partial<utils.AdapterOptions> = {}) {
        super({
            ...options,
            name: 'public-transport',
            useFormatDate: true,
        });
        this.library = new Library(this);
        this.on('ready', this.onReady.bind(this));
        // this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Gibt die Instanz des aktiven Transport-Service zurück.
     *
     * @returns Die Instanz des aktiven Transport-Service
     */
    public getActiveService(): ITransportService {
        if (!this.activeService) {
            throw new Error('Transport service has not been initialized.');
        }
        return this.activeService;
    }

    /**
     * Holt Stationsinformationen für alle aktivierten Stationen.
     */
    private async fetchStationInformation(): Promise<void> {
        if (!this.getActiveService()) {
            return;
        }

        if (!this.config.stationConfig || this.config.stationConfig.length === 0) {
            this.log.debug(
                'No stations found in configuration for station info queries. Please configure in Admin UI.',
            );
            return;
        }

        const enabledStations = this.config.stationConfig.filter(station => station.enabled);

        if (enabledStations.length === 0) {
            this.log.debug('No enabled stations found. Please enable at least one station.');
            return;
        }

        this.log.info(`${enabledStations.length} active station(s) found:`);
        for (const station of enabledStations) {
            // Adapter wird heruntergefahren -> keine weiteren Stationen mehr abfragen/schreiben
            if (this.unload) {
                return;
            }
            if (station.id) {
                this.log.info(`Querying info for: ${station.customName || station.name} (${station.id})...`);
                const stationData = await this.stationRequest.getStation(
                    station.id,
                    this.getActiveService(),
                    undefined,
                    station.client_profile,
                );
                await this.stationRequest.writeStationData(
                    `${this.namespace}.Stations.${station.id}.info`,
                    stationData,
                );
            }
        }
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    /**
     * Übernimmt die in der Konfiguration (native.objectsWarnLimit) hinterlegte Warnschwelle
     * in den vom js-controller ausgewerteten State `system.adapter.<namespace>.objectsWarnLimit`.
     * Der js-controller liest diesen State, um bei zu vielen Objekten zu warnen. Der Save-Button
     * der Admin-UI speichert nur nach `native`, daher wird der Wert hier beim Start angewendet.
     */
    private async applyObjectsWarnLimit(): Promise<void> {
        const warnLimit = this.config.objectsWarnLimit;
        if (typeof warnLimit !== 'number' || warnLimit < OBJECTS_WARN_LIMIT_MIN) {
            return;
        }
        const stateId = `system.adapter.${this.namespace}.objectsWarnLimit`;
        try {
            const current = await this.getForeignStateAsync(stateId);
            if (current?.val !== warnLimit) {
                await this.setForeignStateAsync(stateId, warnLimit, true);
                this.log.debug(`objectsWarnLimit applied to ${stateId}: ${warnLimit}`);
            }
        } catch (error) {
            this.log.warn(`Could not apply objectsWarnLimit. Error message: ${(error as Error).message}`);
        }
    }

    private async onReady(): Promise<void> {
        // Initialize your adapter here
        await this.library.init();
        const states = await this.getStatesAsync('*');
        await this.library.initStates(states);

        // Konfigurierte Objektanzahl-Warnschwelle in den vom js-controller gelesenen State übernehmen
        await this.applyObjectsWarnLimit();

        // Service basierend auf Konfiguration auswählen
        const serviceType = this.config.serviceType || 'hafas'; // 'hafas', 'vendo', 'motis' oder 'efa'
        const clientName = `${this.config.clientName || 'iobroker-public-transport'}-${Math.floor(Math.random() * 1001)}`;

        try {
            if (serviceType === 'vendo') {
                // VendoService initialisieren
                this.vService = new VendoService(this, clientName);
                this.vService.init();
                this.activeService = this.vService;
                this.log.info(`VendoService initialized with ClientName: ${clientName}`);
            } else if (serviceType === 'efa') {
                // EfaService initialisieren (EFA-JSON, z.B. VRR). Wie bei HAFAS bestimmt das
                // Profil den Verbund; die zugehörige Basis-URL steht fest im EfaService.
                const efaNetwork = this.config.profile || '';
                this.eService = new EfaService(this, clientName, efaNetwork);
                this.eService.init();
                this.activeService = this.eService;
                this.log.info(`EFA client initialized with network: ${efaNetwork}`);
            } else if (serviceType === 'motis') {
                // MotisService (Transitous) initialisieren
                this.mService = new MotisService(this, clientName);
                this.mService.init();
                this.activeService = this.mService;
                this.log.info(`MOTIS client (Transitous) initialized with ClientName: ${clientName}`);
            } else {
                // HafasService initialisieren (Standard)
                // Leeres Profil bewusst durchreichen (nicht auf 'unknown' mappen):
                // resolveProfile() schlägt dann mit klarer Meldung fehl (fail-fast),
                // statt einen irreführenden Default zu wählen.
                const profileName = this.config.profile || '';
                this.hService = new HafasService(this, clientName, profileName);
                this.hService.init();
                this.activeService = this.hService;
                this.log.info(`HAFAS client initialized with profile: ${profileName}`);
            }
        } catch (error) {
            this.log.error(
                `Transport service (client) could not be initialized. Error message: ${(error as Error).message}`,
            );
            return;
        }

        this.depRequest = new DepartureRequest(this);
        this.stationRequest = new StationRequest(this);
        this.journeysRequest = new JourneysRequest(this);
        this.departurePolling = new DeparturePolling(this);
        this.journeyPolling = new JourneyPolling(this);

        // Untergrenze absichern: das Eingabefeld im Admin begrenzt nur im Browser, Werte aus
        // dem Objektbaum oder aus Alt-Konfigurationen können darunter liegen
        const pollInterval = Math.max(5, this.config.pollInterval || 5);

        try {
            await this.departurePolling.startDepartures(pollInterval);
        } catch (err) {
            this.log.error(`Query for departures failed. Error message: ${(err as Error).message}`);
        }

        try {
            await this.journeyPolling.startJourneys(pollInterval);
        } catch (err) {
            this.log.error(`Error querying journeys: ${(err as Error).message}`);
        }

        try {
            await this.fetchStationInformation();
        } catch (err) {
            this.log.error(`Error querying stations. Error message: ${(err as Error).message}`);
        }
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     *
     * @param callback Function to be called when unload is complete
     */
    private onUnload(callback: () => void): void {
        try {
            // Signalisiere allen laufenden Abläufen, dass der Adapter heruntergefahren wird,
            // damit keine States mehr in den gestoppten Adapter geschrieben werden.
            this.unload = true;

            // Here you must clear all timeouts or intervals that may still be active
            this.departurePolling?.stop();
            this.journeyPolling?.stop();
            this.library?.destroy();

            callback();
        } catch {
            callback();
        }
    }

    /**
     * Is called if a subscribed state changes
     *
     * @param id The id of the state that changed
     * @param state The new state object or null/undefined if deleted
     *
     * private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
     *   if (state) {
     *       // The state was changed
     *       this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
     *   } else {
     *       // The state was deleted
     *       this.log.info(`state ${id} deleted`);
     *   }
     * }
     */

    /**
     * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
     * Using this method requires "common.messagebox" property to be set to true in io-package.json
     *
     *  @param obj iobroker.message
     */
    private async onMessage(obj: ioBroker.Message): Promise<void> {
        if (typeof obj !== 'object' || !obj.command) {
            return;
        }

        // Aktuelle Objektanzahl-Warnschwelle für die Admin-UI liefern (beim Öffnen geladen)
        if (obj.command === 'getObjectsWarnLimit') {
            let value: number | null = null;
            try {
                const state = await this.getForeignStateAsync(`system.adapter.${this.namespace}.objectsWarnLimit`);
                value = typeof state?.val === 'number' ? state.val : null;
            } catch (error) {
                this.log.warn(`Could not read objectsWarnLimit. Error message: ${(error as Error).message}`);
            }
            if (obj.callback) {
                this.sendTo(obj.from, obj.command, { objectsWarnLimit: value }, obj.callback);
            }
            return;
        }

        if (obj.message) {
            if (obj.command === 'location') {
                // Stationssuche für Admin-UI (nutzt VendoService für DB-kompatible IDs)
                try {
                    const message = obj.message as { query: string };
                    const query = message.query;

                    if (!query || query.length < 2) {
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, { error: 'Query too short' }, obj.callback);
                        }
                        return;
                    }

                    const results = await this.getActiveService().getLocations(query, { results: 20 });

                    // Formatiere Ergebnisse für die UI
                    const stations = results.map((location: any) => ({
                        id: location.id,
                        name: location.name,
                        type: location.type,
                        location: location.location
                            ? {
                                  latitude: location.location.latitude,
                                  longitude: location.location.longitude,
                              }
                            : undefined,
                        products: location.products,
                        service: this.config.serviceType || 'unknown',
                        profile: this.config.profile || 'unknown',
                    }));

                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, stations, obj.callback);
                    }
                } catch (error) {
                    this.log.error(`Location search failed. Error message: ${(error as Error).message}`);
                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, { error: (error as Error).message }, obj.callback);
                    }
                }
            }
        }
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new PublicTransport(options);
} else {
    // otherwise start the instance directly
    (() => new PublicTransport())();
}

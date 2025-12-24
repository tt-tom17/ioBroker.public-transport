import * as utils from '@iobroker/adapter-core';
import { VendoService } from './lib/class/dbVendoService';
import { DepartureRequest } from './lib/class/departure';
import { DeparturePolling } from './lib/class/departurePolling';
import { HafasService } from './lib/class/hafasService';
import { JourneyPolling } from './lib/class/journeyPolling';
import { JourneysRequest } from './lib/class/journeys';
import { StationRequest } from './lib/class/station';
import { Library } from './lib/tools/library';
import type { ITransportService } from './lib/types/transportService';

export class TTAdapter extends utils.Adapter {
    library: Library;
    unload: boolean = false;
    hService!: HafasService;
    vService!: VendoService;
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
            name: 'tt-adapter',
            useFormatDate: true,
        });
        this.library = new Library(this);
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Gibt die Instanz des aktiven Transport-Service zurück.
     *
     * @returns Die Instanz des aktiven Transport-Service
     * @throws Fehler, wenn der Service noch nicht initialisiert wurde
     */
    public getActiveService(): ITransportService {
        if (!this.activeService) {
            throw new Error(this.library.translate('msg_transportServiceNotInitialized'));
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
            this.log.warn(this.library.translate('msg_noStationsConfiguredForStationInfo'));
            return;
        }

        const enabledStations = this.config.stationConfig.filter(station => station.enabled);

        if (enabledStations.length === 0) {
            this.log.warn(this.library.translate('msg_noEnabledStations'));
            return;
        }

        this.log.info(this.library.translate('msg_activeStationsFound', enabledStations.length));
        for (const station of enabledStations) {
            if (station.id) {
                this.log.info(
                    this.library.translate('msg_fetchingStationInfo', station.customName || station.name, station.id),
                );
                const stationData = await this.stationRequest.getStation(station.id, this.activeService);
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
    private async onReady(): Promise<void> {
        // Initialize your adapter here
        await this.library.init();
        const states = await this.getStatesAsync('*');
        await this.library.initStates(states);

        // Service basierend auf Konfiguration auswählen
        const serviceType = this.config.serviceType || 'hafas'; // 'hafas' oder 'vendo'
        const clientName = this.config.clientName || 'iobroker-tt-adapter';

        try {
            if (serviceType === 'vendo') {
                // VendoService initialisieren
                this.vService = new VendoService(clientName);
                this.vService.init();
                this.activeService = this.vService;
                this.log.info(this.library.translate('msg_vendoServiceInitialized', clientName));
            } else {
                // HafasService initialisieren (Standard)
                const profileName = this.config.profile || 'unknown';
                this.hService = new HafasService(clientName, profileName);
                this.hService.init();
                this.activeService = this.hService;
                this.log.info(this.library.translate('msg_hafasClientInitialized', profileName));
            }
        } catch (error) {
            this.log.error(this.library.translate('msg_transportServiceInitFailed', (error as Error).message));
            return;
        }

        this.depRequest = new DepartureRequest(this);
        this.stationRequest = new StationRequest(this);
        this.journeysRequest = new JourneysRequest(this);
        this.departurePolling = new DeparturePolling(this);
        this.journeyPolling = new JourneyPolling(this);

        const pollInterval = this.config.pollInterval || 5;

        try {
            await this.departurePolling.startDepartures(pollInterval);
        } catch (err) {
            this.log.error(this.library.translate('msg_hafasRequestFailed', (err as Error).message));
        }

        try {
            await this.journeyPolling.startJourneys(pollInterval);
        } catch (err) {
            this.log.error(this.library.translate('msg_journeyQueryError', (err as Error).message));
        }

        try {
            await this.fetchStationInformation();
        } catch (err) {
            this.log.error(this.library.translate('msg_stationQueryError', (err as Error).message));
        }
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     *
     * @param callback Function to be called when unload is complete
     */
    private onUnload(callback: () => void): void {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            this.departurePolling?.stop();
            this.journeyPolling?.stop();

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
     */
    private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }

    /**
     * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
     * Using this method requires "common.messagebox" property to be set to true in io-package.json
     *
     *  @param obj iobroker.message
     */
    private async onMessage(obj: ioBroker.Message): Promise<void> {
        if (typeof obj === 'object' && obj.message) {
            if (obj.command === 'location') {
                // Stationssuche für Admin-UI (nutzt VendoService für DB-kompatible IDs)
                try {
                    const message = obj.message as { query: string };
                    const query = message.query;

                    if (!query || query.length < 2) {
                        if (obj.callback) {
                            this.sendTo(
                                obj.from,
                                obj.command,
                                { error: this.library.translate('msg_queryTooShort') },
                                obj.callback,
                            );
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
                    }));

                    if (obj.callback) {
                        this.sendTo(obj.from, obj.command, stations, obj.callback);
                    }
                } catch (error) {
                    this.log.error(this.library.translate('msg_locationSearchFailed', (error as Error).message));
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
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new TTAdapter(options);
} else {
    // otherwise start the instance directly
    (() => new TTAdapter())();
}

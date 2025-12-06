import * as utils from '@iobroker/adapter-core';
import { VendoService } from './lib/class/dbVendoService';
import { DepartureRequest } from './lib/class/departure';
import { HafasService } from './lib/class/hafasService';
import { StationRequest } from './lib/class/station';
import { Library } from './lib/tools/library';
import type { ITransportService } from './lib/types/transportService';

export class TTAdapter extends utils.Adapter {
    library: Library;
    unload: boolean = false;
    hService!: HafasService;
    vService!: VendoService;
    activeService!: ITransportService;
    depRequest!: DepartureRequest;
    stationRequest!: StationRequest;
    private pollIntervall: ioBroker.Interval | undefined;

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
            throw new Error('Transport-Service wurde noch nicht initialisiert');
        }
        return this.activeService;
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
                this.log.info(`VendoService initialisiert mit ClientName: ${clientName}`);
            } else {
                // HafasService initialisieren (Standard)
                const profileName = this.config.profile || 'vbb';
                this.hService = new HafasService(clientName, profileName);
                this.hService.init();
                this.activeService = this.hService;
                this.log.info(`HAFAS-Client initialisiert mit Profil: ${profileName}`);
            }
        } catch (error) {
            this.log.error(`Transport-Service konnte nicht initialisiert werden: ${(error as Error).message}`);
            return;
        }

        this.depRequest = new DepartureRequest(this);
        this.stationRequest = new StationRequest(this);

        const pollInterval = (this.config.pollInterval || 5) * 60 * 1000;
        try {
            if (this.getActiveService()) {
                // Prüfe ob Stationen konfiguriert sind
                if (!this.config.departures || this.config.departures.length === 0) {
                    this.log.warn(
                        'Keine Stationen in der Konfiguration gefunden. Bitte in der Admin-UI konfigurieren.',
                    );
                    return;
                }

                // Hole alle aktivierten Stationen
                const enabledStations = this.config.departures.filter(station => station.enabled);

                if (enabledStations.length === 0) {
                    this.log.warn('Keine aktivierten Stationen gefunden. Bitte mindestens eine Station aktivieren.');
                    return;
                }

                // Logge gefundene Stationen
                this.log.info(`${enabledStations.length} aktive Station(en) gefunden:`);
                for (const station of enabledStations) {
                    this.log.info(`  - ${station.customName || station.name} (ID: ${station.id})`);
                }

                // Starte Abfrage für jede aktivierte Station
                this.pollIntervall = this.setInterval(async () => {
                    let successCount = 0;
                    let errorCount = 0;
                    for (const station of enabledStations) {
                        if (!station.id) {
                            this.log.warn(`Station "${station.name}" hat keine gültige ID, überspringe...`);
                            continue;
                        }
                        const offsetTime = station.offsetTime ? station.offsetTime : 0;
                        const when: Date | undefined =
                            offsetTime === 0 ? undefined : new Date(Date.now() + offsetTime * 60 * 1000);
                        const duration = station.duration ? station.duration : 10;
                        const results = station.numDepartures ? station.numDepartures : 10;
                        const options = { results: results, when: when, duration: duration };
                        const products = station.products ? station.products : undefined;
                        this.log.info(`Rufe Abfahrten ab für: ${station.customName || station.name} (${station.id})`);
                        const success = await this.depRequest.getDepartures(
                            station.id,
                            this.activeService,
                            options,
                            products,
                        );
                        if (success) {
                            successCount++;
                            this.log.info(
                                `Abfahrten aktualisiert für: ${station.customName || station.name} (${station.id})`,
                            );
                        } else {
                            errorCount++;
                            this.log.warn(
                                `Abfahrten konnten nicht aktualisiert werden für: ${station.customName || station.name} (${station.id})`,
                            );
                        }
                    }
                    this.log.info(`Abfrage abgeschlossen: ${successCount} erfolgreich, ${errorCount} fehlgeschlagen`);
                    this.log.info(`Warte auf die nächste Abfrage in ${this.config.pollInterval} Minuten...`);
                }, pollInterval);

                // Erste Abfrage sofort ausführen
                let successCount = 0;
                let errorCount = 0;
                for (const station of enabledStations) {
                    if (station.id) {
                        this.log.info(`Erste Abfrage für: ${station.customName || station.name} (${station.id})`);
                        const offsetTime = station.offsetTime ? station.offsetTime : 0;
                        const when: Date | undefined =
                            offsetTime === 0 ? undefined : new Date(Date.now() + offsetTime * 60 * 1000);
                        const duration = station.duration ? station.duration : 10;
                        const results = station.numDepartures ? station.numDepartures : 10;
                        const options = { results: results, when: when, duration: duration };
                        const products = station.products ? station.products : undefined;
                        const success = await this.depRequest.getDepartures(
                            station.id,
                            this.activeService,
                            options,
                            products,
                        );
                        if (success) {
                            successCount++;
                            this.log.info(
                                `Abfahrten aktualisiert für: ${station.customName || station.name} (${station.id})`,
                            );
                        } else {
                            errorCount++;
                            this.log.warn(
                                `Abfahrten konnten nicht aktualisiert werden für: ${station.customName || station.name} (${station.id})`,
                            );
                        }
                    }
                }
                this.log.info(`Erste Abfrage abgeschlossen: ${successCount} erfolgreich, ${errorCount} fehlgeschlagen`);
                this.log.info(`Warte auf die nächste Abfrage in ${this.config.pollInterval} Minuten...`);
            }
        } catch (err) {
            this.log.error(`HAFAS Anfrage fehlgeschlagen: ${(err as Error).message}`);
        }

        try {
            if (this.getActiveService()) {
                // Prüfe ob Stationen konfiguriert sind
                if (!this.config.departures || this.config.departures.length === 0) {
                    this.log.warn(
                        'Keine Stationen in der Konfiguration gefunden. Bitte in der Admin-UI konfigurieren.',
                    );
                    return;
                }
                // Hole alle aktivierten Stationen
                const enabledStations = this.config.departures.filter(station => station.enabled);

                if (enabledStations.length === 0) {
                    this.log.warn('Keine aktivierten Stationen gefunden. Bitte mindestens eine Station aktivieren.');
                    return;
                }

                // Logge gefundene Stationen
                this.log.info(`${enabledStations.length} aktive Station(en) gefunden:`);
                for (const station of enabledStations) {
                    this.log.info(`  - ${station.customName || station.name} (ID: ${station.id})`);
                }
                for (const station of enabledStations) {
                    if (station.id) {
                        this.log.info(`Erste Abfrage für: ${station.customName || station.name} (${station.id})`);
                        await this.stationRequest.getStop(station.id, this.activeService);
                    }
                }
            }
        } catch (err) {
            this.log.error(`Fehler bei der Abfrage der Stationen: ${(err as Error).message}`);
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
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            if (this.pollIntervall) {
                clearInterval(this.pollIntervall);
            }

            callback();
        } catch {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  */
    // private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
    // 	if (obj) {
    // 		// The object was changed
    // 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    // 	} else {
    // 		// The object was deleted
    // 		this.log.info(`object ${id} deleted`);
    // 	}
    // }

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
                // Stationssuche für Admin-UI
                try {
                    const message = obj.message as { query: string };
                    const query = message.query;

                    if (!query || query.length < 2) {
                        if (obj.callback) {
                            this.sendTo(obj.from, obj.command, { error: 'Query zu kurz' }, obj.callback);
                        }
                        return;
                    }

                    const results = await this.activeService.getLocations(query, { results: 20 });

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
                    this.log.error(`Location search failed: ${(error as Error).message}`);
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

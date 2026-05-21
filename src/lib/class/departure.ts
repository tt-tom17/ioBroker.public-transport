import type * as Hafas from 'hafas-client';
import type { PublicTransport } from '../../main';
import { BaseClass } from '../tools/library';
import { mapDeparturesToDepartureStates } from '../tools/mapper';
import { defaultDepartureOpt, type DepartureState, type Products } from '../types/types';
import { NsPanelTimetable } from './nsPanelTimetable';

export class DepartureRequest extends BaseClass {
    private delayOffset: number = this.adapter.config.delayOffset || 2;
    private nsPanelTimetable: NsPanelTimetable;

    constructor(adapter: PublicTransport) {
        super(adapter);
        this.log.setLogPrefix('depReq');
        this.nsPanelTimetable = new NsPanelTimetable(adapter);
    }

    /**
     * Validiert, ob der initialisierte Client und das Profil mit dem angegebenen client_profile übereinstimmen.
     *
     * @param client_profile Das erwartete Client-Profil (z.B. "hafas:vbb", "vendo:db")
     * @throws Error wenn Client-Typ oder Profil nicht übereinstimmen
     */
    private validateClientProfile(client_profile?: string): void {
        if (!client_profile) {
            return; // Keine Validierung wenn nicht angegeben
        }

        // Parse client_profile (z.B. "hafas:vbb" -> serviceType: "hafas", profile: "vbb")
        const parts = client_profile.split(':');
        const expectedServiceType = parts[0]; // 'hafas' oder 'vendo'
        const expectedProfile = parts[1] || ''; // z.B. 'vbb', 'oebb', 'db'

        // Prüfe, ob der richtige Service-Typ initialisiert ist
        const currentServiceType = this.adapter.config.serviceType || 'hafas';
        if (currentServiceType !== expectedServiceType) {
            throw new Error(
                `Wrong client type: Expected '${expectedServiceType}', but '${currentServiceType}' is initialized (client_profile: ${client_profile})`,
            );
        }

        // Prüfe das Profil (nur relevant bei HAFAS)
        if (expectedServiceType === 'hafas' && expectedProfile) {
            const currentProfile = this.adapter.config.profile || '';
            if (currentProfile !== expectedProfile) {
                throw new Error(
                    `Wrong profile: Expected '${expectedProfile}', but '${currentProfile}' is configured (client_profile: ${client_profile})`,
                );
            }
        }
    }

    /**
     *  Ruft Abfahrten für eine gegebene stationId ab und schreibt sie in die States.
     *
     * @param stationId     Die ID der Station, für die Abfahrten abgefragt werden sollen.
     * @param service      Der Service für die Abfrage.
     * @param options      Zusätzliche Optionen für die Abfrage.
     * @param countEntries Die maximale Anzahl der Einträge, die geschrieben werden sollen.
     * @param products     Die aktivierten Produkte (true = erlaubt)
     * @param client_profile Das Client-Profil für die Abfrage (z.B. "hafas:vbb", "vendo:db")
     * @returns             true bei Erfolg, sonst false.
     */
    public async getDepartures(
        stationId: string,
        service: any,
        options: Hafas.DeparturesArrivalsOptions = {},
        countEntries: number = 10,
        products?: Partial<Products>,
        client_profile?: string,
    ): Promise<boolean> {
        try {
            if (!stationId) {
                throw new Error('No stationId provided');
            }

            // Validiere Client und Profil
            this.validateClientProfile(client_profile);
            const mergedOptions = { ...defaultDepartureOpt, ...options };
            // Antwort vom Transport-Client als vollständiger Typ
            this.log.debug(
                `Querying departures for station ${stationId} with options: ${JSON.stringify(mergedOptions)}, client_profile: ${client_profile || 'kein Profil angegeben'}`,
            );
            const response = await service.getDepartures(stationId, mergedOptions);
            // Vollständiges JSON für Debugging
            if (this.adapter.config.logCompletelyJSON) {
                this.log.debug(JSON.stringify(response.departures, null, 1));
            }
            if (!response.departures || response.departures.length === 0) {
                this.log.info(
                    `No departures found for station ${stationId}, client_profile: ${client_profile || 'kein Profil angegeben'}`,
                );
            }
            // Schreibe die Abfahrten in die States
            await this.writeDepartureStates(stationId, response.departures, countEntries);
            return true;
        } catch (error) {
            this.log.error(`Error querying departures for station ${stationId}: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Filtert Abfahrten nach den gewählten Produkten.
     * Die API liefert Produktnamen in kebab-case (z.B. "regional-express"),
     * die Config-Keys sind camelCase (z.B. "regionalExpress") – daher wird
     * der API-Wert vor dem Vergleich normalisiert. Über Funktion kebabToCamel()
     * aus der library.ts wird die Normalisierung durchgeführt.
     *
     * @param departures    Die zu filternden Abfahrten
     * @param products      Die aktivierten Produkte (true = erlaubt)
     * @returns             Gefilterte Abfahrten
     */
    /* filterByProducts(departures: readonly Hafas.Alternative[], products: Partial<Products>): Hafas.Alternative[] {
        // Erstelle eine Liste der aktivierten Produktnamen (camelCase)
        const enabledProducts = Object.entries(products)
            .filter(([_, enabled]) => enabled === true)
            .map(([productName, _]) => productName);

        // Wenn keine Produkte aktiviert sind, gib alle zurück
        if (enabledProducts.length === 0) {
            return [...departures];
        }

        // Filtere Abfahrten: normalisiere API-Produktnamen von kebab-case zu camelCase
        return departures.filter(departure => {
            const lineProduct = departure.line?.product;
            if (!lineProduct) {
                this.log.info2(
                    `Departure ${departure.line?.name || 'unbekannt / unknown'} to ${departure.direction ?? 'unbekannt / unknown'} filtered: No product info available`,
                );
                return false;
            }
            const normalizedProduct = kebabToCamel(lineProduct);
            const isEnabled = enabledProducts.includes(normalizedProduct);
            if (!isEnabled) {
                this.log.info2(
                    `Departure ${departure.line?.name || 'unbekannt / unknown'} to ${departure.direction ?? 'unbekannt / unknown'} filtered: Product "${lineProduct}" (normalized: "${normalizedProduct}") not enabled`,
                );
            }
            return isEnabled;
        });
    }*/

    /**
     * Schreibt die Abfahrten in die States der angegebenen Station.
     *
     * @param stationId     Die ID der Station, für die die Abfahrten geschrieben werden sollen.
     * @param departures    Die Abfahrten, die geschrieben werden sollen.
     * @param countEntries  Die maximale Anzahl der Einträge, die geschrieben werden sollen.
     * /@param products      Die aktivierten Produkte (true = erlaubt)
     */
    async writeDepartureStates(
        stationId: string,
        departures: Hafas.Alternative[],
        countEntries: number,
        // products?: Partial<Products>,
    ): Promise<void> {
        try {
            if (!this.adapter.config.stationConfig) {
                return;
            }

            // Finde die Station-Konfiguration direkt (OHNE Schleife!)
            const stationConfig = this.adapter.config.stationConfig.find(
                station => station.enabled === true && station.id === stationId,
            );

            if (!stationConfig) {
                this.log.warn(`Station with ID ${stationId} not found or not enabled`);
                return;
            }

            // Erstelle Station
            await this.library.writedp(`${this.adapter.namespace}.Stations.${stationConfig.id}`, undefined, {
                _id: 'nicht_definieren',
                type: 'folder',
                common: {
                    name: stationConfig.customName || stationConfig.name || 'Station',
                    statusStates: {
                        onlineId: `${this.adapter.namespace}.Stations.${stationConfig.id}.enabled`,
                    },
                },
                native: {},
            });
            // JSON
            await this.library.writedp(
                `${this.adapter.namespace}.Stations.${stationConfig.id}.json`,
                JSON.stringify(departures),
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('raw_departure_data'),
                        type: 'string',
                        role: 'json',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
            );
            // Enabled State
            await this.library.writedp(
                `${this.adapter.namespace}.Stations.${stationConfig.id}.enabled`,
                stationConfig.enabled,
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('station_enabled'),
                        type: 'boolean',
                        role: 'indicator',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
            );
            // count Departures State
            await this.library.writedp(
                `${this.adapter.namespace}.Stations.${stationConfig.id}.countDepartures`,
                departures.length,
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('departure_count'),
                        type: 'number',
                        role: 'value',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
            );

            // Garbage Collection (nur einmal!)
            //await this.library.garbageColleting(`Stations.${stationConfig.id}.`);

            // Filtere nach Produkten, falls angegeben
            // const filteredDepartures = products ? this.filterByProducts(departures, products) : departures;
            // Konvertiere zu reduzierten States
            const departureStates: DepartureState[] = mapDeparturesToDepartureStates(departures);
            // JSON in die States schreiben
            await this.writeBaseStates(departureStates, stationId, countEntries, stationConfig.nspanel);
        } catch (err) {
            this.log.error(`Error writing departures: ${(err as Error).message}`);
        }
    }

    /**
     * schreibt die Abfahrts-States in die ioBroker States.
     *
     * @param response  Die Abfahrts-States, die geschrieben werden sollen.
     * @param stationId  Die ID der Station, für die die States geschrieben werden sollen.
     * @param countEntries  Die maximale Anzahl der Einträge, die geschrieben werden sollen.
     * @param nspanel  Ob der NSPanel-Channel angelegt werden soll.
     */
    async writeBaseStates(
        response: DepartureState[],
        stationId: string,
        countEntries: number,
        nspanel?: boolean,
    ): Promise<void> {
        for (const [index, obj] of response.entries()) {
            try {
                this.log.info2(`=== Starting object ${index + 1} of ${response.length} ===`);
                const departureIndex = `Departures_${`00${index}`.slice(-2)}`;
                const [delayed, onTime] = await this.library.getDelayStatus(obj.delay, this.delayOffset);
                // Erstelle Channel Departures_XX und darunter die States
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}`,
                    undefined,
                    {
                        _id: 'nicht_definieren',
                        type: 'channel',
                        common: {
                            name: departureIndex,
                        },
                        native: {},
                    },
                );
                // Departure
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Departure`,
                    obj.when,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_time'),
                            type: 'string',
                            role: 'date',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Planned Departure Time
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.DeparturePlanned`,
                    obj.plannedWhen,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_plannedTime'),
                            type: 'string',
                            role: 'date',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Delay in Seconds
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Delay`,
                    obj.delay || 0,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_delayInSeconds'),
                            type: 'number',
                            role: 'time',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Departure Delayed
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.DepartureDelayed`,
                    delayed,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_isDelayed'),
                            type: 'boolean',
                            role: 'indicator',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Departure On Time
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.DepartureOnTime`,
                    onTime,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_isOnTime'),
                            type: 'boolean',
                            role: 'indicator',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Platform
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Platform`,
                    obj.platform,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_platform'),
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Planned Platform
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.PlatformPlanned`,
                    obj.plannedPlatform,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_plannedPlatform'),
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Direction
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Direction`,
                    obj.direction,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_direction'),
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Line Name
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Name`,
                    obj.line?.name,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_lineName'),
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Line Product
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Product`,
                    obj.line?.product,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_lineProduct'),
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Line Operator
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Operator`,
                    obj.line?.operator,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_lineOperator'),
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Line Mode
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Mode`,
                    obj.line?.mode,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_lineMode'),
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Line ProductName
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.ProductName`,
                    obj.line?.productName,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_lineProductName'),
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Remarks Channel
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Remarks`,
                    undefined,
                    {
                        _id: 'nicht_definieren',
                        type: 'channel',
                        common: {
                            name: this.library.translate('departure_remark'),
                        },
                        native: {},
                    },
                );
                // Remark Hint
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Remarks.Hint`,
                    obj.remarks?.hint,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_remarkHint'),
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Remark Status
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Remarks.Status`,
                    obj.remarks?.status,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_remarkStatus'),
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Remark warning
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Remarks.Warning`,
                    obj.remarks?.warning,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_remarkWarning'),
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Stop Channel
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Stop`,
                    undefined,
                    {
                        _id: 'nicht_definieren',
                        type: 'channel',
                        common: {
                            name: this.library.translate('departure_stop'),
                        },
                        native: {},
                    },
                );
                // Stop Name
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Stop.Name`,
                    obj.stopinfo?.name,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_stopName'),
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Stop Id
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Stop.Id`,
                    obj.stopinfo?.id,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_stopId'),
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // Stop Type
                await this.library.writedp(
                    `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Stop.Type`,
                    obj.stopinfo?.type,
                    {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('departure_stopType'),
                            type: 'string',
                            role: 'text',
                            read: true,
                            write: false,
                        },
                        native: {},
                    },
                    true,
                );
                // NSPanel Timetable Channel
                if (nspanel) {
                    await this.nsPanelTimetable.writeDepartureNsPanel(
                        `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}`,
                        obj,
                    );
                }
                this.log.info2(`✓ Object ${index + 1} processed successfully`);
                if (index === countEntries - 1) {
                    this.log.debug(
                        `=== Maximum number of entries reached (${countEntries}), further departures will not be processed ===`,
                    );
                    break;
                }
            } catch (err) {
                this.log.error(`✗ Error processing object ${index + 1}: ${(err as Error).message}`);
                // Ohne throw: weiter zur nächsten Abfahrt ✅ (empfohlen)
                // Mit throw: alle weiteren Abfahrten werden NICHT verarbeitet ❌
            }
        }
    }
}

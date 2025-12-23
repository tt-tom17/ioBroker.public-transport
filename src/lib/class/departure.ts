import type * as Hafas from 'hafas-client';
import type { TTAdapter } from '../../main';
//import { genericStateObjects } from '../const/definition';
import { BaseClass } from '../tools/library';
import { mapDeparturesToDepartureStates } from '../tools/mapper';
import { defaultDepartureOpt, type DepartureState, type Products } from '../types/types';

export class DepartureRequest extends BaseClass {
    constructor(adapter: TTAdapter) {
        super(adapter);
        this.log.setLogPrefix('depReq');
    }
    /**
     *  Ruft Abfahrten für eine gegebene stationId ab und schreibt sie in die States.
     *
     * @param stationId     Die ID der Station, für die Abfahrten abgefragt werden sollen.
     * @param service      Der Service für die Abfrage.
     * @param options      Zusätzliche Optionen für die Abfrage.
     * @param products     Die aktivierten Produkte (true = erlaubt)
     * @returns             true bei Erfolg, sonst false.
     */
    public async getDepartures(
        stationId: string,
        service: any,
        options: Hafas.DeparturesArrivalsOptions = {},
        products?: Partial<Products>,
    ): Promise<boolean> {
        try {
            if (!stationId) {
                throw new Error(this.library.translate('msg_departureNoStationId'));
            }
            const mergedOptions = { ...defaultDepartureOpt, ...options };
            // Antwort vom Tranport-Client als vollständiger Typ
            const response = await service.getDepartures(stationId, mergedOptions);
            // Vollständiges JSON für Debugging
            //this.adapter.log.debug(JSON.stringify(response.departures, null, 1));
            // Schreibe die Abfahrten in die States
            await this.writeDepartureStates(stationId, response.departures, products);
            return true;
        } catch (error) {
            this.log.error(this.library.translate('msg_departureQueryError', stationId, (error as Error).message));
            return false;
        }
    }

    /**
     * Filtert Abfahrten nach den gewählten Produkten.
     * Es werden nur Abfahrten zurückgegeben, deren Produkt in den aktivierten Produkten enthalten ist.
     *
     * @param departures    Die zu filternden Abfahrten
     * @param products      Die aktivierten Produkte (true = erlaubt)
     * @returns             Gefilterte Abfahrten
     */
    filterByProducts(departures: readonly Hafas.Alternative[], products: Partial<Products>): Hafas.Alternative[] {
        // Erstelle eine Liste der aktivierten Produktnamen
        const enabledProducts = Object.entries(products)
            .filter(([_, enabled]) => enabled === true)
            .map(([productName, _]) => productName);

        // Wenn keine Produkte aktiviert sind, gib alle zurück
        if (enabledProducts.length === 0) {
            return [...departures];
        }

        // Filtere Abfahrten: behalte nur die, deren line.product in enabledProducts ist
        return departures.filter(departure => {
            const lineProduct = departure.line?.product;
            if (!lineProduct) {
                this.log.info2(
                    this.library.translate(
                        'msg_departureFilterNoProduct',
                        departure.line?.name || 'unbekannt / unknown',
                        departure.direction ?? 'unbekannt / unknown',
                    ),
                );
                return false;
            }
            const isEnabled = enabledProducts.includes(lineProduct);
            if (!isEnabled) {
                this.log.info2(
                    this.library.translate(
                        'msg_departureFilterProductDisabled',
                        departure.line?.name || 'unbekannt / unknown',
                        departure.direction ?? 'unbekannt / unknown',
                        lineProduct,
                    ),
                );
            }
            return isEnabled;
        });
    }

    /**
     * Schreibt die Abfahrten in die States der angegebenen Station.
     *
     * @param stationId     Die ID der Station, für die die Abfahrten geschrieben werden sollen.
     * @param departures    Die Abfahrten, die geschrieben werden sollen.
     * @param products      Die aktivierten Produkte (true = erlaubt)
     */
    async writeDepartureStates(
        stationId: string,
        departures: Hafas.Alternative[],
        products?: Partial<Products>,
    ): Promise<void> {
        try {
            if (this.adapter.config.stationConfig) {
                for (const departure of this.adapter.config.stationConfig) {
                    // Erstelle Station
                    await this.library.writedp(`${this.adapter.namespace}.Stations.${departure.id}`, undefined, {
                        _id: 'nicht_definieren',
                        type: 'folder',
                        common: {
                            name: departure.customName || departure.name || 'Station',
                            statusStates: { onlineId: `${this.adapter.namespace}.Stations.${departure.id}.enabled` },
                        },
                        native: {},
                    });
                    await this.library.writedp(
                        `${this.adapter.namespace}.Stations.${departure.id}.json`,
                        departure.enabled ? JSON.stringify(departures) : '',
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
                    await this.library.writedp(
                        `${this.adapter.namespace}.Stations.${departure.id}.enabled`,
                        departure.enabled,
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

                    // Vor dem Schreiben alte States löschen
                    await this.library.garbageColleting(`${this.adapter.namespace}.Stations.${departure.id}.`, 2000);
                    if (departure.enabled === true && departure.id === stationId) {
                        // Filtere nach Produkten, falls angegeben
                        const filteredDepartures = products ? this.filterByProducts(departures, products) : departures;
                        // Konvertiere zu reduzierten States
                        const departureStates: DepartureState[] = mapDeparturesToDepartureStates(filteredDepartures);
                        // JSON in die States schreiben
                        await this.writeBaseStates(departureStates, stationId);
                    }
                }
            }
        } catch (err) {
            this.log.error(this.library.translate('msg_departureWriteError', (err as Error).message));
        }
    }

    /**
     * schreibt die Abfahrts-States in die ioBroker States.
     *
     * @param response  Die Abfahrts-States, die geschrieben werden sollen.
     * @param stationId  Die ID der Station, für die die States geschrieben werden sollen.
     */
    async writeBaseStates(response: DepartureState[], stationId: string): Promise<void> {
        for (const [index, obj] of response.entries()) {
            try {
                this.log.info2(`=== Starte Objekt ${index + 1} von ${response.length} ===`);
                const departureIndex = `Departures_${`00${index}`.slice(-2)}`;
                let delayed = false,
                    onTime = false;
                if (obj.delay !== undefined && obj.delay >= 0) {
                    delayed = true;
                } else {
                    onTime = true;
                }
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
                this.log.info2(`✓ Objekt ${index + 1} erfolgreich verarbeitet`);
            } catch (err) {
                this.log.error(`✗ Fehler bei Objekt ${index + 1}:`, (err as Error).message);
                // Ohne throw: weiter zur nächsten Abfahrt ✅ (empfohlen)
                // Mit throw: alle weiteren Abfahrten werden NICHT verarbeitet ❌
            }
        }
    }
}

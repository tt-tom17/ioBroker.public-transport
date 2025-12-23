import type * as Hafas from 'hafas-client';
import type { TTAdapter } from '../../main';
import { StationRequest } from '../class/station';
import { BaseClass } from '../tools/library';
import { groupRemarksByType } from '../tools/mapper';
import { defaultJourneyOpt } from '../types/types';

export class JourneysRequest extends BaseClass {
    private station: StationRequest;
    private service: any;
    private delayOffset: number = this.adapter.config.delayOffset || 2;

    constructor(adapter: TTAdapter) {
        super(adapter);
        this.log.setLogPrefix('journeyReq');
        this.station = new StationRequest(adapter);
    }
    /**
     *  Ruft Abfahrten für eine gegebene stationId ab und schreibt sie in die States.
     *
     * @param journeyId     Die ID der Verbindung.
     * @param from          Die Startstation.
     * @param to            Die Zielstation.
     * @param service       Der Service für die Abfrage.
     * @param options       Zusätzliche Optionen für die Abfrage.
     * @returns             true bei Erfolg, sonst false.
     */
    public async getJourneys(
        journeyId: string,
        from: string,
        to: string,
        service: any,
        options: Hafas.JourneysOptions = {},
    ): Promise<boolean> {
        try {
            if (!from || !to) {
                throw new Error(this.library.translate('msg_journeyNoFromTo'));
            }
            this.service = service;
            // Zusammenführen der Standardoptionen mit den übergebenen Optionen
            const mergedOptions = { ...defaultJourneyOpt, ...options };
            // Antwort von HAFAS als vollständiger Typ
            const response: Hafas.Journeys = await this.service.getJourneys(from, to, mergedOptions);
            // Vollständiges JSON für Debugging
            this.adapter.log.debug(JSON.stringify(response, null, 1));
            // Schreibe die Verbindungen in die States
            await this.writeJourneysStates(journeyId, response);
            return true;
        } catch (error) {
            this.log.error(this.library.translate('msg_journeyQueryError', from, to, (error as Error).message));
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
    /* filterByProducts(departures: readonly Hafas.Alternative[], products: Partial<Products>): Hafas.Alternative[] {
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
                    `Abfahrt ${departure.line?.name || 'unbekannt'} Richtung ${departure.direction} gefiltert: Keine Produktinfo vorhanden`,
                );
                return false;
            }
            const isEnabled = enabledProducts.includes(lineProduct);
            if (!isEnabled) {
                this.log.info2(
                    `Abfahrt ${departure.line?.name} Richtung ${departure.direction} gefiltert: Produkt "${lineProduct}" nicht aktiviert`,
                );
            }
            return isEnabled;
        });
    } */

    /**
     * Schreibt die Verbindungen in die States.
     *
     * @param journeyId     Die ID der Verbindung, für die die Teilstrecken/Legs geschrieben werden sollen.
     * @param journeys      Die Verbindungen, die geschrieben werden sollen.
     */
    async writeJourneysStates(journeyId: string, journeys: Hafas.Journeys): Promise<void> {
        try {
            if (this.adapter.config.journeyConfig) {
                for (const journey of this.adapter.config.journeyConfig) {
                    // Erstelle Verbindungs-Ordner, falls nicht vorhanden
                    await this.library.writedp(`${this.adapter.namespace}.Journeys.${journey.id}`, undefined, {
                        _id: 'nicht_definieren',
                        type: 'folder',
                        common: {
                            name: journey.customName,
                            statusStates: { onlineId: `${this.adapter.namespace}.Journeys.${journey.id}.enabled` },
                        },
                        native: {},
                    });
                    // Schreibe, ob die Verbindung aktiviert ist
                    await this.library.writedp(
                        `${this.adapter.namespace}.Journeys.${journey.id}.enabled`,
                        journey.enabled,
                        {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_enabled'),
                                type: 'boolean',
                                role: 'indicator',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                    );
                    // Vor dem Schreiben alte States löschen
                    await this.library.garbageColleting(`${this.adapter.namespace}.Routes.${journeyId}.`, 2000);
                    // JSON in die States schreiben
                    if (journey.enabled === true && journey.id === journeyId) {
                        // Filtere nach Produkten, falls angegeben
                        //const filteredDepartures = products ? this.filterByProducts(departures, products) : departures;

                        await this.writesBaseStates(`${this.adapter.namespace}.Journeys.${journeyId}`, journeys);
                    }
                }
            }
        } catch (err) {
            this.log.error(this.library.translate('msg_journeyWriteError', (err as Error).message));
        }
    }

    /**
     * schreibt die Basis-States der Verbindungen.
     *
     * @param basePath Basis-Pfad für die States
     * @param journeys Verbindungsdaten als Array von Hafas.Journeys
     */
    async writesBaseStates(basePath: string, journeys: Hafas.Journeys): Promise<void> {
        try {
            // Rohdaten der Verbindungen
            await this.library.writedp(`${basePath}.json`, JSON.stringify(journeys), {
                _id: 'nicht_definieren',
                type: 'state',
                common: {
                    name: this.library.translate('raw_journeys_data'),
                    type: 'string',
                    role: 'json',
                    read: true,
                    write: false,
                },
                native: {},
            });
            // Station From/To ermitteln und schreiben
            const stationFromId = journeys?.journeys?.[0].legs[0].origin?.id || undefined;
            const stationToId =
                journeys?.journeys?.[0].legs[journeys.journeys[0].legs.length - 1].destination?.id || undefined;
            if (stationFromId !== undefined && stationToId !== undefined) {
                const stationFrom = await this.station.getStation(stationFromId, this.service);
                const stationTo = await this.station.getStation(stationToId, this.service);
                await this.station.writeStationData(`${basePath}.StationFrom`, stationFrom);
                await this.station.writeStationData(`${basePath}.StationTo`, stationTo);
            }
            // Verbindungen
            await this.writeJourneyStates(basePath, journeys);
        } catch (err) {
            this.log.error(this.library.translate('msg_journeyBaseStateWriteError', (err as Error).message));
        }
    }
    /**
     * schreibt die Verbindung in die States.
     *
     * @param basePath Basis-Pfad für die States
     * @param journeys Verbindungsdaten als Array von Hafas.Journeys
     */
    async writeJourneyStates(basePath: string, journeys: Hafas.Journeys): Promise<void> {
        try {
            if (Array.isArray(journeys.journeys) && journeys.journeys.length > 0) {
                for (const [index, journey] of journeys.journeys.entries()) {
                    const journeyPath = `${basePath}.Journey_${`00${index}`.slice(-2)}`;
                    const [arrivalDelayed, arrivalOnTime] = this.getDelayStatus(
                        journey.legs[journey.legs.length - 1].arrivalDelay,
                        this.delayOffset,
                    );
                    const [departureDelayed, departureOnTime] = this.getDelayStatus(
                        journey.legs[0].departureDelay,
                        this.delayOffset,
                    );
                    const changes = journey.legs.filter((leg: { walking: boolean }) => leg.walking === true).length;
                    const durationMinutes = Math.round(
                        (new Date(journey.legs[journey.legs.length - 1].arrival).getTime() -
                            new Date(journey.legs[0].departure).getTime()) /
                            60_000,
                    );
                    // Channel
                    await this.library.writedp(`${journeyPath}`, undefined, {
                        _id: 'nicht_definieren',
                        type: 'channel',
                        common: {
                            name: this.library.translate('journey', index + 1),
                        },
                        native: {},
                    });
                    // Rohdaten der Verbindung
                    await this.library.writedp(`${journeyPath}.json`, JSON.stringify(journey), {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('raw_journey_data', index + 1),
                            type: 'string',
                            role: 'json',
                            read: true,
                            write: false,
                        },
                        native: {},
                    });
                    // Arrival
                    await this.library.writedp(
                        `${journeyPath}.Arrival`,
                        journey.legs[journey.legs.length - 1].arrival,
                        {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_arrival'),
                                type: 'string',
                                role: 'date',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                    );
                    // Arrival Planned
                    await this.library.writedp(
                        `${journeyPath}.ArrivalPlanned`,
                        journey.legs[journey.legs.length - 1].plannedArrival,
                        {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_arrival_planned'),
                                type: 'string',
                                role: 'date',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                    );
                    // Arrival Delay
                    await this.library.writedp(
                        `${journeyPath}.ArrivalDelay`,
                        journey.legs[journey.legs.length - 1].arrivalDelay,
                        {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_arrival_delay'),
                                type: 'number',
                                role: 'value',
                                read: true,
                                write: false,
                            },
                            native: {},
                        },
                    );
                    // Arrival Delayed
                    await this.library.writedp(`${journeyPath}.ArrivalDelayed`, arrivalDelayed, {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('journey_arrival_delayed'),
                            type: 'boolean',
                            role: 'indicator',
                            read: true,
                            write: false,
                        },
                        native: {},
                    });
                    // Arrival On Time
                    await this.library.writedp(`${journeyPath}.ArrivalOnTime`, arrivalOnTime, {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('journey_arrival_on_time'),
                            type: 'boolean',
                            role: 'indicator',
                            read: true,
                            write: false,
                        },
                        native: {},
                    });
                    // Departure
                    await this.library.writedp(`${journeyPath}.Departure`, journey.legs[0].departure, {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('journey_departure'),
                            type: 'string',
                            role: 'date',
                            read: true,
                            write: false,
                        },
                        native: {},
                    });
                    // Departure Planned
                    await this.library.writedp(`${journeyPath}.DeparturePlanned`, journey.legs[0].plannedDeparture, {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('journey_departure_planned'),
                            type: 'string',
                            role: 'date',
                            read: true,
                            write: false,
                        },
                        native: {},
                    });
                    // Departure Delay
                    await this.library.writedp(`${journeyPath}.DepartureDelay`, journey.legs[0].departureDelay, {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('journey_departure_delay'),
                            type: 'number',
                            role: 'value',
                            read: true,
                            write: false,
                        },
                        native: {},
                    });
                    // Departure Delayed
                    await this.library.writedp(`${journeyPath}.DepartureDelayed`, departureDelayed, {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('journey_departure_delayed'),
                            type: 'boolean',
                            role: 'indicator',
                            read: true,
                            write: false,
                        },
                        native: {},
                    });
                    // Departure On Time
                    await this.library.writedp(`${journeyPath}.DepartureOnTime`, departureOnTime, {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('journey_departure_on_time'),
                            type: 'boolean',
                            role: 'indicator',
                            read: true,
                            write: false,
                        },
                        native: {},
                    });
                    // Changes
                    await this.library.writedp(`${journeyPath}.Changes`, changes, {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('journey_changes'),
                            type: 'number',
                            role: 'value',
                            read: true,
                            write: false,
                        },
                        native: {},
                    });
                    // Duration Minutes
                    await this.library.writedp(`${journeyPath}.DurationMinutes`, durationMinutes, {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('journey_duration_minutes'),
                            type: 'number',
                            role: 'value',
                            read: true,
                            write: false,
                        },
                        native: {},
                    });
                    // Teilstrecken/Legs der Verbindung
                    await this.writeLegStates(journeyPath, journey.legs);
                }
            }
        } catch (err) {
            this.log.error(this.library.translate('msg_journeyStateWriteError ', (err as Error).message));
        }
    }

    /**
     * schreibt die Teilstrecken/Legs der Verbindung in die States.
     *
     * @param basePath Basis-Pfad für die States
     * @param legs     Teilstrecken/Legs der Verbindung
     */
    async writeLegStates(basePath: string, legs: Hafas.Leg[]): Promise<void> {
        try {
            if (Array.isArray(legs) && legs.length > 0) {
                for (const [index, leg] of legs.entries()) {
                    const legPath = `${basePath}.Leg_${`00${index}`.slice(-2)}`;
                    const description =
                        leg.walking === true
                            ? this.library.translate('journey_walking')
                            : this.library.translate('journey_leg');
                    const stationFrom = leg.origin?.name || this.library.translate('unknown_station');
                    const stationTo = leg.destination?.name || this.library.translate('unknown_station');
                    const name = leg.walking
                        ? this.library.translate(`journey_change`, stationFrom)
                        : this.library.translate(`journey_leg_FromTo`, stationFrom, stationTo);
                    const [arrivalDelayed, arrivalOnTime] = this.getDelayStatus(leg.arrivalDelay, 0);
                    const [departureDelayed, departureOnTime] = this.getDelayStatus(leg.departureDelay, 0);
                    const { hint, warning, status } = groupRemarksByType(leg.remarks || []);
                    // Channel
                    await this.library.writedp(`${legPath}`, undefined, {
                        _id: 'nicht_definieren',
                        type: 'channel',
                        common: {
                            name: name,
                            desc: description,
                        },
                        native: {},
                    });
                    // Rohdaten der Teilstrecke
                    await this.library.writedp(`${legPath}.json`, JSON.stringify(leg), {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('raw_journey_leg_data', index + 1),
                            type: 'string',
                            role: 'json',
                            read: true,
                            write: false,
                        },
                        native: {},
                    });
                    // Schreibe Stationsdaten Startstation
                    await this.writeStationLegData(legPath, leg, true);
                    if (leg.walking !== true) {
                        // Schreibe Stationsdaten Zielstation
                        await this.writeStationLegData(legPath, leg, false);
                        // Schreibe Linieninformationen, falls vorhanden
                        await this.writeLineLegData(legPath, leg);
                        // Arrival
                        await this.library.writedp(`${legPath}.Arrival`, leg.arrival, {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_arrival'),
                                type: 'string',
                                role: 'date',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                        // Arrival Planned
                        await this.library.writedp(`${legPath}.ArrivalPlanned`, leg.plannedArrival, {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_arrival_planned'),
                                type: 'string',
                                role: 'date',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                        // Arrival Delay
                        await this.library.writedp(`${legPath}.ArrivalDelay`, leg.arrivalDelay, {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_arrival_delay'),
                                type: 'number',
                                role: 'value',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                        // Arrival Delayed
                        await this.library.writedp(`${legPath}.ArrivalDelayed`, arrivalDelayed, {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_arrival_delayed'),
                                type: 'boolean',
                                role: 'indicator',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                        // Arrival On Time
                        await this.library.writedp(`${legPath}.ArrivalOnTime`, arrivalOnTime, {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_arrival_on_time'),
                                type: 'boolean',
                                role: 'indicator',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                        // Departure
                        await this.library.writedp(`${legPath}.Departure`, leg.departure, {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_departure'),
                                type: 'string',
                                role: 'date',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                        // Departure Planned
                        await this.library.writedp(`${legPath}.DeparturePlanned`, leg.plannedDeparture, {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_departure_planned'),
                                type: 'string',
                                role: 'date',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                        // Departure Delay
                        await this.library.writedp(`${legPath}.DepartureDelay`, leg.departureDelay, {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_departure_delay'),
                                type: 'number',
                                role: 'value',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                        // Departure Delayed
                        await this.library.writedp(`${legPath}.DepartureDelayed`, departureDelayed, {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_departure_delayed'),
                                type: 'boolean',
                                role: 'indicator',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                        // Departure On Time
                        await this.library.writedp(`${legPath}.DepartureOnTime`, departureOnTime, {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_departure_on_time'),
                                type: 'boolean',
                                role: 'indicator',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                        // Reachable / erreichbar
                        await this.library.writedp(`${legPath}.Reachable`, leg.reachable, {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_reachable'),
                                type: 'boolean',
                                role: 'indicator',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                        // Remarks / Hinweise
                        await this.library.writedp(`${legPath}.Remarks`, undefined, {
                            _id: 'nicht_definieren',
                            type: 'channel',
                            common: {
                                name: this.library.translate('journey_remarks'),
                                desc: this.library.translate('journey_remarks_info'),
                            },
                            native: {},
                        });
                        // Hints
                        await this.library.writedp(`${legPath}.Remarks.Hints`, hint, {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_remarks_hints'),
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                        // Warnings
                        await this.library.writedp(`${legPath}.Remarks.Warnings`, warning, {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_remarks_warnings'),
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                        // Status
                        await this.library.writedp(`${legPath}.Remarks.Status`, status, {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_remarks_status'),
                                type: 'string',
                                role: 'text',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                    } else {
                        // Bei Fußwegen keine Ankunfts-/Abfahrtsdaten schreiben
                        // Walking Distance
                        await this.library.writedp(`${legPath}.Distance`, leg.distance, {
                            _id: 'nicht_definieren',
                            type: 'state',
                            common: {
                                name: this.library.translate('journey_distance_meters'),
                                type: 'number',
                                role: 'value',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                    }
                }
            }
        } catch (err) {
            this.log.error(this.library.translate('msg_journeyLegStateWriteError', (err as Error).message));
        }
    }

    /**
     * Schreibt die Daten einer Station in die States.
     *
     * @param legPath   Basis-Pfad für die States der Teilstrecke
     * @param leg       Die Teilstrecke/Leg, aus der die Stationsdaten entnommen werden
     * @param from      true = Startstation, false = Zielstation
     */
    private async writeStationLegData(legPath: string, leg: Hafas.Leg, from: boolean): Promise<void> {
        try {
            const stationFrom = leg.origin?.name || this.library.translate('unknown_station');
            const stationTo = leg.destination?.name || this.library.translate('unknown_station');
            const Path = `${legPath}.${from ? 'StationFrom' : 'StationTo'}`;
            // Channel
            await this.library.writedp(Path, undefined, {
                _id: 'nicht_definieren',
                type: 'channel',
                common: {
                    name: from ? stationFrom : stationTo,
                    desc: this.library.translate(from ? 'from_station' : 'to_station'),
                },
                native: {},
            });
            // Rohdaten der Station
            await this.library.writedp(`${Path}.JSON`, JSON.stringify(from ? leg.origin : leg.destination), {
                _id: 'nicht_definieren',
                type: 'state',
                common: {
                    name: this.library.translate('raw_station_data'),
                    type: 'string',
                    role: 'json',
                    read: true,
                    write: false,
                },
                native: {},
            });
            // Schreibe Namen der Station
            await this.library.writedp(`${Path}.Name`, from ? stationFrom : stationTo, {
                _id: 'nicht_definieren',
                type: 'state',
                common: {
                    name: this.library.translate('station_name'),
                    type: 'string',
                    role: 'info.name',
                    read: true,
                    write: false,
                },
                native: {},
            });
            // Schriebe Type der Station
            await this.library.writedp(`${Path}.Type`, from ? leg.origin?.type : leg.destination?.type, {
                _id: 'nicht_definieren',
                type: 'state',
                common: {
                    name: this.library.translate('station_type'),
                    type: 'string',
                    role: 'info.type',
                    read: true,
                    write: false,
                },
                native: {},
            });
            // Schreibe ID der Station
            await this.library.writedp(`${Path}.ID`, from ? leg.origin?.id : leg.destination?.id, {
                _id: 'nicht_definieren',
                type: 'state',
                common: {
                    name: this.library.translate('station_id'),
                    type: 'string',
                    role: 'info.id',
                    read: true,
                    write: false,
                },
                native: {},
            });
            // Schreibe Platform der Station
            await this.library.writedp(`${Path}.Platform`, from ? leg.departurePlatform : leg.arrivalPlatform, {
                _id: 'nicht_definieren',
                type: 'state',
                common: {
                    name: this.library.translate('station_platform'),
                    type: 'string',
                    role: 'text',
                    read: true,
                    write: false,
                },
                native: {},
            });
            // Schreibe Planned Platform der Station
            await this.library.writedp(
                `${Path}.PlatformPlanned`,
                from ? leg.plannedDeparturePlatform : leg.plannedArrivalPlatform,
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('station_platform_planned'),
                        type: 'string',
                        role: 'text',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
            );
        } catch (err) {
            this.log.error(this.library.translate('msg_journeyLegStationWriteError', (err as Error).message));
        }
    }

    /**
     * Schreibt die Linieninformationen einer Teilstrecke in die States.
     *
     * @param legPath   Basis-Pfad für die States der Teilstrecke
     * @param leg       Die Teilstrecke/Leg, aus der die Linieninformationen entnommen werden
     */
    private async writeLineLegData(legPath: string, leg: Hafas.Leg): Promise<void> {
        try {
            if (leg.line) {
                // Channel
                const linePath = `${legPath}.Line`;
                await this.library.writedp(linePath, undefined, {
                    _id: 'nicht_definieren',
                    type: 'channel',
                    common: {
                        name: leg.line.name || this.library.translate('unknown_line'),
                        desc: this.library.translate('journey_line_info'),
                    },
                    native: {},
                });
                // direction
                await this.library.writedp(`${linePath}.Direction`, leg.direction, {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('journey_direction'),
                        type: 'string',
                        role: 'text',
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                // product
                await this.library.writedp(`${linePath}.Product`, leg.line.product, {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('journey_product'),
                        type: 'string',
                        role: 'text',
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                // Mode
                await this.library.writedp(`${linePath}.Mode`, leg.line.mode, {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('journey_mode'),
                        type: 'string',
                        role: 'text',
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                // Name
                await this.library.writedp(`${linePath}.Name`, leg.line.name, {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('journey_name'),
                        type: 'string',
                        role: 'text',
                        read: true,
                        write: false,
                    },
                    native: {},
                });
                // Operator
                await this.library.writedp(`${linePath}.Operator`, leg.line.operator?.name, {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('journey_operator'),
                        type: 'string',
                        role: 'text',
                        read: true,
                        write: false,
                    },
                    native: {},
                });
            }
        } catch (err) {
            this.log.error(this.library.translate('msg_journeyLegLineWriteError', (err as Error).message));
        }
    }

    /**
     * Prüft den Verspätungsstatus.
     *
     * @param Delay Verspätung in Sekunden (null = keine Daten, undefined = keine Verspätung)
     * @param offSet Zeitoffset in minuten
     * @returns [delayed, onTime] - delayed=true wenn verspätet, onTime=true wenn pünktlich
     */
    private getDelayStatus(Delay: number | null | undefined, offSet: number): [boolean, boolean] {
        if (Delay === null || Delay === undefined) {
            return [false, false]; // Keine Daten verfügbar
        }
        const delayed = Delay - offSet * 60 > 0;
        const onTime = Delay - offSet * 60 <= 0;
        return [delayed, onTime];
    }
}

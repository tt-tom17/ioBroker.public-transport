import type * as Hafas from 'hafas-client';
import type { PublicTransport } from '../../main';
import { StationRequest } from '../class/station';
import { BaseClass } from '../tools/library';
import { groupRemarksByType } from '../tools/mapper';
import { defaultJourneyOpt, type Products } from '../types/types';
import { NsPanelTimetable } from './nsPanelTimetable';

export class JourneysRequest extends BaseClass {
    private station: StationRequest;
    private service: any;
    private delayOffset: number = this.adapter.config.delayOffset || 2;
    private nsPanelTimetable: NsPanelTimetable;

    constructor(adapter: PublicTransport) {
        super(adapter);
        this.log.setLogPrefix('journeyReq');
        this.station = new StationRequest(adapter);
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
     * @param journeyId     Die ID der Verbindung.
     * @param from          Die Startstation.
     * @param to            Die Zielstation.
     * @param service       Der Service für die Abfrage.
     * @param options       Zusätzliche Optionen für die Abfrage.
     * @param countEntries  Die maximale Anzahl der Verbindungen, die geschrieben werden sollen.
     * @param products      Die aktivierten Produkte (true = erlaubt)
     * @param client_profile Das Client-Profil für die Abfrage (z.B. "hafas:vbb", "vendo:db")
     * @returns             true bei Erfolg, sonst false.
     */
    public async getJourneys(
        journeyId: string,
        from: string,
        to: string,
        service: any,
        options: Hafas.JourneysOptions = {},
        countEntries: number = 5,
        products?: Partial<Products>,
        client_profile?: string,
    ): Promise<boolean> {
        try {
            if (!from || !to) {
                throw new Error('No start or destination station provided');
            }

            // Validiere Client und Profil
            this.validateClientProfile(client_profile);

            this.service = service;
            // Zusammenführen der Standardoptionen mit den übergebenen Optionen
            const mergedOptions = { ...defaultJourneyOpt, ...options };
            // Antwort von HAFAS als vollständiger Typ
            const response: Hafas.Journeys = await this.service.getJourneys(from, to, mergedOptions);
            // Vollständiges JSON für Debugging
            if (this.adapter.config.logCompletelyJSON) {
                this.log.debug(JSON.stringify(response, null, 1));
            }
            if (!response.journeys || response.journeys.length === 0) {
                this.log.info(
                    `No journeys found from station ${from} to ${to}, client_profile: ${client_profile || 'kein Profil angegeben'}`,
                );
            }
            // Schreibe die Verbindungen in die States
            await this.writeJourneysStates(journeyId, response, countEntries, client_profile);
            return true;
        } catch (error) {
            this.log.error(`Error querying journeys from station ${from} to ${to}: ${(error as Error).message}`);
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
     * @param countEntries  Die maximale Anzahl der Verbindungen, die geschrieben werden sollen.
     * @param client_profile Das Client-Profil für die Abfrage (z.B. "hafas:vbb", "vendo:db")
     */
    async writeJourneysStates(
        journeyId: string,
        journeys: Hafas.Journeys,
        countEntries: number,
        client_profile?: string,
    ): Promise<void> {
        try {
            if (!this.adapter.config.journeyConfig) {
                return;
            }

            // Finde die Journey-Konfiguration direkt anhand der journeyId
            const journeyConfig = this.adapter.config.journeyConfig.find(j => j.enabled === true && j.id === journeyId);

            if (!journeyConfig) {
                this.log.warn(`Journey with ID ${journeyId} not found or not enabled`);
                return;
            }

            // Erstelle Verbindungs-Ordner
            await this.library.writedp(`${this.adapter.namespace}.Journeys.${journeyConfig.id}`, undefined, {
                _id: 'nicht_definieren',
                type: 'folder',
                common: {
                    name: journeyConfig.customName,
                    statusStates: { onlineId: `${this.adapter.namespace}.Journeys.${journeyConfig.id}.enabled` },
                },
                native: {},
            });

            // Schreibe enabled-State
            await this.library.writedp(
                `${this.adapter.namespace}.Journeys.${journeyConfig.id}.enabled`,
                journeyConfig.enabled,
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

            // Count Journey State
            await this.library.writedp(
                `${this.adapter.namespace}.Journeys.${journeyConfig.id}.countJourneys`,
                journeys.journeys?.length,
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('journey_count'),
                        type: 'number',
                        role: 'value',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
            );

            // Garbage Collection (nur einmal!)
            //await this.library.garbageColleting(`${this.adapter.namespace}.Routes.${journeyId}.`);

            // Schreibe die Journey-Daten
            await this.writesBaseStates(
                `${this.adapter.namespace}.Journeys.${journeyId}`,
                journeys,
                countEntries,
                client_profile,
                journeyConfig.nspanel,
            );
        } catch (err) {
            this.log.error(`Error writing journeys. Error message: ${(err as Error).message}`);
        }
    }

    /**
     * schreibt die Basis-States der Verbindungen.
     *
     * @param basePath Basis-Pfad für die States
     * @param journeys Verbindungsdaten als Array von Hafas.Journeys
     * @param countEntries Anzahl der definierten Verbindungen
     * @param client_profile Das Client-Profil für die Abfrage (z.B. "hafas:vbb", "vendo:db")
     * @param nspanel Ob der NSPanel-Channel angelegt werden soll.
     */
    async writesBaseStates(
        basePath: string,
        journeys: Hafas.Journeys,
        countEntries: number,
        client_profile?: string,
        nspanel?: boolean,
    ): Promise<void> {
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
                const stationFrom = await this.station.getStation(
                    stationFromId,
                    this.service,
                    undefined,
                    client_profile,
                );
                const stationTo = await this.station.getStation(stationToId, this.service, undefined, client_profile);
                await this.station.writeStationData(`${basePath}.StationFrom`, stationFrom);
                await this.station.writeStationData(`${basePath}.StationTo`, stationTo);
            }
            // Verbindungen
            await this.writeJourneyStates(basePath, journeys, countEntries, nspanel);
        } catch (err) {
            this.log.error(this.library.translate('msg_journeyBaseStateWriteError', (err as Error).message));
        }
    }
    /**
     * schreibt die Verbindung in die States.
     *
     * @param basePath Basis-Pfad für die States
     * @param journeys Verbindungsdaten als Array von Hafas.Journeys
     * @param countEntries Anzahl der definierten Verbindungen
     * @param nspanel Ob der NSPanel-Channel angelegt werden soll.
     */
    async writeJourneyStates(
        basePath: string,
        journeys: Hafas.Journeys,
        countEntries: number,
        nspanel?: boolean,
    ): Promise<void> {
        try {
            if (Array.isArray(journeys.journeys) && journeys.journeys.length > 0) {
                for (const [index, journey] of journeys.journeys.entries()) {
                    this.log.info2(`=== Starting object ${index + 1} of ${journeys.journeys.length} ===`);
                    const journeyPath = `${basePath}.Journey_${`00${index}`.slice(-2)}`;
                    const [arrivalDelayed, arrivalOnTime] = await this.library.getDelayStatus(
                        journey.legs[journey.legs.length - 1].arrivalDelay,
                        this.delayOffset,
                    );
                    const [departureDelayed, departureOnTime] = await this.library.getDelayStatus(
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
                            name: this.library.translate('journey'),
                        },
                        native: {},
                    });
                    // Rohdaten der Verbindung
                    await this.library.writedp(`${journeyPath}.json`, JSON.stringify(journey), {
                        _id: 'nicht_definieren',
                        type: 'state',
                        common: {
                            name: this.library.translate('raw_journey_data'),
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
                                role: 'time',
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
                            role: 'time',
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
                    // NSPanel Timetable Channel
                    if (nspanel) {
                        await this.nsPanelTimetable.writeJourneyNsPanel(journeyPath, journey);
                    }
                    this.log.info2(`✓ Object ${index + 1} processed successfully`);
                    if (index === countEntries - 1) {
                        this.log.debug(
                            `=== Maximum number of journeys reached (${countEntries}), further journeys will not be processed ===`,
                        );
                        break; // Schleife verlassen, wenn die gewünschte Anzahl an Verbindungen erreicht ist
                    }
                }
            }
        } catch (err) {
            this.log.error(`Error writing journey states. Error message: ${(err as Error).message}`);
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
                    const stationFrom = leg.origin?.name || 'unknown_station';
                    const stationTo = leg.destination?.name || 'unknown_station';
                    const name = leg.walking
                        ? this.library.translate('journey_change')
                        : this.library.translate('journey_leg_FromTo', stationFrom, stationTo);
                    const [arrivalDelayed, arrivalOnTime] = await this.library.getDelayStatus(leg.arrivalDelay, 0);
                    const [departureDelayed, departureOnTime] = await this.library.getDelayStatus(
                        leg.departureDelay,
                        0,
                    );
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
                                role: 'time',
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
                                role: 'time',
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
                                role: 'value.distance',
                                read: true,
                                write: false,
                            },
                            native: {},
                        });
                    }
                }
            }
        } catch (err) {
            this.log.error(`Error writing leg states of the journey. Error message: ${(err as Error).message}`);
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
                    role: 'text',
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
                    role: 'text',
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
                    role: 'value',
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
            this.log.error(`Error writing station states of the leg. Error message: ${(err as Error).message}`);
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
                //  ProductName
                await this.library.writedp(`${linePath}.ProductName`, leg.line.productName, {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('journey_product_name'),
                        type: 'string',
                        role: 'text',
                        read: true,
                        write: false,
                    },
                    native: {},
                });
            }
        } catch (err) {
            this.log.error(`Error writing line states of the leg. Error message: ${(err as Error).message}`);
        }
    }
}

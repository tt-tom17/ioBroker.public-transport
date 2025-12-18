import type * as Hafas from 'hafas-client';
import type { TTAdapter } from '../../main';
import { StationRequest } from '../class/station';
import { BaseClass } from '../tools/library';
import { defaultJourneyOpt } from '../types/types';

export class JourneysRequest extends BaseClass {
    private station: StationRequest;
    private service: any;

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
            this.log.error(this.library.translate('msg_journeyQueryError ', from, to, (error as Error).message));
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
            // Station From/To journeys.journeys[0].legs[0].origin.id
            const stationFromId = journeys?.journeys?.[0].legs[0].origin?.id || undefined;
            const stationToId =
                journeys?.journeys?.[0].legs[journeys.journeys[0].legs.length - 1].destination?.id || undefined;
            if (stationFromId !== undefined && stationToId !== undefined) {
                const stationFrom = await this.station.getStation(stationFromId, this.service);
                const stationTo = await this.station.getStation(stationToId, this.service);
                await this.station.writeStationData(`${basePath}.StationFrom`, stationFrom);
                await this.station.writeStationData(`${basePath}.StationTo`, stationTo);
            }

            /* await this.library.writedp(`${basePath}.StationFrom`, stationFrom.name, {
                _id: 'nicht_definieren',
                type: 'state',
                common: {
                    name: this.library.translate('journey_fromStation'),
                    type: 'string',
                    role: 'info.name',
                    read: true,
                    write: false,
                },
                native: {},
            });
            await this.library.writedp(`${basePath}.StationTo`, stationTo.name, {
                _id: 'nicht_definieren',
                type: 'state',
                common: {
                    name: this.library.translate('journey_toStation'),
                    type: 'string',
                    role: 'info.name',
                    read: true,
                    write: false,
                },
                native: {},
            }); */
        } catch (err) {
            this.log.error(this.library.translate('msg_journeyStateWriteError ', (err as Error).message));
        }
    }
}

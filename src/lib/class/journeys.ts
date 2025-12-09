import type * as Hafas from 'hafas-client';
import type { TTAdapter } from '../../main';
import { BaseClass } from '../tools/library';
import { defaultJourneyOpt } from '../types/types';

export class JourneysRequest extends BaseClass {
    constructor(adapter: TTAdapter) {
        super(adapter);
        this.log.setLogPrefix('routeReq');
    }
    /**
     *  Ruft Abfahrten für eine gegebene stationId ab und schreibt sie in die States.
     *
     * @param from     Die Startstation.
     * @param to       Die Zielstation.
     * @param service      Der Service für die Abfrage.
     * @param options      Zusätzliche Optionen für die Abfrage.
     * @returns             true bei Erfolg, sonst false.
     */
    public async getJourneys(
        from: string,
        to: string,
        service: any,
        options: Hafas.JourneysOptions = {},
    ): Promise<boolean> {
        try {
            if (!from || !to) {
                throw new Error('Keine Start- oder Zielstation übergeben');
            }
            const mergedOptions = { ...defaultJourneyOpt, ...options };
            // Antwort von HAFAS als vollständiger Typ
            const response = await service.getJourneys(from, to, mergedOptions);
            // Vollständiges JSON für Debugging
            this.adapter.log.debug(JSON.stringify(response, null, 1));
            // Schreibe die Verbindungen in die States
            //await this.writeJourneysStates(stationId, response.departures, products);
            return true;
        } catch (error) {
            this.log.error(
                `Fehler bei der Abfrage der Abfahrten für Station ${from} nach ${to}: ${(error as Error).message}`,
            );
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
     * Schreibt die Abfahrten in die States der angegebenen Station.
     *
     * @param stationId     Die ID der Station, für die die Abfahrten geschrieben werden sollen.
     * @param departures    Die Abfahrten, die geschrieben werden sollen.
     * @param products      Die aktivierten Produkte (true = erlaubt)
     */
    /* async writeJourneyStates(
        stationId: string,
        departures: Hafas.Alternative[],
        products?: Partial<Products>,
    ): Promise<void> {
        try {
            if (this.adapter.config.departures) {
                for (const departure of this.adapter.config.departures) {
                    if (departure.id === stationId && departure.enabled === true) {
                        // Erstelle Station
                        await this.library.writedp(`${this.adapter.namespace}.Stations.${stationId}`, undefined, {
                            _id: 'nicht_definieren',
                            type: 'folder',
                            common: {
                                name: departures[0]?.stop?.name || 'Station',
                            },
                            native: {},
                        });
                    }
                }
            }
            await this.library.writedp(
                `${this.adapter.namespace}.Stations.${stationId}.json`,
                JSON.stringify(departures),
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: 'raw departures data',
                        type: 'string',
                        role: 'json',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
            );
            // Filtere nach Produkten, falls angegeben
            const filteredDepartures = products ? this.filterByProducts(departures, products) : departures;
            // Konvertiere zu reduzierten States
            const departureStates: DepartureState[] = mapDeparturesToDepartureStates(filteredDepartures);
            // Vor dem Schreiben alte States löschen
            await this.library.garbageColleting(`${this.adapter.namespace}.Stations.${stationId}.`, 2000);
            // JSON in die States schreiben
            await this.library.writeFromJson(
                `${this.adapter.namespace}.Stations.${stationId}.`,
                'departure',
                genericStateObjects,
                departureStates,
                true,
            );
        } catch (err) {
            this.log.error(`Fehler beim Schreiben der Abfahrten: ${(err as Error).message}`);
        }
    } */
}

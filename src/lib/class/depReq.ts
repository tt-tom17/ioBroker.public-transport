import type { TTAdapter } from '../../main';
import { defaultFolder, genericStateObjects } from '../const/definition';
import { BaseClass } from '../tools/library';
import { mapDeparturesToDepartureStates } from '../tools/mapper';
import { defaultDepartureOpt, type Departure, type DeparturesResponse, type Products } from '../types/types';

export class DepartureRequest extends BaseClass {
    response: DeparturesResponse;
    constructor(adapter: TTAdapter) {
        super(adapter);
        this.response = {} as DeparturesResponse;
    }
    /**
     *  Ruft Abfahrten für eine gegebene stationId ab und schreibt sie in die States.
     *
     * @param stationId     Die ID der Station, für die Abfahrten abgefragt werden sollen.
     * @param options      Zusätzliche Optionen für die Abfrage.
     * @param products    Die aktivierten Produkte (true = erlaubt)
     */
    public async getDepartures(stationId: string, options: any = {}, products?: Partial<Products>): Promise<void> {
        try {
            if (!stationId) {
                throw new Error('Keine stationId übergeben');
            }
            const hService = this.adapter.hService;
            const mergedOptions = { ...defaultDepartureOpt, ...options };
            // Antwort von HAFAS als vollständiger Typ
            this.response = await hService.getDepartures(stationId, mergedOptions);
            // Vollständiges JSON für Debugging
            this.adapter.log.debug(JSON.stringify(this.response.departures, null, 1));
            // Stations Ordner erstellen
            await this.library.writedp(`${this.adapter.namespace}.${stationId}`, undefined, defaultFolder);
            // Filtere nach Produkten, falls angegeben
            if (products) {
                this.response.departures = this.filterByProducts(this.response.departures, products);
            }
            // Konvertiere zu reduzierten States
            const departureStates = mapDeparturesToDepartureStates(this.response.departures);
            // Vor dem Schreiben alte States löschen
            await this.library.cleanUpTree([`${this.adapter.namespace}.${stationId}`], null, 1);
            // JSON in die States schreiben
            await this.library.writeFromJson(
                `${this.adapter.namespace}.${stationId}.`,
                'departures',
                genericStateObjects,
                departureStates,
                true,
            );
        } catch (error) {
            this.log.error(`Fehler bei der Abfrage der Abfahrten: ${(error as Error).message}`);
            throw error;
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
    filterByProducts(departures: Departure[], products: Partial<Products>): Departure[] {
        // Erstelle eine Liste der aktivierten Produktnamen
        const enabledProducts = Object.entries(products)
            .filter(([_, enabled]) => enabled === true)
            .map(([productName, _]) => productName);

        // Wenn keine Produkte aktiviert sind, gib alle zurück
        if (enabledProducts.length === 0) {
            return departures;
        }

        // Filtere Abfahrten: behalte nur die, deren line.product in enabledProducts ist
        return departures.filter(departure => {
            const lineProduct = departure.line?.product;
            if (!lineProduct) {
                this.log.info(
                    `Abfahrt ${departure.line?.name || 'unbekannt'} Richtung ${departure.direction} gefiltert: Keine Produktinfo vorhanden`,
                );
                return false;
            }
            const isEnabled = enabledProducts.includes(lineProduct);
            if (!isEnabled) {
                this.log.info(
                    `Abfahrt ${departure.line?.name} Richtung ${departure.direction} gefiltert: Produkt "${lineProduct}" nicht aktiviert`,
                );
            }
            return isEnabled;
        });
    }
}

import { createClient } from 'db-vendo-client';
import { profile as dbNavProfile } from 'db-vendo-client/p/dbnav/index.js';
import type * as Vendo from 'hafas-client';
import type { ITransportService } from '../types/transportService';

export class VendoService implements ITransportService {
    private navClient: ReturnType<typeof createClient> | null = null;
    private clientName: string;

    /**
     * Erzeugt eine neue Instanz des VendoService.
     * Der Client wird erst durch Aufruf von `init()` erstellt.
     *
     * @param clientName Name, der an den Client übergeben wird
     */
    constructor(clientName: string) {
        this.clientName = clientName;
    }

    /**
     * Initialisiert den db-vendo-Client.
     * Muss vor der Nutzung der anderen Methoden aufgerufen werden.
     *
     * @returns true bei Erfolg, false bei Fehler
     */
    public init(): boolean {
        try {
            this.navClient = createClient(dbNavProfile, this.clientName);
            return true;
        } catch (error) {
            throw new Error(`db-vendo-Client konnte nicht initialisiert werden: ${(error as Error).message}`);
        }
    }

    /**
     * Prüft ob der Client initialisiert wurde.
     */
    public isInitialized(): boolean {
        return this.navClient !== null;
    }

    /**
     * Gibt den initialisierten Client zurück oder wirft einen Fehler.
     */
    private getNavClient(): ReturnType<typeof createClient> {
        if (!this.navClient) {
            throw new Error('VendoService wurde noch nicht initialisiert. Bitte zuerst init() aufrufen.');
        }
        return this.navClient;
    }
    /**
     * Suche nach Orten/Stationen.
     *
     * @param query Suchbegriff für Orte/Stationen
     * @param options optionale Suchoptionen
     * @returns Promise mit Suchergebnissen (typisiert als Array von Station, Stop oder Location)
     */
    async getLocations(
        query: string,
        options?: Vendo.LocationsOptions,
    ): Promise<ReadonlyArray<Vendo.Station | Vendo.Stop | Vendo.Location>> {
        return this.getNavClient().locations(query, options);
    }

    /**
     * Holt Abfahrten für eine gegebene Station.
     *
     * @param stationId ID der Station
     * @param options optionale Abfrageoptionen
     * @returns Promise mit Abfahrten
     */
    async getDepartures(stationId: string, options?: Vendo.DeparturesArrivalsOptions): Promise<Vendo.Departures> {
        return this.getNavClient().departures(stationId, options);
    }

    /**
     * Holt Routen zwischen zwei Stationen.
     *
     * @param fromId ID der Startstation
     * @param toId ID der Zielstation
     * @param options optionale Routenoptionen
     * @returns Promise mit Routen
     */
    async getRoute(fromId: string, toId: string, options?: Vendo.JourneysOptions): Promise<Vendo.Journeys> {
        return this.getNavClient().journeys(fromId, toId, options);
    }

    /**
     * Holt Details zu einer Station/einem Haltpunkt.
     *
     * @param stationId ID der Station/des Haltpunkts
     * @param options optionale Abfrageoptionen
     * @returns Promise mit Stations-/Haltpunktdetails
     */
    async getStop(
        stationId: string,
        options?: Vendo.StopOptions,
    ): Promise<Vendo.Station | Vendo.Stop | Vendo.Location> {
        return this.getNavClient().stop(stationId, options);
    }
}

import type * as Hafas from 'hafas-client';

/**
 * Gemeinsames Interface für Transport-Services (HAFAS und Vendo)
 */
export interface ITransportService {
    init(): void;
    getLocations(
        query: string,
        options?: Hafas.LocationsOptions,
    ): Promise<ReadonlyArray<Hafas.Station | Hafas.Stop | Hafas.Location>>;
    getDepartures(stationId: string, options?: Hafas.DeparturesArrivalsOptions): Promise<Hafas.Departures>;
    getRoute(fromId: string, toId: string, options?: Hafas.JourneysOptions): Promise<Hafas.Journeys>;
    getStop(stationId: string, options?: Hafas.StopOptions): Promise<Hafas.Station | Hafas.Stop | Hafas.Location>;
    // Weitere gemeinsame Methoden hier hinzufügen
}

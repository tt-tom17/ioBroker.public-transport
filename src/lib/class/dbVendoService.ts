import { createClient } from 'db-vendo-client';
import { profile as dbVendoProfile } from 'db-vendo-client/p/dbnav/index.js';
import type {
    Departures,
    DeparturesArrivalsOptions,
    HafasClient,
    Journeys,
    JourneysOptions,
    Location,
    LocationsOptions,
    Station,
    Stop,
} from 'hafas-client';

export class VendoService {
    private client: HafasClient;

    constructor(clientName: string) {
        this.client = createClient(dbVendoProfile, clientName);
    }

    async getLocations(query: string, options?: LocationsOptions): Promise<ReadonlyArray<Station | Stop | Location>> {
        return this.client.locations(query, options);
    }

    async getDepartures(stationId: string, options?: DeparturesArrivalsOptions): Promise<Departures> {
        return this.client.departures(stationId, options);
    }

    async getRoute(fromId: string, toId: string, options?: JourneysOptions): Promise<Journeys> {
        return this.client.journeys(fromId, toId, options);
    }
}

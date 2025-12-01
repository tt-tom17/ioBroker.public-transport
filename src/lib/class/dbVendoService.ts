import { createClient as createVendoClient } from 'db-vendo-client';

export class VendoService {
    private client: ReturnType<typeof createVendoClient>;

    constructor(clientName: string) {
        this.client = createVendoClient(clientName);
    }

    async getLocations(query: string, options?: any): Promise<any> {
        return this.client.locations(query, options);
    }

    async getDepartures(stationId: string, options?: any): Promise<any> {
        return this.client.departures(stationId, options);
    }

    async getRoute(fromId: string, toId: string, options?: any): Promise<any> {
        return this.client.journeys(fromId, toId, options);
    }
}

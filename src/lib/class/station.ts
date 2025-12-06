import type * as Hafas from 'hafas-client';
import type { TTAdapter } from '../../main';
import { genericStateObjects } from '../const/definition';
import { BaseClass } from '../tools/library';

export class StationRequest extends BaseClass {
    constructor(adapter: TTAdapter) {
        super(adapter);
        this.log.setLogPrefix('station');
    }

    public async getStop(
        stationId: string,
        service: any,
        options?: Hafas.StopOptions,
    ): Promise<Hafas.Station | Hafas.Stop | Hafas.Location> {
        try {
            if (!stationId) {
                throw new Error('Keine stationId übergeben');
            }
            if (!service) {
                throw new Error('Kein Service übergeben');
            }
            const stop = await service.getStop(stationId, options);
            // Vollständiges JSON für Debugging
            this.adapter.log.debug(JSON.stringify(stop, null, 1));
            // JSON in die States schreiben
            await this.library.writeFromJson(
                `${this.adapter.namespace}.Stations.${stationId}`,
                'station',
                genericStateObjects,
                stop,
                true,
            );
            return stop;
        } catch (err) {
            this.log.error(`Fehler bei der Abfrage der Station ${stationId}: ${(err as Error).message}`);
            throw err;
        }
    }
}

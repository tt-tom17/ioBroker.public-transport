import type * as Hafas from 'hafas-client';
import type { TTAdapter } from '../../main';
import { genericStateObjects } from '../const/definition';
import { BaseClass } from '../tools/library';
import { mapStationToStationState } from '../tools/mapper';
import type { StationState } from '../types/types';

export class StationRequest extends BaseClass {
    constructor(adapter: TTAdapter) {
        super(adapter);
        this.log.setLogPrefix('stationReq');
    }

    public async getStation(
        stationId: string,
        service: any,
        options?: Hafas.StopOptions,
    ): Promise<Hafas.Station | Hafas.Stop> {
        try {
            if (!stationId) {
                throw new Error('Keine stationId übergeben');
            }
            if (!service) {
                throw new Error('Kein Service übergeben');
            }
            const station: Hafas.Station | Hafas.Stop = await service.getStop(stationId, options);
            // Vollständiges JSON für Debugging
            this.adapter.log.debug(JSON.stringify(station, null, 1));
            return station;
        } catch (err) {
            this.log.error(`Fehler bei der Abfrage der Station ${stationId}: ${(err as Error).message}`);
            throw err;
        }
    }
    async writeStationData(stationData: Hafas.Station | Hafas.Stop): Promise<void> {
        try {
            await this.library.writedp(
                `${this.adapter.namespace}.Stations.${stationData.id}.info.json`,
                JSON.stringify(stationData),
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: 'raw station data',
                        type: 'string',
                        role: 'json',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
            );
            const stationState: StationState = mapStationToStationState(stationData);
            // Vor dem Schreiben alte States löschen
            await this.library.garbageColleting(`${this.adapter.namespace}.Stations.${stationData.id}.info.`, 2000);
            // JSON in die States schreiben
            await this.library.writeFromJson(
                `${this.adapter.namespace}.Stations.${stationData.id}.info`,
                'station',
                genericStateObjects,
                stationState,
                true,
            );
        } catch (err) {
            this.log.error(`Fehler beim Schreiben der Station-Daten: ${(err as Error).message}`);
        }
    }
}

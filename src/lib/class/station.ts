import type * as Hafas from 'hafas-client';
import type { TTAdapter } from '../../main';
import { genericStateObjects } from '../const/definition';
import { BaseClass } from '../tools/library';
import { mapStationToStationState, mapStopToStopState } from '../tools/mapper';
import type { StationState, Stopstate } from '../types/types';

export class StationRequest extends BaseClass {
    constructor(adapter: TTAdapter) {
        super(adapter);
        this.log.setLogPrefix('stationReq');
    }

    private isStation(station: Hafas.Station | Hafas.Stop): station is Hafas.Station {
        return station.type === 'station';
    }

    /**
     * Ruft Informationen einer Station anhand der stationId ab.
     *
     * @param stationId     Die ID der Station.
     * @param service       Der Service für die Abfrage.
     * @param options       Zusätzliche Optionen für die Abfrage.
     * @returns             Die Informationen der Station oder Haltestelle.
     */
    public async getStation(
        stationId: string,
        service: any,
        options?: Hafas.StopOptions,
    ): Promise<Hafas.Station | Hafas.Stop> {
        try {
            if (!stationId) {
                throw new Error(this.library.translate('msg_departureNoStationId'));
            }
            if (!service) {
                throw new Error(this.library.translate('msg_noServices'));
            }
            const station: Hafas.Station | Hafas.Stop = await service.getStop(stationId, options);
            // Vollständiges JSON für Debugging
            this.adapter.log.debug(JSON.stringify(station, null, 1));
            return station;
        } catch (err) {
            this.log.error(this.library.translate('msg_stationQueryError', stationId, (err as Error).message));
            throw err;
        }
    }

    /**
     * Schreibt die Stationsdaten in die States.
     *
     * @param basePath      Der Basis-Pfad für die States.
     * @param stationData   Die Daten der Station oder Haltestelle.
     */
    public async writeStationData(basePath: string, stationData: Hafas.Station | Hafas.Stop): Promise<void> {
        try {
            await this.library.writedp(`${basePath}.json`, JSON.stringify(stationData), {
                _id: 'nicht_definieren',
                type: 'state',
                common: {
                    name: 'raw_station_data',
                    type: 'string',
                    role: 'json',
                    read: true,
                    write: false,
                },
                native: {},
            });
            if (this.isStation(stationData)) {
                const stationState: StationState = mapStationToStationState(stationData);
                // JSON in die States schreiben
                await this.library.writeFromJson(`${basePath}`, 'station', genericStateObjects, stationState, true);
            } else {
                const stopState: Stopstate = mapStopToStopState(stationData);
                await this.library.writeFromJson(`${basePath}`, 'station.stop', genericStateObjects, stopState, true);
            }
            // Vor dem Schreiben alte States löschen
            await this.library.garbageColleting(`${basePath}.`, 2000);
        } catch (err) {
            this.log.error(this.library.translate('msg_stationWriteError', (err as Error).message));
        }
    }
}

import type * as Hafas from 'hafas-client';
import type { PublicTransport } from '../../main';
import { genericStateObjects } from '../const/definition';
import { validateClientProfile } from '../tools/clientProfile';
import { BaseClass } from '../tools/library';
import { mapStationToStationState, mapStopToStopState } from '../tools/mapper';
import type { ITransportService } from '../types/transportService';
import type { StationState, Stopstate } from '../types/types';

export class StationRequest extends BaseClass {
    constructor(adapter: PublicTransport) {
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
     * @param client_profile Das Client-Profil für die Abfrage (z.B. "hafas:vbb", "vendo:db")
     * @returns             Die Informationen der Station oder Haltestelle.
     */
    public async getStation(
        stationId: string,
        service: ITransportService,
        options?: Hafas.StopOptions,
        client_profile?: string,
    ): Promise<Hafas.Station | Hafas.Stop> {
        try {
            if (!stationId) {
                throw new Error('No stationId provided');
            }
            if (!service) {
                throw new Error('No service provided');
            }

            // Validiere Client und Profil
            validateClientProfile(this.adapter.config.serviceType, this.adapter.config.profile, client_profile);
            // getStop() kann lt. Typ auch eine Location liefern; für eine Stations-ID kommt jedoch
            // immer eine Station/Stop zurück (Location wird vom Aufrufer nicht verarbeitet).
            const station = (await service.getStop(stationId, options)) as Hafas.Station | Hafas.Stop;
            // Vollständiges JSON für Debugging
            if (this.adapter.config.logCompletelyJSON) {
                this.log.debug(JSON.stringify(station, null, 1));
            }
            return station;
        } catch (err) {
            this.log.error(`Error querying stations. Error message: ${stationId}: ${(err as Error).message}`);
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
                await this.library.writeFromJson(`${basePath}`, 'station.stops', genericStateObjects, stopState, true);
            }
            // Vor dem Schreiben alte States löschen
            await this.library.garbageColleting(`${basePath}.`, 2000);
        } catch (err) {
            this.log.error(`Error writing station data: ${(err as Error).message}`);
        }
    }
}

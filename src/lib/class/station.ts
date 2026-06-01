import type * as Hafas from 'hafas-client';
import type { PublicTransport } from '../../main';
import { genericStateObjects } from '../const/definition';
import { BaseClass } from '../tools/library';
import { mapStationToStationState, mapStopToStopState } from '../tools/mapper';
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
     * Validiert, ob der initialisierte Client und das Profil mit dem angegebenen client_profile übereinstimmen.
     *
     * @param client_profile Das erwartete Client-Profil (z.B. "hafas:vbb", "vendo:db")
     */
    private validateClientProfile(client_profile?: string): void {
        if (!client_profile) {
            return; // Keine Validierung wenn nicht angegeben
        }

        // Parse client_profile (z.B. "hafas:vbb" -> serviceType: "hafas", profile: "vbb")
        const parts = client_profile.split(':');
        const expectedServiceType = parts[0]; // 'hafas' oder 'vendo'
        const expectedProfile = parts[1] || ''; // z.B. 'vbb', 'oebb', 'db'

        // Prüfe, ob der richtige Service-Typ initialisiert ist
        const currentServiceType = this.adapter.config.serviceType || 'hafas';
        if (currentServiceType !== expectedServiceType) {
            throw new Error(
                `Wrong client type: Expected '${expectedServiceType}', but '${currentServiceType}' is initialized (client_profile: ${client_profile})`,
            );
        }

        // Prüfe das Profil (nur relevant bei HAFAS)
        if (expectedServiceType === 'hafas' && expectedProfile) {
            const currentProfile = this.adapter.config.profile || '';
            if (currentProfile !== expectedProfile) {
                throw new Error(
                    `Wrong profile: Expected '${expectedProfile}', but '${currentProfile}' is configured (client_profile: ${client_profile})`,
                );
            }
        }
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
        service: any,
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
            this.validateClientProfile(client_profile);
            const station: Hafas.Station | Hafas.Stop = await service.getStop(stationId, options);
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
                await this.library.writeFromJson(`${basePath}`, 'station.stop', genericStateObjects, stopState, true);
            }
            // Vor dem Schreiben alte States löschen
            await this.library.garbageColleting(`${basePath}.`, 2000);
        } catch (err) {
            this.log.error(`Error writing station data: ${(err as Error).message}`);
        }
    }
}

import type { TTAdapter } from '../../main';
import type { ITransportService } from '../types/transportService';
import { PollingManager } from './pollingManager';

interface DepartureConfig {
    id: string;
    enabled: boolean;
    customName?: string;
    name?: string;
    offsetTime?: number;
    duration?: number;
    numDepartures?: number;
    products?: any;
}

export class DeparturePolling extends PollingManager<DepartureConfig> {
    constructor(adapter: TTAdapter) {
        super(adapter);
    }

    /**
     * Erstellt die Optionen für eine Abfahrtsanfrage.
     *
     * @param config Die Station-Konfiguration
     * @returns Die Optionen für die Abfrage
     */
    private createDepartureOptions(config: DepartureConfig): { results: number; when?: Date; duration: number } {
        const offsetTime = config.offsetTime ?? 0;
        const when: Date | undefined = offsetTime === 0 ? undefined : new Date(Date.now() + offsetTime * 60 * 1000);
        const duration = config.duration ?? 10;
        const results = config.numDepartures ?? 10;

        return { results, when, duration };
    }

    /**
     * Führt die Abfrage für eine Station durch.
     *
     * @param config Die Station-Konfiguration
     * @param service Der Transport-Service
     * @returns true wenn erfolgreich, false sonst
     */
    protected async queryConfig(config: DepartureConfig, service: ITransportService): Promise<boolean> {
        const options = this.createDepartureOptions(config);
        const products = config.products ?? undefined;

        return await this.adapter.depRequest.getDepartures(config.id, service, options, products);
    }

    /**
     * Startet das Polling für Abfahrten.
     *
     * @param pollIntervalMinutes Das Polling-Intervall in Minuten
     */
    public async startDepartures(pollIntervalMinutes: number): Promise<void> {
        await this.start(this.adapter.config.stationConfig as DepartureConfig[], pollIntervalMinutes, {
            noConfig: 'msg_noStationsConfigured',
            noEnabled: 'msg_noEnabledStations',
            count: 'msg_activeStationsFound',
            entry: 'msg_stationListEntry',
            fetching: 'msg_fetchingDepartures',
            updated: 'msg_departuresUpdated',
            failed: 'msg_departuresUpdateFailed',
            firstCompleted: 'msg_firstQueryCompleted',
            queryCompleted: 'msg_queryCompleted',
            waiting: 'msg_waitingForNextQuery',
        });
    }
}

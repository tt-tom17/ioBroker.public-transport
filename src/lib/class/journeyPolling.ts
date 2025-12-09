import type * as Hafas from 'hafas-client';
import type { TTAdapter } from '../../main';
import type { ITransportService } from '../types/transportService';
import { PollingManager } from './pollingManager';

interface JourneyConfig {
    id: string;
    enabled: boolean;
    customName?: string;
    name?: string;
    from: string;
    to: string;
    departure?: string;
    arrival?: string;
    results?: number;
    via?: string;
    stopovers?: boolean;
    transfers?: number;
    transferTime?: number;
    accessibility?: 'partial' | 'complete';
    bike?: boolean;
    products?: Partial<ioBroker.Products>;
}

export class JourneyPolling extends PollingManager<JourneyConfig> {
    constructor(adapter: TTAdapter) {
        super(adapter);
    }

    /**
     * Erstellt die Optionen für eine Journey-Anfrage.
     *
     * @param config Die Journey-Konfiguration
     * @returns Die Optionen für die Abfrage
     */
    private createJourneyOptions(config: JourneyConfig): Hafas.JourneysOptions {
        const options: Hafas.JourneysOptions = {
            results: config.results ?? 5,
            stopovers: config.stopovers ?? false,
        };

        if (config.departure) {
            options.departure = new Date(config.departure);
        }

        if (config.arrival) {
            options.arrival = new Date(config.arrival);
        }

        if (config.via) {
            options.via = config.via;
        }

        if (config.transfers !== undefined) {
            options.transfers = config.transfers;
        }

        if (config.transferTime !== undefined) {
            options.transferTime = config.transferTime;
        }

        if (config.accessibility) {
            options.accessibility = config.accessibility;
        }

        if (config.bike !== undefined) {
            options.bike = config.bike;
        }

        if (config.products) {
            options.products = config.products;
        }

        return options;
    }

    /**
     * Führt die Abfrage für eine Journey durch.
     *
     * @param config Die Journey-Konfiguration
     * @param service Der Transport-Service
     * @returns true wenn erfolgreich, false sonst
     */
    protected async queryConfig(config: JourneyConfig, service: ITransportService): Promise<boolean> {
        if (!config.from || !config.to) {
            this.adapter.log.warn(
                this.adapter.library.translate('msg_journeyNoFromTo', config.customName || config.name || ''),
            );
            return false;
        }

        const options = this.createJourneyOptions(config);

        try {
            return await this.adapter.journeysRequest.getJourneys(config.from, config.to, service, options);
        } catch (error) {
            this.adapter.log.error(
                this.adapter.library.translate(
                    'msg_journeyQueryFailed',
                    config.customName || config.name || '',
                    (error as Error).message,
                ),
            );
            return false;
        }
    }

    /**
     * Startet das Polling für Journeys.
     *
     * @param pollIntervalMinutes Das Polling-Intervall in Minuten
     */
    public async startJourneys(pollIntervalMinutes: number): Promise<void> {
        await this.start(this.adapter.config.journeys as JourneyConfig[], pollIntervalMinutes, {
            noConfig: 'msg_noJourneysConfigured',
            noEnabled: 'msg_noEnabledJourneysFound',
            count: 'msg_activeJourneysFound',
            entry: 'msg_journeyListEntry',
            fetching: 'msg_fetchingJourneys',
            updated: 'msg_journeysUpdated',
            failed: 'msg_journeysUpdateFailed',
            firstCompleted: 'msg_firstJourneyQueryCompleted',
            queryCompleted: 'msg_journeyQueryCompleted',
            waiting: 'msg_waitingForNextJourneyQuery',
        });
    }
}

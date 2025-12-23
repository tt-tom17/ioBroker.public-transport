import type * as Hafas from 'hafas-client';
import type { TTAdapter } from '../../main';
import type { ITransportService } from '../types/transportService';
import { PollingManager } from './pollingManager';

interface JourneyConfig {
    id: string;
    customName: string;
    enabled: boolean;
    numResults?: number;
    fromStationId: string;
    fromStationName: string;
    toStationId: string;
    toStationName: string;
    departure?: string;
    arrival?: string;
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
            results: config.numResults ?? 5,
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
     * Loggt die gefundenen Journey-Konfigurationen mit den korrekten Parametern.
     *
     * @param configs Die Journey-Konfigurationen
     * @param countMsg Der Übersetzungsschlüssel für die Anzahl
     * @param entryMsg Der Übersetzungsschlüssel für jeden Eintrag
     */
    protected logConfigs(configs: JourneyConfig[], countMsg: string, entryMsg: string): void {
        this.adapter.log.info(this.adapter.library.translate(countMsg, configs.length));
        for (const config of configs) {
            this.adapter.log.info(
                this.adapter.library.translate(
                    entryMsg,
                    config.customName || '',
                    config.fromStationName || config.fromStationId || '',
                    config.toStationName || config.toStationId || '',
                ),
            );
        }
    }

    /**
     * Führt die Abfrage für eine Journey durch.
     *
     * @param config Die Journey-Konfiguration
     * @param service Der Transport-Service
     * @returns true wenn erfolgreich, false sonst
     */
    protected async queryConfig(config: JourneyConfig, service: ITransportService): Promise<boolean> {
        if (!config.fromStationId || !config.toStationId) {
            this.adapter.log.warn(this.adapter.library.translate('msg_journeyNoFromTo', config.customName || ''));
            return false;
        }

        const options = this.createJourneyOptions(config);

        try {
            return await this.adapter.journeysRequest.getJourneys(
                config.id,
                config.fromStationId,
                config.toStationId,
                service,
                options,
            );
        } catch (error) {
            this.adapter.log.error(
                this.adapter.library.translate(
                    'msg_journeyQueryFailed',
                    config.customName || '',
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
        await this.start(this.adapter.config.journeyConfig as JourneyConfig[], pollIntervalMinutes, {
            noConfig: 'msg_noJourneysConfigured',
            noEnabled: 'msg_noEnabledJourneys',
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

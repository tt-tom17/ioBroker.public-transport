import type { TTAdapter } from '../../main';
import type { ITransportService } from '../types/transportService';

interface PollingConfig {
    id: string;
    enabled: boolean;
    customName?: string;
    name?: string;
    [key: string]: any;
}

export abstract class PollingManager<T extends PollingConfig> {
    protected adapter: TTAdapter;
    private pollInterval: ioBroker.Interval | undefined;

    constructor(adapter: TTAdapter) {
        this.adapter = adapter;
    }

    /**
     * Gibt die aktivierten Konfigurationen zurück.
     *
     * @param configs Die Konfigurationen
     * @param noConfigMsg Der Übersetzungsschlüssel wenn keine Konfigurationen vorhanden sind
     * @param noEnabledMsg Der Übersetzungsschlüssel wenn keine aktivierten Konfigurationen vorhanden sind
     * @returns Die aktivierten Konfigurationen oder undefined
     */
    protected getEnabledConfigs(configs: T[] | undefined, noConfigMsg: string, noEnabledMsg: string): T[] | undefined {
        if (!configs || configs.length === 0) {
            this.adapter.log.debug(this.adapter.library.translate(noConfigMsg));
            return undefined;
        }

        const enabledConfigs = configs.filter(config => config.enabled);

        if (enabledConfigs.length === 0) {
            this.adapter.log.debug(this.adapter.library.translate(noEnabledMsg));
            return undefined;
        }

        return enabledConfigs;
    }

    /**
     * Loggt die gefundenen Konfigurationen.
     *
     * @param configs Die Konfigurationen
     * @param countMsg Der Übersetzungsschlüssel für die Anzahl
     * @param entryMsg Der Übersetzungsschlüssel für jeden Eintrag
     */
    protected logConfigs(configs: T[], countMsg: string, entryMsg: string): void {
        this.adapter.log.info(this.adapter.library.translate(countMsg, configs.length));
        for (const config of configs) {
            this.adapter.log.info(
                this.adapter.library.translate(entryMsg, config.customName || config.name || '', config.id ?? ''),
            );
        }
    }

    /**
     * Abstrakte Methode für die eigentliche Abfrage - muss von Subklassen implementiert werden.
     */
    protected abstract queryConfig(config: T, service: ITransportService): Promise<boolean>;

    /**
     * Führt Abfragen für alle Konfigurationen durch.
     *
     * @param configs Die Konfigurationen
     * @param service Der Transport-Service
     * @param fetchingMsg Der Übersetzungsschlüssel für "Abrufen"
     * @param updatedMsg Der Übersetzungsschlüssel für "Aktualisiert"
     * @param failedMsg Der Übersetzungsschlüssel für "Fehlgeschlagen"
     * @returns Objekt mit successCount und errorCount
     */
    private async queryConfigs(
        configs: T[],
        service: ITransportService,
        fetchingMsg: string,
        updatedMsg: string,
        failedMsg: string,
    ): Promise<{ successCount: number; errorCount: number }> {
        let successCount = 0;
        let errorCount = 0;

        for (const config of configs) {
            if (!config.id) {
                this.adapter.log.warn(
                    this.adapter.library.translate('msg_stationNoValidId', config.customName || config.name || ''),
                );
                continue;
            }

            this.adapter.log.info(
                this.adapter.library.translate(fetchingMsg, config.customName || config.name || '', config.id),
            );

            const success = await this.queryConfig(config, service);

            if (success) {
                successCount++;
                this.adapter.log.info(
                    this.adapter.library.translate(updatedMsg, config.customName || config.name || '', config.id),
                );
            } else {
                errorCount++;
                this.adapter.log.warn(
                    this.adapter.library.translate(failedMsg, config.customName || config.name || '', config.id),
                );
            }
        }

        return { successCount, errorCount };
    }

    /**
     * Startet das Polling.
     *
     * @param configs Die Konfigurationen
     * @param pollIntervalMinutes Das Polling-Intervall in Minuten
     * @param messages Die Übersetzungsschlüssel für verschiedene Meldungen
     * @param messages.noConfig keine Konfigurationen vorhanden
     * @param messages.noEnabled keine aktivierten Konfigurationen vorhanden
     * @param messages.count Anzahl der aktiven Konfigurationen
     * @param messages.entry Eintrag für jede Konfiguration
     * @param messages.fetching Abrufen der Daten
     * @param messages.updated Daten aktualisiert
     * @param messages.failed Datenaktualisierung fehlgeschlagen
     * @param messages.firstCompleted erste Abfrage abgeschlossen
     * @param messages.queryCompleted Abfrage abgeschlossen
     * @param messages.waiting Warten auf die nächste Abfrage
     */
    public async start(
        configs: T[] | undefined,
        pollIntervalMinutes: number,
        messages: {
            noConfig: string;
            noEnabled: string;
            count: string;
            entry: string;
            fetching: string;
            updated: string;
            failed: string;
            firstCompleted: string;
            queryCompleted: string;
            waiting: string;
        },
    ): Promise<void> {
        const service = this.adapter.getActiveService();
        const enabledConfigs = this.getEnabledConfigs(configs, messages.noConfig, messages.noEnabled);

        if (!enabledConfigs) {
            return;
        }

        this.logConfigs(enabledConfigs, messages.count, messages.entry);

        const pollInterval = pollIntervalMinutes * 60 * 1000;

        // Erste Abfrage sofort ausführen
        const { successCount, errorCount } = await this.queryConfigs(
            enabledConfigs,
            service,
            messages.fetching,
            messages.updated,
            messages.failed,
        );
        this.adapter.log.info(this.adapter.library.translate(messages.firstCompleted, successCount, errorCount));
        this.adapter.log.info(this.adapter.library.translate(messages.waiting, pollIntervalMinutes));

        // Starte Intervall für regelmäßige Abfragen
        this.pollInterval = this.adapter.setInterval(async () => {
            const { successCount, errorCount } = await this.queryConfigs(
                enabledConfigs,
                service,
                messages.fetching,
                messages.updated,
                messages.failed,
            );
            this.adapter.log.info(this.adapter.library.translate(messages.queryCompleted, successCount, errorCount));
            this.adapter.log.info(this.adapter.library.translate(messages.waiting, pollIntervalMinutes));
        }, pollInterval);
    }

    /**
     * Stoppt das Polling.
     */
    public stop(): void {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = undefined;
        }
    }
}

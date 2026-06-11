import type { PublicTransport } from '../../main';
import { BaseClass } from '../tools/library';
import type { ITransportService } from '../types/transportService';

interface PollingConfig {
    id: string;
    enabled: boolean;
    customName?: string;
    name?: string;
    [key: string]: any;
}

export abstract class PollingManager<T extends PollingConfig> extends BaseClass {
    private pollInterval: ioBroker.Interval | undefined;

    constructor(adapter: PublicTransport) {
        super(adapter);
        this.log.setLogPrefix('pollmanager');
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
            this.log.debug(noConfigMsg);
            return undefined;
        }

        const enabledConfigs = configs.filter(config => config.enabled);

        if (enabledConfigs.length === 0) {
            this.log.debug(noEnabledMsg);
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
    protected logConfigs(
        configs: T[],
        countMsg: (n: number) => string,
        entryMsg: (name: string, id: string) => string,
    ): void {
        this.log.info(countMsg(configs.length));
        for (const config of configs) {
            this.log.info(entryMsg(config.customName || config.name || '', config.id ?? ''));
        }
    }

    /**
     * Abstrakte Methode für die eigentliche Abfrage - muss von Subklassen implementiert werden.
     */
    protected abstract queryConfig(config: T, service: ITransportService): Promise<boolean>;

    /**
     * Setzt die States von deaktivierten Konfigurationen auf Standardwerte zurück.
     * Muss von Subklassen implementiert werden, da der Präfix unterschiedlich ist.
     *
     * @param configs Alle Konfigurationen
     */
    protected abstract handleDisabledConfigs(configs: T[] | undefined): Promise<void>;

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
        fetchingMsg: (name: string, id: string) => string,
        updatedMsg: (name: string, id: string) => string,
        failedMsg: (name: string, id: string) => string,
    ): Promise<{ successCount: number; errorCount: number }> {
        let successCount = 0;
        let errorCount = 0;

        for (const config of configs) {
            // Adapter wird heruntergefahren -> laufende Abfrage abbrechen, keine States mehr schreiben
            if (this.adapter.unload) {
                break;
            }

            if (!config.id) {
                this.log.warn(`Station "${config.customName || config.name || ''}" has no valid ID, skipping...`);
                continue;
            }

            this.log.info(fetchingMsg(config.customName || config.name || '', config.id));

            const success = await this.queryConfig(config, service);

            if (success) {
                successCount++;
                this.log.info(updatedMsg(config.customName || config.name || '', config.id));
            } else {
                errorCount++;
                this.log.warn(failedMsg(config.customName || config.name || '', config.id));
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
            count: (n: number) => string;
            entry: (name: string, id: string) => string;
            fetching: (name: string, id: string) => string;
            updated: (name: string, id: string) => string;
            failed: (name: string, id: string) => string;
            firstCompleted: (success: number, error: number) => string;
            queryCompleted: (success: number, error: number) => string;
            waiting: (minutes: number) => string;
        },
    ): Promise<void> {
        const service = this.adapter.getActiveService();

        // Behandle deaktivierte Stationen (setze States auf Standardwerte)
        // Muss vor dem Early Return passieren, damit auch der Fall "alle deaktiviert" behandelt wird
        await this.handleDisabledConfigs(configs);

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
        this.log.info(messages.firstCompleted(successCount, errorCount));
        this.log.info(messages.waiting(pollIntervalMinutes));

        // Starte Intervall für regelmäßige Abfragen
        this.pollInterval = this.adapter.setInterval(async () => {
            // Adapter wird heruntergefahren -> diesen Poll-Durchlauf überspringen
            if (this.adapter.unload) {
                return;
            }

            // Fehler innerhalb des Timer-Callbacks müssen hier gefangen werden, sonst
            // entsteht eine unhandled promise rejection, die den Adapter abstürzen lässt.
            try {
                // Behandle deaktivierte Stationen bei jedem Poll
                await this.handleDisabledConfigs(configs);

                const { successCount, errorCount } = await this.queryConfigs(
                    enabledConfigs,
                    service,
                    messages.fetching,
                    messages.updated,
                    messages.failed,
                );
                this.log.info(messages.queryCompleted(successCount, errorCount));
                this.log.info(messages.waiting(pollIntervalMinutes));
            } catch (err) {
                this.log.error(`Polling cycle failed. Error message: ${(err as Error).message}`);
            }
        }, pollInterval);
    }

    /**
     * Stoppt das Polling.
     */
    public stop(): void {
        if (this.pollInterval) {
            this.adapter.clearInterval(this.pollInterval);
            this.pollInterval = undefined;
        }
    }
}

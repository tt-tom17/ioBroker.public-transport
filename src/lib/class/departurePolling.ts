import type { PublicTransport } from '../../main';
import { camelToKebab } from '../tools/library';
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
    client_profile?: string;
}

export class DeparturePolling extends PollingManager<DepartureConfig> {
    constructor(adapter: PublicTransport) {
        super(adapter);
        this.log.setLogPrefix('depPoll');
    }

    /**
     * Setzt die States von deaktivierten Stationen auf Standardwerte zurück.
     *
     * @param configs Alle Station-Konfigurationen
     */
    protected async handleDisabledConfigs(configs: DepartureConfig[] | undefined): Promise<void> {
        if (!configs || configs.length === 0) {
            return;
        }

        const disabledConfigs = configs.filter(config => config.enabled === false);

        for (const config of disabledConfigs) {
            if (!config.id) {
                continue;
            }

            this.log.debug(
                `Reset states for deactivated station: ${config.customName || config.name || ''} (${config.id})`,
            );

            // Verwende garbageColleting um States auf Standardwerte zu setzen
            await this.adapter.library.garbageColleting(
                `Stations.${config.id}.`,
                2000, // offset = 0 bedeutet: alle States sofort zurücksetzen
                false, // del = false: States zurücksetzen, nicht löschen
            );
        }
    }

    /**
     * Erstellt die Optionen für eine Abfahrtsanfrage.
     *
     * @param config Die Station-Konfiguration
     * @returns Die Optionen für die Abfrage
     */
    private createDepartureOptions(config: DepartureConfig): {
        results: number;
        when?: Date;
        duration: number;
        services?: string;
        client_profile?: string;
        products?: any;
    } {
        const offsetTime = config.offsetTime ?? 0;
        const when: Date = offsetTime === 0 ? new Date() : new Date(Date.now() + offsetTime * 60 * 1000);
        const duration = config.duration ?? 60;
        const results = config.numDepartures ?? 10;
        const products = config.products
            ? Object.fromEntries(Object.entries(config.products).map(([k, v]) => [camelToKebab(k), v]))
            : undefined;

        return { results, when, duration, products };
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
        const countEntries = config.numDepartures ?? 10;
        const client_profile = config.client_profile ?? undefined;
        this.log.debug(`QueryConfig parameters:
             id: ${config.id},
             service: ${JSON.stringify(service)},
             option: ${JSON.stringify(options)},
             countEntries: ${countEntries},
             products: ${JSON.stringify(products)},
             client_profil: ${client_profile}`);

        try {
            return await this.adapter.depRequest.getDepartures(
                config.id,
                service,
                options,
                countEntries,
                products,
                client_profile,
            );
        } catch (error) {
            this.log.error(`Error querying departures "${config.customName || ''}": ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Startet das Polling für Abfahrten.
     *
     * @param pollIntervalMinutes Das Polling-Intervall in Minuten
     */
    public async startDepartures(pollIntervalMinutes: number): Promise<void> {
        await this.start(this.adapter.config.stationConfig, pollIntervalMinutes, {
            noConfig: 'No stations found in configuration. Please configure in Admin UI.',
            noEnabled: 'No enabled stations found. Please enable at least one station.',
            count: n => `${n} active station(s) found:`,
            entry: (name, id) => `  - ${name} (ID: ${id})`,
            fetching: (name, id) => `Fetching departures for: ${name} (${id})`,
            updated: (name, id) => `Departures updated for: ${name} (${id})`,
            failed: (name, id) => `Departures could not be updated for: ${name} (${id})`,
            firstCompleted: (s, f) => `First query completed: ${s} successful, ${f} failed`,
            queryCompleted: (s, f) => `Query completed: ${s} successful, ${f} failed`,
            waiting: m => `Waiting for next query in ${m} minutes...`,
        });
    }
}

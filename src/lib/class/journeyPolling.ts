import type * as Hafas from 'hafas-client';
import type { PublicTransport } from '../../main';
import { camelToKebab } from '../tools/library';
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
    client_profile?: string;
}

export class JourneyPolling extends PollingManager<JourneyConfig> {
    constructor(adapter: PublicTransport) {
        super(adapter);
        this.log.setLogPrefix('journeyPoll');
    }

    /**
     * Setzt die States von deaktivierten Journeys auf Standardwerte zurück.
     *
     * @param configs Alle Journey-Konfigurationen
     */
    protected async handleDisabledConfigs(configs: JourneyConfig[] | undefined): Promise<void> {
        if (!configs || configs.length === 0) {
            return;
        }

        const disabledConfigs = configs.filter(config => config.enabled === false);

        for (const config of disabledConfigs) {
            if (!config.id) {
                continue;
            }

            this.log.debug(`Reset states for deactivated journey: ${config.customName || ''} (${config.id})`);

            // Verwende garbageColleting um States auf Standardwerte zu setzen
            await this.adapter.library.garbageColleting(
                `Journeys.${config.id}.`,
                2000, // offset = 0 bedeutet: alle States sofort zurücksetzen
                false, // del = false: States zurücksetzen, nicht löschen
            );
        }
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
            options.products = Object.fromEntries(
                Object.entries(config.products).map(([k, v]) => [camelToKebab(k), v]),
            );
        }

        return options;
    }

    /**
     * Loggt die gefundenen Journey-Konfigurationen mit den korrekten Parametern.
     *
     * @param configs Die Journey-Konfigurationen
     * @param countMsg Der Übersetzungsschlüssel für die Anzahl
     * @param _entryMsg Der Übersetzungsschlüssel für jeden Eintrag
     */
    protected logConfigs(
        configs: JourneyConfig[],
        countMsg: (n: number) => string,
        _entryMsg: (name: string, id: string) => string,
    ): void {
        this.log.info(countMsg(configs.length));
        for (const config of configs) {
            this.log.info(
                `  - ${config.customName || ''} (From: ${config.fromStationName || config.fromStationId || ''}, To: ${config.toStationName || config.toStationId || ''})`,
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
            this.log.warn('No start or destination station provided');
            return false;
        }

        const options = this.createJourneyOptions(config);
        const products = config.products
            ? Object.fromEntries(Object.entries(config.products).map(([k, v]) => [camelToKebab(k), v]))
            : undefined;
        const countEntries = config.numResults ?? 5;
        const client_profile = config.client_profile ?? undefined;

        this.log.debug(`Journey query parameters:
             id: ${config.id},
             fromId: ${config.fromStationId},
             toId: ${config.toStationId},
             service: ${service.constructor?.name ?? 'unknown'},
             option: ${JSON.stringify(options)},
             countEntires: ${countEntries},
             products: ${JSON.stringify(products)},
             client_profil: ${client_profile}`);

        try {
            return await this.adapter.journeysRequest.getJourneys(
                config.id,
                config.fromStationId,
                config.toStationId,
                service,
                options,
                countEntries,
                products,
                client_profile,
            );
        } catch (error) {
            this.log.error(`Error querying journey "${config.customName || ''}": ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Startet das Polling für Journeys.
     *
     * @param pollIntervalMinutes Das Polling-Intervall in Minuten
     */
    public async startJourneys(pollIntervalMinutes: number): Promise<void> {
        await this.start(this.adapter.config.journeyConfig, pollIntervalMinutes, {
            noConfig: 'No journeys found in configuration. Please configure in Admin UI.',
            noEnabled: 'No enabled journeys found. Please enable at least one journey.',
            count: n => `${n} active journey(s) found:`,
            entry: (name, id) => `  - ${name} (ID: ${id})`,
            fetching: (name, id) => `Fetching journeys for: ${name} (${id})`,
            updated: (name, id) => `Journeys updated for: ${name} (${id})`,
            failed: (name, id) => `Journeys could not be updated for: ${name} (${id})`,
            firstCompleted: (s, f) => `First journey query completed: ${s} successful, ${f} failed`,
            queryCompleted: (s, f) => `Journey query completed: ${s} successful, ${f} failed`,
            waiting: m => `Waiting for next journey query in ${m} minutes...`,
        });
    }
}

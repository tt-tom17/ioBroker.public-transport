/**
 * HafasService - Backend-Service für `hafas-client`.
 *
 * Legt nur fest, wie der HAFAS-Client erzeugt wird (inkl. Profil-Auswahl). Der gesamte
 * gemeinsame Code (Client-Lebenszyklus, Abfrage-Methoden, Retry/Timeout) steckt in
 * {@link BaseTransportService}.
 */
import type { HafasClient, Profile } from 'hafas-client';
import { createClient as hafasClient } from 'hafas-client';
import { profile as oebbProfile } from 'hafas-client/p/oebb/index.js';
import { profile as rmvProfile } from 'hafas-client/p/rmv/index.js';
import { profile as vbbProfile } from 'hafas-client/p/vbb/index.js';
import { profile as vbnProfile } from 'hafas-client/p/vbn/index.js';
import { profile as vmtProfile } from 'hafas-client/p/vmt/index.js';
import { withThrottling } from 'hafas-client/throttle.js';
import type { PublicTransport } from '../../main';
import { BaseTransportService } from './baseTransportService';

export class HafasService extends BaseTransportService {
    private readonly profileName: string;

    /**
     * Erzeugt eine neue Instanz des HafasService.
     * Der Client wird erst durch Aufruf von `init()` erstellt.
     *
     * @param adapter Die Adapter-Instanz (für die ioBroker-Timer)
     * @param clientName Name, der an den Client übergeben wird
     * @param profileName Name des HAFAS-Profils ('vbb', 'oebb', 'vbn', 'rmv', 'vmt')
     */
    constructor(adapter: PublicTransport, clientName: string, profileName: string) {
        super(adapter, clientName);
        this.profileName = profileName;
    }

    protected get serviceName(): string {
        return 'HAFAS';
    }

    protected createClient(): HafasClient {
        const profile = this.resolveProfile(this.profileName);
        // Vom Profil unterstützte Produkte merken, damit unbekannte Produkt-Filter (z.B.
        // 'national-train' für rmv) vor dem Aufruf entfernt werden statt die Abfrage abzubrechen.
        this.setProfileProducts(profile);
        return hafasClient(withThrottling(profile), this.clientName);
    }

    /**
     * Löst einen Profilnamen ('vbb', 'oebb', 'vbn', 'rmv', 'vmt') in das zugehörige HAFAS-Profil auf.
     * Fail-fast: Ist kein Profil konfiguriert oder unbekannt, wird geworfen – der Adapter
     * startet bewusst NICHT mit einem stillschweigenden Default (z.B. vbb/Berlin für jemanden,
     * der ein anderes Verkehrsgebiet möchte). Die Fehler werden in main.ts geloggt.
     *
     * @param profile Profilname aus der Adapter-Konfiguration
     * @returns das aufgelöste Profil-Objekt
     */
    private resolveProfile(profile?: string): Profile {
        if (!profile) {
            throw new Error(
                `No HAFAS profile configured. Please select a profile ('vbb', 'oebb', 'vbn', 'rmv' or 'vmt') in the adapter settings.`,
            );
        }

        switch (profile) {
            case 'vbb': {
                return vbbProfile;
            }
            case 'oebb': {
                return oebbProfile;
            }
            case 'vbn': {
                return vbnProfile;
            }
            case 'rmv': {
                return rmvProfile;
            }
            case 'vmt': {
                return vmtProfile;
            }
            default: {
                throw new Error(
                    `unknown profile: ${String(profile)}. available profiles: 'vbb', 'oebb', 'vbn', 'rmv', 'vmt'.`,
                );
            }
        }
    }
}

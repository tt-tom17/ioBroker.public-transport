/**
 * HafasService - Backend-Service für `hafas-client`.
 *
 * Legt nur fest, wie der HAFAS-Client erzeugt wird (inkl. Profil-Auswahl). Der gesamte
 * gemeinsame Code (Client-Lebenszyklus, Abfrage-Methoden, Retry/Timeout) steckt in
 * {@link BaseTransportService}.
 */
import type { HafasClient } from 'hafas-client';
import { createClient as hafasClient } from 'hafas-client';
import { profile as oebbProfile } from 'hafas-client/p/oebb/index.js';
import { profile as vbbProfile } from 'hafas-client/p/vbb/index.js';
import { profile as vbnProfile } from 'hafas-client/p/vbn/index.js';
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
     * @param profileName Name des HAFAS-Profils ('vbb', 'oebb', 'vbn')
     */
    constructor(adapter: PublicTransport, clientName: string, profileName: string) {
        super(adapter, clientName);
        this.profileName = profileName;
    }

    protected get serviceName(): string {
        return 'HAFAS';
    }

    protected createClient(): HafasClient {
        return hafasClient(withThrottling(this.resolveProfile(this.profileName)), this.clientName);
    }

    /**
     * Resolve a profile given either a ProfileName or a profile object.
     * Falls `profile` leer ist, wird `vbbProfile` verwendet.
     *
     * @param profile entweder ein Eintrag aus `ProfileName` oder ein Profil-Objekt
     * @returns das aufgelöste Profil-Objekt
     */
    private resolveProfile(profile?: string): any {
        if (!profile) {
            return vbbProfile;
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
            default: {
                throw new Error(`unknown profile: ${String(profile)}. available profiles: 'vbb', 'oebb', 'vbn'.`);
            }
        }
    }
}

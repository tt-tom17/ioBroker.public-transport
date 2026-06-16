/**
 * MotisService - Backend-Service für `@motis-project/motis-fptf-client` (Transitous).
 *
 * Legt nur fest, wie der MOTIS-Client erzeugt wird. Der gesamte gemeinsame Code
 * (Client-Lebenszyklus, Abfrage-Methoden, Retry/Timeout) steckt in
 * {@link BaseTransportService}.
 */
import { createClient } from '@motis-project/motis-fptf-client';
import { profile as compatProfile } from '@motis-project/motis-fptf-client/p/compat/index.js';
import { withThrottling } from '@motis-project/motis-fptf-client/throttle.js';
import type { HafasClient } from 'hafas-client';
import { BaseTransportService } from './baseTransportService';

export class MotisService extends BaseTransportService {
    protected get serviceName(): string {
        return 'MOTIS';
    }

    protected createClient(): HafasClient {
        // enrichStations deaktiviert, um das Laden von db-hafas-stations zu vermeiden
        const profile = { ...compatProfile, enrichStations: false };
        // Vom Profil unterstützte Produkte merken, damit unbekannte Produkt-Filter vor
        // dem Aufruf entfernt werden statt die Abfrage abzubrechen.
        this.setProfileProducts(profile);
        return createClient(withThrottling(profile), this.clientName);
    }
}

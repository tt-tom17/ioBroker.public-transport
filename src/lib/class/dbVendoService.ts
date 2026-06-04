/**
 * VendoService - Backend-Service für `db-vendo-client`.
 *
 * Legt nur fest, wie der db-vendo-Client erzeugt wird. Der gesamte gemeinsame Code
 * (Client-Lebenszyklus, Abfrage-Methoden, Retry/Timeout) steckt in
 * {@link BaseTransportService}.
 */
import { createClient } from 'db-vendo-client';
import { profile as dbNavProfile } from 'db-vendo-client/p/db/index.js';
import { withThrottling } from 'db-vendo-client/throttle.js';
import type { HafasClient } from 'hafas-client';
import { BaseTransportService } from './baseTransportService';

export class VendoService extends BaseTransportService {
    protected get serviceName(): string {
        return 'db-vendo';
    }

    protected createClient(): HafasClient {
        return createClient(withThrottling(dbNavProfile), this.clientName);
    }
}

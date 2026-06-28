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

/** Minimaler Request-Typ des hafas-client-Hooks (nur `headers` wird hier angefasst). */
interface HafasReq {
    headers?: Record<string, string>;
    [key: string]: unknown;
}

/**
 * `transformReq` ist ein interner Request-Hook von `hafas-client` und nicht Teil der
 * offiziellen `Profile`-Typen – daher hier minimal nachgebildet.
 */
interface HafasReqProfile extends Profile {
    transformReq?: (ctx: unknown, req: HafasReq) => HafasReq;
}

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
        const profile = this.forceIdentityEncoding(this.resolveProfile(this.profileName));
        // Vom Profil unterstützte Produkte merken, damit unbekannte Produkt-Filter (z.B.
        // 'national-train' für rmv) vor dem Aufruf entfernt werden statt die Abfrage abzubrechen.
        this.setProfileProducts(profile);
        return hafasClient(withThrottling(profile), this.clientName);
    }

    /**
     * Erzwingt `Accept-Encoding: identity` (keine Kompression) für alle Requests des Profils.
     *
     * Hintergrund: Die HAFAS-`mgate.exe`-Endpoints (u.a. vbb/fahrinfo.vbb.de und oebb/fahrplan.oebb.at)
     * senden gzip-Antworten ohne `Content-Length`. Daran verschluckt sich `node-fetch` v2 – die
     * fetch-Schicht von `hafas-client` (via `cross-fetch`) – beim Entpacken und bricht mit
     * `ERR_STREAM_PREMATURE_CLOSE` ("Premature close") ab. Das ist KEIN transienter Netzwerkfehler,
     * sondern tritt systematisch auf; ein Retry hilft nicht. Ohne Kompression liefern die Server saubere
     * Antworten; der Mehr-Traffic ist bei den Poll-Intervallen vernachlässigbar.
     *
     * @param profile Das aufgelöste HAFAS-Profil
     * @returns Eine Profil-Kopie mit überschriebenem `transformReq`-Hook
     */
    private forceIdentityEncoding(profile: Profile): Profile {
        const p = profile as HafasReqProfile;
        const origTransformReq = p.transformReq;
        return {
            ...p,
            transformReq(ctx: unknown, req: HafasReq): HafasReq {
                const r = origTransformReq ? origTransformReq(ctx, req) : req;
                r.headers = { ...r.headers, 'Accept-Encoding': 'identity' };
                return r;
            },
        } as Profile;
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

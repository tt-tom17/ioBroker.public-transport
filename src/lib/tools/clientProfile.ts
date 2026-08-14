/**
 * Validierung des optionalen `client_profile` einer Stations-/Verbindungs-Konfiguration.
 *
 * Bisher war diese Logik byte-identisch in DepartureRequest, JourneysRequest und
 * StationRequest dupliziert – sie lebt jetzt an dieser einen Stelle.
 */

/**
 * Prüft, ob das in der Eintrags-Konfiguration angegebene `client_profile` zum aktuell
 * initialisierten Transport-Service passt, und wirft bei Abweichung einen Fehler.
 *
 * Format von `client_profile`: `"<serviceType>:<profile>"`, z.B. `"hafas:vbb"`, `"vendo:db"`.
 * - Der `serviceType` muss dem konfigurierten Service entsprechen.
 * - Das Profil wird **nur bei HAFAS** geprüft. `vendo`, `motis` und `efa` kennen keine
 *   Profil-Auswahl – bei ihnen entscheidet der Service-Typ (bei `efa` zusätzlich die in der
 *   Instanz konfigurierte Basis-URL), ein evtl. angegebener Profil-Teil wird ignoriert.
 *
 * @param configuredServiceType Der konfigurierte Service-Typ (`adapter.config.serviceType`)
 * @param configuredProfile Das konfigurierte HAFAS-Profil (`adapter.config.profile`)
 * @param client_profile Das erwartete Client-Profil aus der Eintrags-Konfiguration (optional)
 */
export function validateClientProfile(
    configuredServiceType: string | undefined,
    configuredProfile: string | undefined,
    client_profile?: string,
): void {
    if (!client_profile) {
        return; // Keine Validierung wenn nicht angegeben
    }

    // Parse client_profile (z.B. "hafas:vbb" -> serviceType: "hafas", profile: "vbb")
    const parts = client_profile.split(':');
    const expectedServiceType = parts[0]; // 'hafas', 'vendo', 'motis' oder 'efa'
    const expectedProfile = parts[1] || ''; // z.B. 'vbb', 'oebb', 'db'

    // Prüfe, ob der richtige Service-Typ initialisiert ist
    const currentServiceType = configuredServiceType || 'hafas';
    if (currentServiceType !== expectedServiceType) {
        throw new Error(
            `Wrong client type: Expected '${expectedServiceType}', but '${currentServiceType}' is initialized (client_profile: ${client_profile})`,
        );
    }

    // Prüfe das Profil (nur relevant bei HAFAS; vendo/motis haben ein festes Profil)
    if (expectedServiceType === 'hafas' && expectedProfile) {
        const currentProfile = configuredProfile || '';
        if (currentProfile !== expectedProfile) {
            throw new Error(
                `Wrong profile: Expected '${expectedProfile}', but '${currentProfile}' is configured (client_profile: ${client_profile})`,
            );
        }
    }
}

/**
 * HafasService - kleiner Wrapper um `hafas-client`.
 *
 * Kapselt die Client-Erzeugung und bietet einfache asynchrone Methoden
 * für `locations` und `departures` an.
 */
import type * as Hafas from 'hafas-client';
import { createClient as hafasClient } from 'hafas-client';
import { profile as vbbProfile } from 'hafas-client/p/vbb/index.js';
import type { ITransportService } from '../types/transportService';

export class HafasService implements ITransportService {
    private client: ReturnType<typeof hafasClient> | null = null;
    private clientName: string;
    private profileName: string;

    /**
     * Erzeugt eine neue Instanz des HafasService.
     * Der Client wird erst durch Aufruf von `init()` erstellt.
     *
     * @param clientName Name, der an den Client übergeben wird
     * @param profileName Name des HAFAS-Profils ('vbb', 'db', etc.)
     */
    constructor(clientName: string, profileName: string) {
        this.clientName = clientName;
        this.profileName = profileName;
    }

    /**
     * Initialisiert den HAFAS-Client.
     * Muss vor der Nutzung der anderen Methoden aufgerufen werden.
     *
     * @returns true bei Erfolg, false bei Fehler
     */
    public init(): boolean {
        try {
            const profile = this.resolveProfile(this.profileName);
            this.client = hafasClient(profile, this.clientName);
            return true;
        } catch (error) {
            throw new Error(`HAFAS-Client konnte nicht initialisiert werden: ${(error as Error).message}`);
        }
    }

    /**
     * Prüft ob der Client initialisiert wurde.
     */
    public isInitialized(): boolean {
        return this.client !== null;
    }

    /**
     * Gibt den initialisierten Client zurück oder wirft einen Fehler.
     */
    private getClient(): ReturnType<typeof hafasClient> {
        if (!this.client) {
            throw new Error('HafasService wurde noch nicht initialisiert. Bitte zuerst init() aufrufen.');
        }
        return this.client;
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
            default: {
                throw new Error(`Unbekanntes Profile: ${String(profile)}. Verfügbare Profile: 'vbb'.`);
            }
        }
    }

    /**
     * Suche nach Orten/Stationen.
     *
     * @param query Suchbegriff für Orte/Stationen
     * @param options optionale Suchoptionen
     * @returns Promise mit Suchergebnissen (typisiert als any)
     */
    async getLocations(
        query: string,
        options?: Hafas.LocationsOptions,
    ): Promise<ReadonlyArray<Hafas.Station | Hafas.Stop | Hafas.Location>> {
        return this.getClient().locations(query, options);
    }

    /**
     * Liefert Abfahrten für eine gegebene Stations-ID.
     *
     * @param stationId ID der Station
     * @param options optionale Abfrage-Optionen
     * @returns Promise mit Abfahrtsinformationen (typisiert als any)
     */
    async getDepartures(stationId: string, options?: Hafas.DeparturesArrivalsOptions): Promise<Hafas.Departures> {
        return this.getClient().departures(stationId, options);
    }

    /**
     * Liefert Routeninformationen zwischen zwei Stationen.
     *
     * @param fromId ID der Startstation
     * @param toId ID der Zielstation
     * @param options optionale Routen-Optionen
     * @returns Promise mit Routeninformationen (typisiert als any)
     */
    async getRoute(fromId: string, toId: string, options?: Hafas.JourneysOptions): Promise<Hafas.Journeys> {
        return this.getClient().journeys(fromId, toId, options);
    }

    /**
     * Holt Details zu einer Station/einem Haltpunkt.
     *
     * @param stationId ID der Station/des Haltpunkts
     * @param options optionale Abfrageoptionen
     * @returns Promise mit Stations-/Haltpunktdetails
     */
    async getStop(
        stationId: string,
        options?: Hafas.StopOptions,
    ): Promise<Hafas.Station | Hafas.Stop | Hafas.Location> {
        return this.getClient().stop(stationId, options);
    }
}

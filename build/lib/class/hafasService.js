"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var hafasService_exports = {};
__export(hafasService_exports, {
  HafasService: () => HafasService
});
module.exports = __toCommonJS(hafasService_exports);
var import_hafas_client = require("hafas-client");
var import_vbb = require("hafas-client/p/vbb/index.js");
class HafasService {
  client = null;
  clientName;
  profileName;
  /**
   * Erzeugt eine neue Instanz des HafasService.
   * Der Client wird erst durch Aufruf von `init()` erstellt.
   *
   * @param clientName Name, der an den Client übergeben wird
   * @param profileName Name des HAFAS-Profils ('vbb', 'db', etc.)
   */
  constructor(clientName, profileName) {
    this.clientName = clientName;
    this.profileName = profileName;
  }
  /**
   * Initialisiert den HAFAS-Client.
   * Muss vor der Nutzung der anderen Methoden aufgerufen werden.
   *
   * @returns true bei Erfolg, false bei Fehler
   */
  init() {
    try {
      const profile = this.resolveProfile(this.profileName);
      this.client = (0, import_hafas_client.createClient)(profile, this.clientName);
      return true;
    } catch (error) {
      throw new Error(`HAFAS-Client konnte nicht initialisiert werden: ${error.message}`);
    }
  }
  /**
   * Prüft ob der Client initialisiert wurde.
   */
  isInitialized() {
    return this.client !== null;
  }
  /**
   * Gibt den initialisierten Client zurück oder wirft einen Fehler.
   */
  getClient() {
    if (!this.client) {
      throw new Error("HafasService wurde noch nicht initialisiert. Bitte zuerst init() aufrufen.");
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
  resolveProfile(profile) {
    if (!profile) {
      return import_vbb.profile;
    }
    switch (profile) {
      case "vbb": {
        return import_vbb.profile;
      }
      default: {
        throw new Error(`Unbekanntes Profile: ${String(profile)}. Verf\xFCgbare Profile: 'vbb'.`);
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
  async getLocations(query, options) {
    return this.getClient().locations(query, options);
  }
  /**
   * Liefert Abfahrten für eine gegebene Stations-ID.
   *
   * @param stationId ID der Station
   * @param options optionale Abfrage-Optionen
   * @returns Promise mit Abfahrtsinformationen (typisiert als any)
   */
  async getDepartures(stationId, options) {
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
  async getRoute(fromId, toId, options) {
    return this.getClient().journeys(fromId, toId, options);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HafasService
});
//# sourceMappingURL=hafasService.js.map

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
var import_db = require("hafas-client/p/db/index.js");
var import_vbb = require("hafas-client/p/vbb/index.js");
class HafasService {
  client;
  /**
   * Erzeugt eine neue Instanz des HafasService.
   * Standardmäßig wird das VBB-Profil verwendet. Optional kann ein alternatives
   * Profil als zweiten Parameter übergeben werden (für Tests oder andere Netze).
   *
   * @param clientName optionaler Name, der an den Client übergeben wird
   * @param profile optionales HAFAS-Profil; falls nicht angegeben, wird vbbProfile genutzt
   */
  constructor(clientName, profile) {
    const usedProfile = this.resolveProfile(profile);
    this.client = (0, import_hafas_client.createClient)(usedProfile, clientName);
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
      case "db": {
        return import_db.profile;
      }
      default: {
        throw new Error(
          `Unbekanntes Profile: ${String(
            profile
          )}. Nutze entweder ein Profil-Objekt oder einen Namen aus ProfileName.`
        );
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
    return this.client.locations(query, options);
  }
  /**
   * Liefert Abfahrten für eine gegebene Stations-ID.
   *
   * @param stationId ID der Station
   * @param options optionale Abfrage-Optionen
   * @returns Promise mit Abfahrtsinformationen (typisiert als any)
   */
  async getDepartures(stationId, options) {
    return this.client.departures(stationId, options);
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
    return this.client.journeys(fromId, toId, options);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HafasService
});
//# sourceMappingURL=hafasService.js.map

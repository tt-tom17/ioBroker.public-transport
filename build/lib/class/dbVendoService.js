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
var dbVendoService_exports = {};
__export(dbVendoService_exports, {
  VendoService: () => VendoService
});
module.exports = __toCommonJS(dbVendoService_exports);
var import_db_vendo_client = require("db-vendo-client");
var import_dbnav = require("db-vendo-client/p/dbnav/index.js");
class VendoService {
  navClient = null;
  clientName;
  /**
   * Erzeugt eine neue Instanz des VendoService.
   * Der Client wird erst durch Aufruf von `init()` erstellt.
   *
   * @param clientName Name, der an den Client übergeben wird
   */
  constructor(clientName) {
    this.clientName = clientName;
  }
  /**
   * Initialisiert den db-vendo-Client.
   * Muss vor der Nutzung der anderen Methoden aufgerufen werden.
   *
   * @returns true bei Erfolg, false bei Fehler
   */
  init() {
    try {
      this.navClient = (0, import_db_vendo_client.createClient)(import_dbnav.profile, this.clientName);
      return true;
    } catch (error) {
      throw new Error(`db-vendo-Client konnte nicht initialisiert werden: ${error.message}`);
    }
  }
  /**
   * Prüft ob der Client initialisiert wurde.
   */
  isInitialized() {
    return this.navClient !== null;
  }
  /**
   * Gibt den initialisierten Client zurück oder wirft einen Fehler.
   */
  getNavClient() {
    if (!this.navClient) {
      throw new Error("VendoService wurde noch nicht initialisiert. Bitte zuerst init() aufrufen.");
    }
    return this.navClient;
  }
  /**
   * Suche nach Orten/Stationen.
   *
   * @param query Suchbegriff für Orte/Stationen
   * @param options optionale Suchoptionen
   * @returns Promise mit Suchergebnissen (typisiert als Array von Station, Stop oder Location)
   */
  async getLocations(query, options) {
    return this.getNavClient().locations(query, options);
  }
  /**
   * Holt Abfahrten für eine gegebene Station.
   *
   * @param stationId ID der Station
   * @param options optionale Abfrageoptionen
   * @returns Promise mit Abfahrten
   */
  async getDepartures(stationId, options) {
    return this.getNavClient().departures(stationId, options);
  }
  /**
   * Holt Routen zwischen zwei Stationen.
   *
   * @param fromId ID der Startstation
   * @param toId ID der Zielstation
   * @param options optionale Routenoptionen
   * @returns Promise mit Routen
   */
  async getJourneys(fromId, toId, options) {
    return this.getNavClient().journeys(fromId, toId, options);
  }
  /**
   * Holt Details zu einer Station/einem Haltpunkt.
   *
   * @param stationId ID der Station/des Haltpunkts
   * @param options optionale Abfrageoptionen
   * @returns Promise mit Stations-/Haltpunktdetails
   */
  async getStop(stationId, options) {
    return this.getNavClient().stop(stationId, options);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VendoService
});
//# sourceMappingURL=dbVendoService.js.map

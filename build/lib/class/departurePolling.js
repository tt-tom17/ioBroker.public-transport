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
var departurePolling_exports = {};
__export(departurePolling_exports, {
  DeparturePolling: () => DeparturePolling
});
module.exports = __toCommonJS(departurePolling_exports);
var import_library = require("../tools/library");
var import_pollingManager = require("./pollingManager");
class DeparturePolling extends import_pollingManager.PollingManager {
  constructor(adapter) {
    super(adapter);
    this.log.setLogPrefix("depPoll");
  }
  /**
   * Setzt die States von deaktivierten Stationen auf Standardwerte zurück.
   *
   * @param configs Alle Station-Konfigurationen
   */
  async handleDisabledConfigs(configs) {
    if (!configs || configs.length === 0) {
      return;
    }
    const disabledConfigs = configs.filter((config) => config.enabled === false);
    for (const config of disabledConfigs) {
      if (!config.id) {
        continue;
      }
      this.log.debug(
        `Reset states for deactivated station: ${config.customName || config.name || ""} (${config.id})`
      );
      await this.adapter.library.garbageColleting(
        `Stations.${config.id}.`,
        2e3,
        // offset = 0 bedeutet: alle States sofort zurücksetzen
        false
        // del = false: States zurücksetzen, nicht löschen
      );
    }
  }
  /**
   * Erstellt die Optionen für eine Abfahrtsanfrage.
   *
   * @param config Die Station-Konfiguration
   * @returns Die Optionen für die Abfrage
   */
  createDepartureOptions(config) {
    var _a, _b, _c;
    const offsetTime = (_a = config.offsetTime) != null ? _a : 0;
    const when = offsetTime === 0 ? /* @__PURE__ */ new Date() : new Date(Date.now() + offsetTime * 60 * 1e3);
    const duration = (_b = config.duration) != null ? _b : 60;
    const results = (_c = config.numDepartures) != null ? _c : 10;
    const products = config.products ? Object.fromEntries(Object.entries(config.products).map(([k, v]) => [(0, import_library.camelToKebab)(k), v])) : void 0;
    return { results, when, duration, products };
  }
  /**
   * Führt die Abfrage für eine Station durch.
   *
   * @param config Die Station-Konfiguration
   * @param service Der Transport-Service
   * @returns true wenn erfolgreich, false sonst
   */
  async queryConfig(config, service) {
    var _a, _b, _c;
    const options = this.createDepartureOptions(config);
    const products = (_a = config.products) != null ? _a : void 0;
    const countEntries = (_b = config.numDepartures) != null ? _b : 10;
    const client_profile = (_c = config.client_profile) != null ? _c : void 0;
    this.log.debug(`QueryConfig parameters:
             id: ${config.id},
             service: ${JSON.stringify(service)},
             option: ${JSON.stringify(options)},
             countEntries: ${countEntries},
             products: ${JSON.stringify(products)},
             client_profil: ${client_profile}`);
    try {
      return await this.adapter.depRequest.getDepartures(
        config.id,
        service,
        options,
        countEntries,
        products,
        client_profile
      );
    } catch (error) {
      this.log.error(`Error querying departures "${config.customName || ""}": ${error.message}`);
      return false;
    }
  }
  /**
   * Startet das Polling für Abfahrten.
   *
   * @param pollIntervalMinutes Das Polling-Intervall in Minuten
   */
  async startDepartures(pollIntervalMinutes) {
    await this.start(this.adapter.config.stationConfig, pollIntervalMinutes, {
      noConfig: "No stations found in configuration. Please configure in Admin UI.",
      noEnabled: "No enabled stations found. Please enable at least one station.",
      count: (n) => `${n} active station(s) found:`,
      entry: (name, id) => `  - ${name} (ID: ${id})`,
      fetching: (name, id) => `Fetching departures for: ${name} (${id})`,
      updated: (name, id) => `Departures updated for: ${name} (${id})`,
      failed: (name, id) => `Departures could not be updated for: ${name} (${id})`,
      firstCompleted: (s, f) => `First query completed: ${s} successful, ${f} failed`,
      queryCompleted: (s, f) => `Query completed: ${s} successful, ${f} failed`,
      waiting: (m) => `Waiting for next query in ${m} minutes...`
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DeparturePolling
});
//# sourceMappingURL=departurePolling.js.map

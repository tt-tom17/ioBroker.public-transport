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
var journeyPolling_exports = {};
__export(journeyPolling_exports, {
  JourneyPolling: () => JourneyPolling
});
module.exports = __toCommonJS(journeyPolling_exports);
var import_library = require("../tools/library");
var import_pollingManager = require("./pollingManager");
class JourneyPolling extends import_pollingManager.PollingManager {
  constructor(adapter) {
    super(adapter);
    this.log.setLogPrefix("journeyPoll");
  }
  /**
   * Setzt die States von deaktivierten Journeys auf Standardwerte zurück.
   *
   * @param configs Alle Journey-Konfigurationen
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
      this.log.debug(`Reset states for deactivated journey: ${config.customName || ""} (${config.id})`);
      await this.adapter.library.garbageColleting(
        `Journeys.${config.id}.`,
        2e3,
        // offset = 0 bedeutet: alle States sofort zurücksetzen
        false
        // del = false: States zurücksetzen, nicht löschen
      );
    }
  }
  /**
   * Erstellt die Optionen für eine Journey-Anfrage.
   *
   * @param config Die Journey-Konfiguration
   * @returns Die Optionen für die Abfrage
   */
  createJourneyOptions(config) {
    var _a, _b;
    const options = {
      results: (_a = config.numResults) != null ? _a : 5,
      stopovers: (_b = config.stopovers) != null ? _b : false
    };
    if (config.departure) {
      options.departure = new Date(config.departure);
    }
    if (config.arrival) {
      options.arrival = new Date(config.arrival);
    }
    if (config.via) {
      options.via = config.via;
    }
    if (config.transfers !== void 0) {
      options.transfers = config.transfers;
    }
    if (config.transferTime !== void 0) {
      options.transferTime = config.transferTime;
    }
    if (config.accessibility) {
      options.accessibility = config.accessibility;
    }
    if (config.bike !== void 0) {
      options.bike = config.bike;
    }
    if (config.products) {
      options.products = Object.fromEntries(
        Object.entries(config.products).map(([k, v]) => [(0, import_library.camelToKebab)(k), v])
      );
    }
    return options;
  }
  /**
   * Loggt die gefundenen Journey-Konfigurationen mit den korrekten Parametern.
   *
   * @param configs Die Journey-Konfigurationen
   * @param countMsg Der Übersetzungsschlüssel für die Anzahl
   * @param _entryMsg Der Übersetzungsschlüssel für jeden Eintrag
   */
  logConfigs(configs, countMsg, _entryMsg) {
    this.log.info(countMsg(configs.length));
    for (const config of configs) {
      this.log.info2(
        `  - ${config.customName || ""} (From: ${config.fromStationName || config.fromStationId || ""}, To: ${config.toStationName || config.toStationId || ""})`
      );
    }
  }
  /**
   * Führt die Abfrage für eine Journey durch.
   *
   * @param config Die Journey-Konfiguration
   * @param service Der Transport-Service
   * @returns true wenn erfolgreich, false sonst
   */
  async queryConfig(config, service) {
    var _a, _b, _c, _d;
    if (!config.fromStationId || !config.toStationId) {
      this.log.warn("No start or destination station provided");
      return false;
    }
    const options = this.createJourneyOptions(config);
    const products = config.products ? Object.fromEntries(Object.entries(config.products).map(([k, v]) => [(0, import_library.camelToKebab)(k), v])) : void 0;
    const countEntries = (_a = config.numResults) != null ? _a : 5;
    const client_profile = (_b = config.client_profile) != null ? _b : void 0;
    this.log.debug(`Journey query parameters:
             id: ${config.id},
             fromId: ${config.fromStationId},
             toId: ${config.toStationId},
             service: ${(_d = (_c = service.constructor) == null ? void 0 : _c.name) != null ? _d : "unknown"},
             option: ${JSON.stringify(options)},
             countEntires: ${countEntries},
             products: ${JSON.stringify(products)},
             client_profil: ${client_profile}`);
    try {
      return await this.adapter.journeysRequest.getJourneys(
        config.id,
        config.fromStationId,
        config.toStationId,
        service,
        options,
        countEntries,
        products,
        client_profile
      );
    } catch (error) {
      this.log.error(`Error querying journey "${config.customName || ""}": ${error.message}`);
      return false;
    }
  }
  /**
   * Startet das Polling für Journeys.
   *
   * @param pollIntervalMinutes Das Polling-Intervall in Minuten
   */
  async startJourneys(pollIntervalMinutes) {
    await this.start(this.adapter.config.journeyConfig, pollIntervalMinutes, {
      noConfig: "No journeys found in configuration. Please configure in Admin UI.",
      noEnabled: "No enabled journeys found. Please enable at least one journey.",
      count: (n) => `${n} active journey(s) found:`,
      entry: (name, id) => `  - ${name} (ID: ${id})`,
      fetching: (name, id) => `Fetching journeys for: ${name} (${id})`,
      updated: (name, id) => `Journeys updated for: ${name} (${id})`,
      failed: (name, id) => `Journeys could not be updated for: ${name} (${id})`,
      firstCompleted: (s, f) => `First journey query completed: ${s} successful, ${f} failed`,
      queryCompleted: (s, f) => `Journey query completed: ${s} successful, ${f} failed`,
      waiting: (m) => `Waiting for next journey query in ${m} minutes...`
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  JourneyPolling
});
//# sourceMappingURL=journeyPolling.js.map

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
var import_pollingManager = require("./pollingManager");
class JourneyPolling extends import_pollingManager.PollingManager {
  constructor(adapter) {
    super(adapter);
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
      options.products = config.products;
    }
    return options;
  }
  /**
   * Loggt die gefundenen Journey-Konfigurationen mit den korrekten Parametern.
   *
   * @param configs Die Journey-Konfigurationen
   * @param countMsg Der Übersetzungsschlüssel für die Anzahl
   * @param entryMsg Der Übersetzungsschlüssel für jeden Eintrag
   */
  logConfigs(configs, countMsg, entryMsg) {
    this.adapter.log.info(this.adapter.library.translate(countMsg, configs.length));
    for (const config of configs) {
      this.adapter.log.info(
        this.adapter.library.translate(
          entryMsg,
          config.customName || "",
          config.fromStationName || config.fromStationId || "",
          config.toStationName || config.toStationId || ""
        )
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
    if (!config.fromStationId || !config.toStationId) {
      this.adapter.log.warn(this.adapter.library.translate("msg_journeyNoFromTo", config.customName || ""));
      return false;
    }
    const options = this.createJourneyOptions(config);
    try {
      return await this.adapter.journeysRequest.getJourneys(
        config.id,
        config.fromStationId,
        config.toStationId,
        service,
        options
      );
    } catch (error) {
      this.adapter.log.error(
        this.adapter.library.translate(
          "msg_journeyQueryFailed",
          config.customName || "",
          error.message
        )
      );
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
      noConfig: "msg_noJourneysConfigured",
      noEnabled: "msg_noEnabledJourneys",
      count: "msg_activeJourneysFound",
      entry: "msg_journeyListEntry",
      fetching: "msg_fetchingJourneys",
      updated: "msg_journeysUpdated",
      failed: "msg_journeysUpdateFailed",
      firstCompleted: "msg_firstJourneyQueryCompleted",
      queryCompleted: "msg_journeyQueryCompleted",
      waiting: "msg_waitingForNextJourneyQuery"
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  JourneyPolling
});
//# sourceMappingURL=journeyPolling.js.map

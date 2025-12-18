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
var import_pollingManager = require("./pollingManager");
class DeparturePolling extends import_pollingManager.PollingManager {
  constructor(adapter) {
    super(adapter);
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
    const when = offsetTime === 0 ? void 0 : new Date(Date.now() + offsetTime * 60 * 1e3);
    const duration = (_b = config.duration) != null ? _b : 10;
    const results = (_c = config.numDepartures) != null ? _c : 10;
    return { results, when, duration };
  }
  /**
   * Führt die Abfrage für eine Station durch.
   *
   * @param config Die Station-Konfiguration
   * @param service Der Transport-Service
   * @returns true wenn erfolgreich, false sonst
   */
  async queryConfig(config, service) {
    var _a;
    const options = this.createDepartureOptions(config);
    const products = (_a = config.products) != null ? _a : void 0;
    return await this.adapter.depRequest.getDepartures(config.id, service, options, products);
  }
  /**
   * Startet das Polling für Abfahrten.
   *
   * @param pollIntervalMinutes Das Polling-Intervall in Minuten
   */
  async startDepartures(pollIntervalMinutes) {
    await this.start(this.adapter.config.stationConfig, pollIntervalMinutes, {
      noConfig: "msg_noStationsConfigured",
      noEnabled: "msg_noEnabledStations",
      count: "msg_activeStationsFound",
      entry: "msg_stationListEntry",
      fetching: "msg_fetchingDepartures",
      updated: "msg_departuresUpdated",
      failed: "msg_departuresUpdateFailed",
      firstCompleted: "msg_firstQueryCompleted",
      queryCompleted: "msg_queryCompleted",
      waiting: "msg_waitingForNextQuery"
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DeparturePolling
});
//# sourceMappingURL=departurePolling.js.map

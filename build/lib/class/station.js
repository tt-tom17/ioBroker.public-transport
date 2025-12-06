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
var station_exports = {};
__export(station_exports, {
  StationRequest: () => StationRequest
});
module.exports = __toCommonJS(station_exports);
var import_definition = require("../const/definition");
var import_library = require("../tools/library");
class StationRequest extends import_library.BaseClass {
  constructor(adapter) {
    super(adapter);
    this.log.setLogPrefix("station");
  }
  async getStop(stationId, service, options) {
    try {
      if (!stationId) {
        throw new Error("Keine stationId \xFCbergeben");
      }
      if (!service) {
        throw new Error("Kein Service \xFCbergeben");
      }
      const stop = await service.getStop(stationId, options);
      this.adapter.log.debug(JSON.stringify(stop, null, 1));
      await this.library.writeFromJson(
        `${this.adapter.namespace}.Stations.${stationId}`,
        "station",
        import_definition.genericStateObjects,
        stop,
        true
      );
      return stop;
    } catch (err) {
      this.log.error(`Fehler bei der Abfrage der Station ${stationId}: ${err.message}`);
      throw err;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StationRequest
});
//# sourceMappingURL=station.js.map

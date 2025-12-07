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
var import_mapper = require("../tools/mapper");
class StationRequest extends import_library.BaseClass {
  constructor(adapter) {
    super(adapter);
    this.log.setLogPrefix("stationReq");
  }
  async getStation(stationId, service, options) {
    try {
      if (!stationId) {
        throw new Error("Keine stationId \xFCbergeben");
      }
      if (!service) {
        throw new Error("Kein Service \xFCbergeben");
      }
      const station = await service.getStop(stationId, options);
      this.adapter.log.debug(JSON.stringify(station, null, 1));
      return station;
    } catch (err) {
      this.log.error(`Fehler bei der Abfrage der Station ${stationId}: ${err.message}`);
      throw err;
    }
  }
  async writeStationData(stationData) {
    try {
      await this.library.writedp(
        `${this.adapter.namespace}.Stations.${stationData.id}.info.json`,
        JSON.stringify(stationData),
        {
          _id: "nicht_definieren",
          type: "state",
          common: {
            name: "raw station data",
            type: "string",
            role: "json",
            read: true,
            write: false
          },
          native: {}
        }
      );
      const stationState = (0, import_mapper.mapStationToStationState)(stationData);
      await this.library.garbageColleting(`${this.adapter.namespace}.Stations.${stationData.id}.info.`, 2e3);
      await this.library.writeFromJson(
        `${this.adapter.namespace}.Stations.${stationData.id}.info`,
        "station",
        import_definition.genericStateObjects,
        stationState,
        true
      );
    } catch (err) {
      this.log.error(`Fehler beim Schreiben der Station-Daten: ${err.message}`);
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StationRequest
});
//# sourceMappingURL=station.js.map

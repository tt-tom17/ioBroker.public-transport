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
var import_clientProfile = require("../tools/clientProfile");
var import_library = require("../tools/library");
var import_mapper = require("../tools/mapper");
class StationRequest extends import_library.BaseClass {
  constructor(adapter) {
    super(adapter);
    this.log.setLogPrefix("stationReq");
  }
  isStation(station) {
    return station.type === "station";
  }
  /**
   * Ruft Informationen einer Station anhand der stationId ab.
   *
   * @param stationId     Die ID der Station.
   * @param service       Der Service für die Abfrage.
   * @param options       Zusätzliche Optionen für die Abfrage.
   * @param client_profile Das Client-Profil für die Abfrage (z.B. "hafas:vbb", "vendo:db")
   * @returns             Die Informationen der Station oder Haltestelle.
   */
  async getStation(stationId, service, options, client_profile) {
    try {
      if (!stationId) {
        throw new Error("No stationId provided");
      }
      if (!service) {
        throw new Error("No service provided");
      }
      (0, import_clientProfile.validateClientProfile)(this.adapter.config.serviceType, this.adapter.config.profile, client_profile);
      const station = await service.getStop(stationId, options);
      if (this.adapter.config.logCompletelyJSON) {
        this.log.debug(JSON.stringify(station, null, 1));
      }
      return station;
    } catch (err) {
      this.log.error(`Error querying stations. Error message: ${stationId}: ${err.message}`);
      throw err;
    }
  }
  /**
   * Schreibt die Stationsdaten in die States.
   *
   * @param basePath      Der Basis-Pfad für die States.
   * @param stationData   Die Daten der Station oder Haltestelle.
   */
  async writeStationData(basePath, stationData) {
    try {
      await this.library.writedp(`${basePath}.json`, JSON.stringify(stationData), {
        _id: "nicht_definieren",
        type: "state",
        common: {
          name: "raw_station_data",
          type: "string",
          role: "json",
          read: true,
          write: false
        },
        native: {}
      });
      if (this.isStation(stationData)) {
        const stationState = (0, import_mapper.mapStationToStationState)(stationData);
        await this.library.writeFromJson(`${basePath}`, "station", import_definition.genericStateObjects, stationState, true);
      } else {
        const stopState = (0, import_mapper.mapStopToStopState)(stationData);
        await this.library.writeFromJson(`${basePath}`, "station.stops", import_definition.genericStateObjects, stopState, true);
      }
      await this.library.garbageColleting(`${basePath}.`, 2e3);
    } catch (err) {
      this.log.error(`Error writing station data: ${err.message}`);
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StationRequest
});
//# sourceMappingURL=station.js.map

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
  client;
  constructor(clientName) {
    this.client = (0, import_db_vendo_client.createClient)(import_dbnav.profile, clientName);
  }
  async getLocations(query, options) {
    return this.client.locations(query, options);
  }
  async getDepartures(stationId, options) {
    return this.client.departures(stationId, options);
  }
  async getRoute(fromId, toId, options) {
    return this.client.journeys(fromId, toId, options);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VendoService
});
//# sourceMappingURL=dbVendoService.js.map

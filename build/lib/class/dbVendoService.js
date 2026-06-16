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
var import_db = require("db-vendo-client/p/db/index.js");
var import_throttle = require("db-vendo-client/throttle.js");
var import_baseTransportService = require("./baseTransportService");
class VendoService extends import_baseTransportService.BaseTransportService {
  get serviceName() {
    return "db-vendo";
  }
  createClient() {
    this.setProfileProducts(import_db.profile);
    return (0, import_db_vendo_client.createClient)((0, import_throttle.withThrottling)(import_db.profile), this.clientName);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VendoService
});
//# sourceMappingURL=dbVendoService.js.map

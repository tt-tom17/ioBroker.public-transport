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
var motisService_exports = {};
__export(motisService_exports, {
  MotisService: () => MotisService
});
module.exports = __toCommonJS(motisService_exports);
var import_motis_fptf_client = require("@motis-project/motis-fptf-client");
var import_compat = require("@motis-project/motis-fptf-client/p/compat/index.js");
var import_throttle = require("@motis-project/motis-fptf-client/throttle.js");
var import_baseTransportService = require("./baseTransportService");
class MotisService extends import_baseTransportService.BaseTransportService {
  get serviceName() {
    return "MOTIS";
  }
  createClient() {
    const profile = { ...import_compat.profile, enrichStations: false };
    return (0, import_motis_fptf_client.createClient)((0, import_throttle.withThrottling)(profile), this.clientName);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MotisService
});
//# sourceMappingURL=motisService.js.map

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
var hafasService_exports = {};
__export(hafasService_exports, {
  HafasService: () => HafasService
});
module.exports = __toCommonJS(hafasService_exports);
var import_hafas_client = require("hafas-client");
var import_oebb = require("hafas-client/p/oebb/index.js");
var import_vbb = require("hafas-client/p/vbb/index.js");
var import_vbn = require("hafas-client/p/vbn/index.js");
var import_throttle = require("hafas-client/throttle.js");
var import_baseTransportService = require("./baseTransportService");
class HafasService extends import_baseTransportService.BaseTransportService {
  profileName;
  /**
   * Erzeugt eine neue Instanz des HafasService.
   * Der Client wird erst durch Aufruf von `init()` erstellt.
   *
   * @param adapter Die Adapter-Instanz (für die ioBroker-Timer)
   * @param clientName Name, der an den Client übergeben wird
   * @param profileName Name des HAFAS-Profils ('vbb', 'oebb', 'vbn')
   */
  constructor(adapter, clientName, profileName) {
    super(adapter, clientName);
    this.profileName = profileName;
  }
  get serviceName() {
    return "HAFAS";
  }
  createClient() {
    return (0, import_hafas_client.createClient)((0, import_throttle.withThrottling)(this.resolveProfile(this.profileName)), this.clientName);
  }
  /**
   * Resolve a profile given either a ProfileName or a profile object.
   * Falls `profile` leer ist, wird `vbbProfile` verwendet.
   *
   * @param profile entweder ein Eintrag aus `ProfileName` oder ein Profil-Objekt
   * @returns das aufgelöste Profil-Objekt
   */
  resolveProfile(profile) {
    if (!profile) {
      return import_vbb.profile;
    }
    switch (profile) {
      case "vbb": {
        return import_vbb.profile;
      }
      case "oebb": {
        return import_oebb.profile;
      }
      case "vbn": {
        return import_vbn.profile;
      }
      default: {
        throw new Error(`unknown profile: ${String(profile)}. available profiles: 'vbb', 'oebb', 'vbn'.`);
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HafasService
});
//# sourceMappingURL=hafasService.js.map

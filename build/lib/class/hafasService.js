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
var import_rmv = require("hafas-client/p/rmv/index.js");
var import_vbb = require("hafas-client/p/vbb/index.js");
var import_vbn = require("hafas-client/p/vbn/index.js");
var import_vmt = require("hafas-client/p/vmt/index.js");
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
   * @param profileName Name des HAFAS-Profils ('vbb', 'oebb', 'vbn', 'rmv', 'vmt')
   */
  constructor(adapter, clientName, profileName) {
    super(adapter, clientName);
    this.profileName = profileName;
  }
  get serviceName() {
    return "HAFAS";
  }
  createClient() {
    const profile = this.forceIdentityEncoding(this.resolveProfile(this.profileName));
    this.setProfileProducts(profile);
    return (0, import_hafas_client.createClient)((0, import_throttle.withThrottling)(profile), this.clientName);
  }
  /**
   * Erzwingt `Accept-Encoding: identity` (keine Kompression) für alle Requests des Profils.
   *
   * Hintergrund: Die HAFAS-`mgate.exe`-Endpoints (u.a. vbb/fahrinfo.vbb.de und oebb/fahrplan.oebb.at)
   * senden gzip-Antworten ohne `Content-Length`. Daran verschluckt sich `node-fetch` v2 – die
   * fetch-Schicht von `hafas-client` (via `cross-fetch`) – beim Entpacken und bricht mit
   * `ERR_STREAM_PREMATURE_CLOSE` ("Premature close") ab. Das ist KEIN transienter Netzwerkfehler,
   * sondern tritt systematisch auf; ein Retry hilft nicht. Ohne Kompression liefern die Server saubere
   * Antworten; der Mehr-Traffic ist bei den Poll-Intervallen vernachlässigbar.
   *
   * @param profile Das aufgelöste HAFAS-Profil
   * @returns Eine Profil-Kopie mit überschriebenem `transformReq`-Hook
   */
  forceIdentityEncoding(profile) {
    const p = profile;
    const origTransformReq = p.transformReq;
    return {
      ...p,
      transformReq(ctx, req) {
        const r = origTransformReq ? origTransformReq(ctx, req) : req;
        r.headers = { ...r.headers, "Accept-Encoding": "identity" };
        return r;
      }
    };
  }
  /**
   * Löst einen Profilnamen ('vbb', 'oebb', 'vbn', 'rmv', 'vmt') in das zugehörige HAFAS-Profil auf.
   * Fail-fast: Ist kein Profil konfiguriert oder unbekannt, wird geworfen – der Adapter
   * startet bewusst NICHT mit einem stillschweigenden Default (z.B. vbb/Berlin für jemanden,
   * der ein anderes Verkehrsgebiet möchte). Die Fehler werden in main.ts geloggt.
   *
   * @param profile Profilname aus der Adapter-Konfiguration
   * @returns das aufgelöste Profil-Objekt
   */
  resolveProfile(profile) {
    if (!profile) {
      throw new Error(
        `No HAFAS profile configured. Please select a profile ('vbb', 'oebb', 'vbn', 'rmv' or 'vmt') in the adapter settings.`
      );
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
      case "rmv": {
        return import_rmv.profile;
      }
      case "vmt": {
        return import_vmt.profile;
      }
      default: {
        throw new Error(
          `unknown profile: ${String(profile)}. available profiles: 'vbb', 'oebb', 'vbn', 'rmv', 'vmt'.`
        );
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HafasService
});
//# sourceMappingURL=hafasService.js.map

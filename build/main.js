"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var main_exports = {};
__export(main_exports, {
  TTAdapter: () => TTAdapter
});
module.exports = __toCommonJS(main_exports);
var utils = __toESM(require("@iobroker/adapter-core"));
var import_depReq = require("./lib/class/depReq");
var import_hafasService = require("./lib/hafasService");
var import_library = require("./lib/tools/library");
class TTAdapter extends utils.Adapter {
  library;
  unload = false;
  hService;
  depRequest;
  //vClient: ReturnType<typeof dbVendorClient>;
  pollIntervall;
  constructor(options = {}) {
    super({
      ...options,
      name: "tt-adapter",
      useFormatDate: true
    });
    this.library = new import_library.Library(this);
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("message", this.onMessage.bind(this));
    this.on("unload", this.onUnload.bind(this));
    const profileName = this.config.hafasProfile;
    const clientName = this.config.clientName || "iobroker-tt-adapter";
    this.hService = new import_hafasService.HafasService(clientName, profileName);
    this.depRequest = new import_depReq.DepartureRequest(this);
  }
  getHafasService() {
    if (!this.hService) {
      throw new Error("HafasService wurde noch nicht initialisiert");
    }
    return this.hService;
  }
  /**
   * Is called when databases are connected and adapter received configuration.
   */
  async onReady() {
    await this.library.init();
    const states = await this.getStatesAsync("*");
    await this.library.initStates(states);
    try {
      if (this.getHafasService()) {
        this.log.info("Rufe hService.getLocations auf");
        const ort = await this.hService.getLocations("zepernick", { results: 2 });
        this.log.info(`Gefundene Orte: ${JSON.stringify(ort, null, 1)}`);
        this.log.info("Rufe depRequest.getDepartures auf");
        this.pollIntervall = this.setInterval(async () => {
          await this.depRequest.getDepartures(String(ort[0].id));
          this.log.info("Abfahrten aktualisiert");
        }, 6e4);
      }
    } catch (err) {
      this.log.error(`HAFAS Anfrage fehlgeschlagen: ${err.message}`);
    }
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   *
   * @param callback Function to be called when unload is complete
   */
  onUnload(callback) {
    try {
      if (this.pollIntervall) {
        clearInterval(this.pollIntervall);
      }
      callback();
    } catch {
      callback();
    }
  }
  // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
  // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
  // /**
  //  * Is called if a subscribed object changes
  //  */
  // private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
  // 	if (obj) {
  // 		// The object was changed
  // 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
  // 	} else {
  // 		// The object was deleted
  // 		this.log.info(`object ${id} deleted`);
  // 	}
  // }
  /**
   * Is called if a subscribed state changes
   *
   * @param id The id of the state that changed
   * @param state The new state object or null/undefined if deleted
   */
  onStateChange(id, state) {
    if (state) {
      this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
    } else {
      this.log.info(`state ${id} deleted`);
    }
  }
  /**
   * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
   * Using this method requires "common.messagebox" property to be set to true in io-package.json
   *
   *  @param obj iobroker.message
   */
  async onMessage(obj) {
    if (typeof obj === "object" && obj.message) {
      if (obj.command === "location") {
        try {
          const message = obj.message;
          const query = message.query;
          if (!query || query.length < 2) {
            if (obj.callback) {
              this.sendTo(obj.from, obj.command, { error: "Query zu kurz" }, obj.callback);
            }
            return;
          }
          const results = await this.hService.getLocations(query, { results: 20 });
          const stations = results.map((location) => ({
            id: location.id,
            name: location.name,
            type: location.type,
            location: location.location ? {
              latitude: location.location.latitude,
              longitude: location.location.longitude
            } : void 0
          }));
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, stations, obj.callback);
          }
        } catch (error) {
          this.log.error(`HAFAS location search failed: ${error.message}`);
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: error.message }, obj.callback);
          }
        }
      }
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new TTAdapter(options);
} else {
  (() => new TTAdapter())();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TTAdapter
});
//# sourceMappingURL=main.js.map

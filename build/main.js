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
var import_dbVendoService = require("./lib/class/dbVendoService");
var import_departure = require("./lib/class/departure");
var import_departurePolling = require("./lib/class/departurePolling");
var import_hafasService = require("./lib/class/hafasService");
var import_journeyPolling = require("./lib/class/journeyPolling");
var import_journeys = require("./lib/class/journeys");
var import_station = require("./lib/class/station");
var import_library = require("./lib/tools/library");
class TTAdapter extends utils.Adapter {
  library;
  unload = false;
  hService;
  vService;
  activeService;
  depRequest;
  journeysRequest;
  stationRequest;
  departurePolling;
  journeyPolling;
  /**
   * Creates an instance of the adapter.
   *
   * @param options The adapter options
   */
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
  }
  /**
   * Gibt die Instanz des aktiven Transport-Service zurück.
   *
   * @returns Die Instanz des aktiven Transport-Service
   * @throws Fehler, wenn der Service noch nicht initialisiert wurde
   */
  getActiveService() {
    if (!this.activeService) {
      throw new Error(this.library.translate("msg_transportServiceNotInitialized"));
    }
    return this.activeService;
  }
  /**
   * Holt Stationsinformationen für alle aktivierten Stationen.
   */
  async fetchStationInformation() {
    if (!this.getActiveService()) {
      return;
    }
    if (!this.config.stationConfig || this.config.stationConfig.length === 0) {
      this.log.warn(this.library.translate("msg_noStationsConfiguredForStationInfo"));
      return;
    }
    const enabledStations = this.config.stationConfig.filter((station) => station.enabled);
    if (enabledStations.length === 0) {
      this.log.warn(this.library.translate("msg_noEnabledStations"));
      return;
    }
    this.log.info(this.library.translate("msg_activeStationsFound", enabledStations.length));
    for (const station of enabledStations) {
      if (station.id) {
        this.log.info(
          this.library.translate("msg_fetchingStationInfo", station.customName || station.name, station.id)
        );
        const stationData = await this.stationRequest.getStation(station.id, this.activeService);
        await this.stationRequest.writeStationData(
          `${this.namespace}.Stations.${station.id}.info`,
          stationData
        );
      }
    }
  }
  /**
   * Is called when databases are connected and adapter received configuration.
   */
  async onReady() {
    await this.library.init();
    const states = await this.getStatesAsync("*");
    await this.library.initStates(states);
    const serviceType = this.config.serviceType || "hafas";
    const clientName = this.config.clientName || "iobroker-tt-adapter";
    try {
      if (serviceType === "vendo") {
        this.vService = new import_dbVendoService.VendoService(clientName);
        this.vService.init();
        this.activeService = this.vService;
        this.log.info(this.library.translate("msg_vendoServiceInitialized", clientName));
      } else {
        const profileName = this.config.profile || "unknown";
        this.hService = new import_hafasService.HafasService(clientName, profileName);
        this.hService.init();
        this.activeService = this.hService;
        this.log.info(this.library.translate("msg_hafasClientInitialized", profileName));
      }
    } catch (error) {
      this.log.error(this.library.translate("msg_transportServiceInitFailed", error.message));
      return;
    }
    this.depRequest = new import_departure.DepartureRequest(this);
    this.stationRequest = new import_station.StationRequest(this);
    this.journeysRequest = new import_journeys.JourneysRequest(this);
    this.departurePolling = new import_departurePolling.DeparturePolling(this);
    this.journeyPolling = new import_journeyPolling.JourneyPolling(this);
    const pollInterval = this.config.pollInterval || 5;
    try {
      await this.departurePolling.startDepartures(pollInterval);
    } catch (err) {
      this.log.error(this.library.translate("msg_hafasRequestFailed", err.message));
    }
    try {
      await this.journeyPolling.startJourneys(pollInterval);
    } catch (err) {
      this.log.error(this.library.translate("msg_journeyQueryError", err.message));
    }
    try {
      await this.fetchStationInformation();
    } catch (err) {
      this.log.error(this.library.translate("msg_stationQueryError", err.message));
    }
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   *
   * @param callback Function to be called when unload is complete
   */
  onUnload(callback) {
    var _a, _b;
    try {
      (_a = this.departurePolling) == null ? void 0 : _a.stop();
      (_b = this.journeyPolling) == null ? void 0 : _b.stop();
      callback();
    } catch {
      callback();
    }
  }
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
              this.sendTo(
                obj.from,
                obj.command,
                { error: this.library.translate("msg_queryTooShort") },
                obj.callback
              );
            }
            return;
          }
          const results = await this.getActiveService().getLocations(query, { results: 20 });
          const stations = results.map((location) => ({
            id: location.id,
            name: location.name,
            type: location.type,
            location: location.location ? {
              latitude: location.location.latitude,
              longitude: location.location.longitude
            } : void 0,
            products: location.products
          }));
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, stations, obj.callback);
          }
        } catch (error) {
          this.log.error(this.library.translate("msg_locationSearchFailed", error.message));
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

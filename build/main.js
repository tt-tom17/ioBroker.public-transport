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
  PublicTransport: () => PublicTransport
});
module.exports = __toCommonJS(main_exports);
var utils = __toESM(require("@iobroker/adapter-core"));
var import_dbVendoService = require("./lib/class/dbVendoService");
var import_departure = require("./lib/class/departure");
var import_departurePolling = require("./lib/class/departurePolling");
var import_hafasService = require("./lib/class/hafasService");
var import_journeyPolling = require("./lib/class/journeyPolling");
var import_journeys = require("./lib/class/journeys");
var import_motisService = require("./lib/class/motisService");
var import_station = require("./lib/class/station");
var import_library = require("./lib/tools/library");
class PublicTransport extends utils.Adapter {
  library;
  unload = false;
  hService;
  vService;
  mService;
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
      name: "public-transport",
      useFormatDate: true
    });
    this.library = new import_library.Library(this);
    this.on("ready", this.onReady.bind(this));
    this.on("message", this.onMessage.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  /**
   * Gibt die Instanz des aktiven Transport-Service zurück.
   *
   * @returns Die Instanz des aktiven Transport-Service
   */
  getActiveService() {
    if (!this.activeService) {
      throw new Error("Transport service has not been initialized.");
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
      this.log.debug(
        "No stations found in configuration for station info queries. Please configure in Admin UI."
      );
      return;
    }
    const enabledStations = this.config.stationConfig.filter((station) => station.enabled);
    if (enabledStations.length === 0) {
      this.log.debug("No enabled stations found. Please enable at least one station.");
      return;
    }
    this.log.info(`${enabledStations.length} active station(s) found:`);
    for (const station of enabledStations) {
      if (this.unload) {
        return;
      }
      if (station.id) {
        this.log.info(`Querying info for: ${station.customName || station.name} (${station.id})...`);
        const stationData = await this.stationRequest.getStation(
          station.id,
          this.activeService,
          void 0,
          station.client_profile
        );
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
    const clientName = `${this.config.clientName || "iobroker-public-transport"}-${Math.floor(Math.random() * 1001)}`;
    try {
      if (serviceType === "vendo") {
        this.vService = new import_dbVendoService.VendoService(this, clientName);
        this.vService.init();
        this.activeService = this.vService;
        this.log.info(`VendoService initialized with ClientName: ${clientName}`);
      } else if (serviceType === "motis") {
        this.mService = new import_motisService.MotisService(this, clientName);
        this.mService.init();
        this.activeService = this.mService;
        this.log.info(`MOTIS client (Transitous) initialized with ClientName: ${clientName}`);
      } else {
        const profileName = this.config.profile || "unknown";
        this.hService = new import_hafasService.HafasService(this, clientName, profileName);
        this.hService.init();
        this.activeService = this.hService;
        this.log.info(`HAFAS client initialized with profile: ${profileName}`);
      }
    } catch (error) {
      this.log.error(
        `Transport service (client) could not be initialized. Error message: ${error.message}`
      );
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
      this.log.error(`Query for departures failed. Error message: ${err.message}`);
    }
    try {
      await this.journeyPolling.startJourneys(pollInterval);
    } catch (err) {
      this.log.error(`Error querying journeys: ${err.message}`);
    }
    try {
      await this.fetchStationInformation();
    } catch (err) {
      this.log.error(`Error querying stations. Error message: ${err.message}`);
    }
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances!
   *
   * @param callback Function to be called when unload is complete
   */
  onUnload(callback) {
    var _a, _b, _c;
    try {
      this.unload = true;
      (_a = this.departurePolling) == null ? void 0 : _a.stop();
      (_b = this.journeyPolling) == null ? void 0 : _b.stop();
      (_c = this.library) == null ? void 0 : _c.destroy();
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
   *
   * private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
   *   if (state) {
   *       // The state was changed
   *       this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
   *   } else {
   *       // The state was deleted
   *       this.log.info(`state ${id} deleted`);
   *   }
   * }
   */
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
              this.sendTo(obj.from, obj.command, { error: "Query too short" }, obj.callback);
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
            products: location.products,
            service: this.config.serviceType || "unknown",
            profile: this.config.profile || "unknown"
          }));
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, stations, obj.callback);
          }
        } catch (error) {
          this.log.error(`Location search failed. Error message: ${error.message}`);
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: error.message }, obj.callback);
          }
        }
      }
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new PublicTransport(options);
} else {
  (() => new PublicTransport())();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PublicTransport
});
//# sourceMappingURL=main.js.map

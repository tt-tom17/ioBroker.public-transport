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
var import_hafasService = require("./lib/class/hafasService");
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
  pollIntervall;
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
      throw new Error("Transport-Service wurde noch nicht initialisiert");
    }
    return this.activeService;
  }
  /**
   * Gibt die aktivierten Stationen aus der Konfiguration zurück.
   *
   * @returns Array der aktivierten Stationen oder undefined wenn keine vorhanden sind
   */
  getEnabledStations() {
    if (!this.config.departures || this.config.departures.length === 0) {
      this.log.warn(this.library.translate("msg_noStationsConfigured"));
      return void 0;
    }
    const enabledStations = this.config.departures.filter((station) => station.enabled);
    if (enabledStations.length === 0) {
      this.log.warn(this.library.translate("msg_noEnabledStationsFound"));
      return void 0;
    }
    return enabledStations;
  }
  /**
   * Loggt die gefundenen Stationen.
   *
   * @param stations Array der Stationen
   */
  logStations(stations) {
    this.log.info(this.library.translate("msg_activeStationsFound", stations.length));
    for (const station of stations) {
      this.log.info(
        this.library.translate("msg_stationListEntry", station.customName || station.name, station.id)
      );
    }
  }
  /**
   * Erstellt die Optionen für eine Abfahrtsanfrage.
   *
   * @param station Die Station
   * @returns Die Optionen für die Abfrage
   */
  createDepartureOptions(station) {
    const offsetTime = station.offsetTime ? station.offsetTime : 0;
    const when = offsetTime === 0 ? void 0 : new Date(Date.now() + offsetTime * 60 * 1e3);
    const duration = station.duration ? station.duration : 10;
    const results = station.numDepartures ? station.numDepartures : 10;
    return { results, when, duration };
  }
  /**
   * Führt eine Abfrage für alle aktivierten Stationen durch.
   *
   * @param stations Array der Stationen
   * @returns Objekt mit successCount und errorCount
   */
  async queryDeparturesForStations(stations) {
    let successCount = 0;
    let errorCount = 0;
    for (const station of stations) {
      if (!station.id) {
        this.log.warn(this.library.translate("msg_stationNoValidId", station.customName || station.name));
        continue;
      }
      const options = this.createDepartureOptions(station);
      const products = station.products ? station.products : void 0;
      this.log.info(
        this.library.translate("msg_fetchingDepartures", station.customName || station.name, station.id)
      );
      const success = await this.depRequest.getDepartures(station.id, this.activeService, options, products);
      if (success) {
        successCount++;
        this.log.info(
          this.library.translate("msg_departuresUpdated", station.customName || station.name, station.id)
        );
      } else {
        errorCount++;
        this.log.warn(
          this.library.translate(
            "msg_departuresUpdateFailed",
            station.customName || station.name,
            station.id
          )
        );
      }
    }
    return { successCount, errorCount };
  }
  /**
   * Initialisiert das Polling für Abfahrten.
   *
   * @param pollInterval Das Intervall in Millisekunden
   */
  async initializeDeparturesPolling(pollInterval) {
    if (!this.getActiveService()) {
      return;
    }
    const enabledStations = this.getEnabledStations();
    if (!enabledStations) {
      return;
    }
    this.logStations(enabledStations);
    const { successCount, errorCount } = await this.queryDeparturesForStations(enabledStations);
    this.log.info(this.library.translate("msg_firstQueryCompleted", successCount, errorCount));
    this.log.info(this.library.translate("msg_waitingForNextQuery", pollInterval / 6e4));
    this.pollIntervall = this.setInterval(async () => {
      const { successCount: successCount2, errorCount: errorCount2 } = await this.queryDeparturesForStations(enabledStations);
      this.log.info(this.library.translate("msg_queryCompleted", successCount2, errorCount2));
      this.log.info(this.library.translate("msg_waitingForNextQuery", pollInterval / 6e4));
    }, pollInterval);
  }
  /**
   * Holt Stationsinformationen für alle aktivierten Stationen.
   */
  async fetchStationInformation() {
    if (!this.getActiveService()) {
      return;
    }
    if (!this.config.departures || this.config.departures.length === 0) {
      this.log.warn(this.library.translate("msg_noStationsConfiguredForStationInfo"));
      return;
    }
    const enabledStations = this.config.departures.filter((station) => station.enabled);
    if (enabledStations.length === 0) {
      this.log.warn(this.library.translate("msg_noEnabledStations"));
      return;
    }
    this.logStations(enabledStations);
    for (const station of enabledStations) {
      if (station.id) {
        this.log.info(
          this.library.translate("msg_fetchingStationInfo", station.customName || station.name, station.id)
        );
        await this.stationRequest.getStation(station.id, this.activeService);
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
        const profileName = this.config.profile || "vbb";
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
    const pollInterval = (this.config.pollInterval || 5) * 60 * 1e3;
    try {
      await this.initializeDeparturesPolling(pollInterval);
    } catch (err) {
      this.log.error(this.library.translate("msg_hafasRequestFailed", err.message));
    }
    try {
      await this.fetchStationInformation();
    } catch (err) {
      this.log.error(this.library.translate("msg_stationQueryError", err.message));
    }
    try {
    } catch (err) {
      this.log.error(`Fehler beim Initialisieren des Adapters: ${err.message}`);
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
          const results = await this.activeService.getLocations(query, { results: 20 });
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

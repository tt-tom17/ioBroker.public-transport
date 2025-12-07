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
var import_station = require("./lib/class/station");
var import_library = require("./lib/tools/library");
class TTAdapter extends utils.Adapter {
  library;
  unload = false;
  hService;
  vService;
  activeService;
  depRequest;
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
        this.log.info(`VendoService initialisiert mit ClientName: ${clientName}`);
      } else {
        const profileName = this.config.profile || "vbb";
        this.hService = new import_hafasService.HafasService(clientName, profileName);
        this.hService.init();
        this.activeService = this.hService;
        this.log.info(`HAFAS-Client initialisiert mit Profil: ${profileName}`);
      }
    } catch (error) {
      this.log.error(`Transport-Service konnte nicht initialisiert werden: ${error.message}`);
      return;
    }
    this.depRequest = new import_departure.DepartureRequest(this);
    this.stationRequest = new import_station.StationRequest(this);
    const pollInterval = (this.config.pollInterval || 5) * 60 * 1e3;
    try {
      if (this.getActiveService()) {
        if (!this.config.departures || this.config.departures.length === 0) {
          this.log.warn(
            "Keine Stationen in der Konfiguration gefunden. Bitte in der Admin-UI konfigurieren."
          );
          return;
        }
        const enabledStations = this.config.departures.filter((station) => station.enabled);
        if (enabledStations.length === 0) {
          this.log.warn("Keine aktivierten Stationen gefunden. Bitte mindestens eine Station aktivieren.");
          return;
        }
        this.log.info(`${enabledStations.length} aktive Station(en) gefunden:`);
        for (const station of enabledStations) {
          this.log.info(`  - ${station.customName || station.name} (ID: ${station.id})`);
        }
        this.pollIntervall = this.setInterval(async () => {
          let successCount2 = 0;
          let errorCount2 = 0;
          for (const station of enabledStations) {
            if (!station.id) {
              this.log.warn(`Station "${station.name}" hat keine g\xFCltige ID, \xFCberspringe...`);
              continue;
            }
            const offsetTime = station.offsetTime ? station.offsetTime : 0;
            const when = offsetTime === 0 ? void 0 : new Date(Date.now() + offsetTime * 60 * 1e3);
            const duration = station.duration ? station.duration : 10;
            const results = station.numDepartures ? station.numDepartures : 10;
            const options = { results, when, duration };
            const products = station.products ? station.products : void 0;
            this.log.info(`Rufe Abfahrten ab f\xFCr: ${station.customName || station.name} (${station.id})`);
            const success = await this.depRequest.getDepartures(
              station.id,
              this.activeService,
              options,
              products
            );
            if (success) {
              successCount2++;
              this.log.info(
                `Abfahrten aktualisiert f\xFCr: ${station.customName || station.name} (${station.id})`
              );
            } else {
              errorCount2++;
              this.log.warn(
                `Abfahrten konnten nicht aktualisiert werden f\xFCr: ${station.customName || station.name} (${station.id})`
              );
            }
          }
          this.log.info(`Abfrage abgeschlossen: ${successCount2} erfolgreich, ${errorCount2} fehlgeschlagen`);
          this.log.info(`Warte auf die n\xE4chste Abfrage in ${this.config.pollInterval} Minuten...`);
        }, pollInterval);
        let successCount = 0;
        let errorCount = 0;
        for (const station of enabledStations) {
          if (station.id) {
            this.log.info(`Erste Abfrage f\xFCr: ${station.customName || station.name} (${station.id})`);
            const offsetTime = station.offsetTime ? station.offsetTime : 0;
            const when = offsetTime === 0 ? void 0 : new Date(Date.now() + offsetTime * 60 * 1e3);
            const duration = station.duration ? station.duration : 10;
            const results = station.numDepartures ? station.numDepartures : 10;
            const options = { results, when, duration };
            const products = station.products ? station.products : void 0;
            const success = await this.depRequest.getDepartures(
              station.id,
              this.activeService,
              options,
              products
            );
            if (success) {
              successCount++;
              this.log.info(
                `Abfahrten aktualisiert f\xFCr: ${station.customName || station.name} (${station.id})`
              );
            } else {
              errorCount++;
              this.log.warn(
                `Abfahrten konnten nicht aktualisiert werden f\xFCr: ${station.customName || station.name} (${station.id})`
              );
            }
          }
        }
        this.log.info(`Erste Abfrage abgeschlossen: ${successCount} erfolgreich, ${errorCount} fehlgeschlagen`);
        this.log.info(`Warte auf die n\xE4chste Abfrage in ${this.config.pollInterval} Minuten...`);
      }
    } catch (err) {
      this.log.error(`HAFAS Anfrage fehlgeschlagen: ${err.message}`);
    }
    try {
      if (this.getActiveService()) {
        if (!this.config.departures || this.config.departures.length === 0) {
          this.log.warn(
            "Keine Stationen in der Konfiguration gefunden. Bitte in der Admin-UI konfigurieren."
          );
          return;
        }
        const enabledStations = this.config.departures.filter((station) => station.enabled);
        if (enabledStations.length === 0) {
          this.log.warn("Keine aktivierten Stationen gefunden. Bitte mindestens eine Station aktivieren.");
          return;
        }
        this.log.info(`${enabledStations.length} aktive Station(en) gefunden:`);
        for (const station of enabledStations) {
          this.log.info(`  - ${station.customName || station.name} (ID: ${station.id})`);
        }
        for (const station of enabledStations) {
          if (station.id) {
            this.log.info(`Infos f\xFCr: ${station.customName || station.name} (${station.id}) abfragen...`);
            await this.stationRequest.getStation(station.id, this.activeService);
          }
        }
      }
    } catch (err) {
      this.log.error(`Fehler bei der Abfrage der Stationen: ${err.message}`);
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
              this.sendTo(obj.from, obj.command, { error: "Query zu kurz" }, obj.callback);
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
          this.log.error(`Location search failed: ${error.message}`);
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

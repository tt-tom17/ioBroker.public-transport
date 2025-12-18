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
var journeys_exports = {};
__export(journeys_exports, {
  JourneysRequest: () => JourneysRequest
});
module.exports = __toCommonJS(journeys_exports);
var import_station = require("../class/station");
var import_library = require("../tools/library");
var import_types = require("../types/types");
class JourneysRequest extends import_library.BaseClass {
  station;
  service;
  constructor(adapter) {
    super(adapter);
    this.log.setLogPrefix("journeyReq");
    this.station = new import_station.StationRequest(adapter);
  }
  /**
   *  Ruft Abfahrten für eine gegebene stationId ab und schreibt sie in die States.
   *
   * @param journeyId     Die ID der Verbindung.
   * @param from          Die Startstation.
   * @param to            Die Zielstation.
   * @param service       Der Service für die Abfrage.
   * @param options       Zusätzliche Optionen für die Abfrage.
   * @returns             true bei Erfolg, sonst false.
   */
  async getJourneys(journeyId, from, to, service, options = {}) {
    try {
      if (!from || !to) {
        throw new Error(this.library.translate("msg_journeyNoFromTo"));
      }
      this.service = service;
      const mergedOptions = { ...import_types.defaultJourneyOpt, ...options };
      const response = await this.service.getJourneys(from, to, mergedOptions);
      this.adapter.log.debug(JSON.stringify(response, null, 1));
      await this.writeJourneysStates(journeyId, response);
      return true;
    } catch (error) {
      this.log.error(this.library.translate("msg_journeyQueryError ", from, to, error.message));
      return false;
    }
  }
  /**
   * Filtert Abfahrten nach den gewählten Produkten.
   * Es werden nur Abfahrten zurückgegeben, deren Produkt in den aktivierten Produkten enthalten ist.
   *
   * @param departures    Die zu filternden Abfahrten
   * @param products      Die aktivierten Produkte (true = erlaubt)
   * @returns             Gefilterte Abfahrten
   */
  /* filterByProducts(departures: readonly Hafas.Alternative[], products: Partial<Products>): Hafas.Alternative[] {
          // Erstelle eine Liste der aktivierten Produktnamen
          const enabledProducts = Object.entries(products)
              .filter(([_, enabled]) => enabled === true)
              .map(([productName, _]) => productName);
  
          // Wenn keine Produkte aktiviert sind, gib alle zurück
          if (enabledProducts.length === 0) {
              return [...departures];
          }
  
          // Filtere Abfahrten: behalte nur die, deren line.product in enabledProducts ist
          return departures.filter(departure => {
              const lineProduct = departure.line?.product;
              if (!lineProduct) {
                  this.log.info2(
                      `Abfahrt ${departure.line?.name || 'unbekannt'} Richtung ${departure.direction} gefiltert: Keine Produktinfo vorhanden`,
                  );
                  return false;
              }
              const isEnabled = enabledProducts.includes(lineProduct);
              if (!isEnabled) {
                  this.log.info2(
                      `Abfahrt ${departure.line?.name} Richtung ${departure.direction} gefiltert: Produkt "${lineProduct}" nicht aktiviert`,
                  );
              }
              return isEnabled;
          });
      } */
  /**
   * Schreibt die Verbindungen in die States.
   *
   * @param journeyId     Die ID der Verbindung, für die die Teilstrecken/Legs geschrieben werden sollen.
   * @param journeys      Die Verbindungen, die geschrieben werden sollen.
   */
  async writeJourneysStates(journeyId, journeys) {
    try {
      if (this.adapter.config.journeyConfig) {
        for (const journey of this.adapter.config.journeyConfig) {
          await this.library.writedp(`${this.adapter.namespace}.Journeys.${journey.id}`, void 0, {
            _id: "nicht_definieren",
            type: "folder",
            common: {
              name: journey.customName,
              statusStates: { onlineId: `${this.adapter.namespace}.Journeys.${journey.id}.enabled` }
            },
            native: {}
          });
          await this.library.writedp(
            `${this.adapter.namespace}.Journeys.${journey.id}.enabled`,
            journey.enabled,
            {
              _id: "nicht_definieren",
              type: "state",
              common: {
                name: this.library.translate("journey_enabled"),
                type: "boolean",
                role: "indicator",
                read: true,
                write: false
              },
              native: {}
            }
          );
          await this.library.garbageColleting(`${this.adapter.namespace}.Routes.${journeyId}.`, 2e3);
          if (journey.enabled === true && journey.id === journeyId) {
            await this.writesBaseStates(`${this.adapter.namespace}.Journeys.${journeyId}`, journeys);
          }
        }
      }
    } catch (err) {
      this.log.error(this.library.translate("msg_journeyWriteError", err.message));
    }
  }
  async writesBaseStates(basePath, journeys) {
    var _a, _b, _c, _d;
    try {
      await this.library.writedp(`${basePath}.json`, JSON.stringify(journeys), {
        _id: "nicht_definieren",
        type: "state",
        common: {
          name: this.library.translate("raw_journeys_data"),
          type: "string",
          role: "json",
          read: true,
          write: false
        },
        native: {}
      });
      const stationFromId = ((_b = (_a = journeys == null ? void 0 : journeys.journeys) == null ? void 0 : _a[0].legs[0].origin) == null ? void 0 : _b.id) || void 0;
      const stationToId = ((_d = (_c = journeys == null ? void 0 : journeys.journeys) == null ? void 0 : _c[0].legs[journeys.journeys[0].legs.length - 1].destination) == null ? void 0 : _d.id) || void 0;
      if (stationFromId !== void 0 && stationToId !== void 0) {
        const stationFrom = await this.station.getStation(stationFromId, this.service);
        const stationTo = await this.station.getStation(stationToId, this.service);
        await this.station.writeStationData(`${basePath}.StationFrom`, stationFrom);
        await this.station.writeStationData(`${basePath}.StationTo`, stationTo);
      }
    } catch (err) {
      this.log.error(this.library.translate("msg_journeyStateWriteError ", err.message));
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  JourneysRequest
});
//# sourceMappingURL=journeys.js.map

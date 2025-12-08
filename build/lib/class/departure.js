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
var departure_exports = {};
__export(departure_exports, {
  DepartureRequest: () => DepartureRequest
});
module.exports = __toCommonJS(departure_exports);
var import_definition = require("../const/definition");
var import_library = require("../tools/library");
var import_mapper = require("../tools/mapper");
var import_types = require("../types/types");
class DepartureRequest extends import_library.BaseClass {
  constructor(adapter) {
    super(adapter);
    this.log.setLogPrefix("depReq");
  }
  /**
   *  Ruft Abfahrten für eine gegebene stationId ab und schreibt sie in die States.
   *
   * @param stationId     Die ID der Station, für die Abfahrten abgefragt werden sollen.
   * @param service      Der Service für die Abfrage.
   * @param options      Zusätzliche Optionen für die Abfrage.
   * @param products     Die aktivierten Produkte (true = erlaubt)
   * @returns             true bei Erfolg, sonst false.
   */
  async getDepartures(stationId, service, options = {}, products) {
    try {
      if (!stationId) {
        throw new Error("Keine stationId \xFCbergeben");
      }
      const mergedOptions = { ...import_types.defaultDepartureOpt, ...options };
      const response = await service.getDepartures(stationId, mergedOptions);
      this.adapter.log.debug(JSON.stringify(response.departures, null, 1));
      await this.writeDepartureStates(stationId, response.departures, products);
      return true;
    } catch (error) {
      this.log.error(
        `Fehler bei der Abfrage der Abfahrten f\xFCr Station ${stationId}: ${error.message}`
      );
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
  filterByProducts(departures, products) {
    const enabledProducts = Object.entries(products).filter(([_, enabled]) => enabled === true).map(([productName, _]) => productName);
    if (enabledProducts.length === 0) {
      return [...departures];
    }
    return departures.filter((departure) => {
      var _a, _b, _c;
      const lineProduct = (_a = departure.line) == null ? void 0 : _a.product;
      if (!lineProduct) {
        this.log.info2(
          `Abfahrt ${((_b = departure.line) == null ? void 0 : _b.name) || "unbekannt"} Richtung ${departure.direction} gefiltert: Keine Produktinfo vorhanden`
        );
        return false;
      }
      const isEnabled = enabledProducts.includes(lineProduct);
      if (!isEnabled) {
        this.log.info2(
          `Abfahrt ${(_c = departure.line) == null ? void 0 : _c.name} Richtung ${departure.direction} gefiltert: Produkt "${lineProduct}" nicht aktiviert`
        );
      }
      return isEnabled;
    });
  }
  /**
   * Schreibt die Abfahrten in die States der angegebenen Station.
   *
   * @param stationId     Die ID der Station, für die die Abfahrten geschrieben werden sollen.
   * @param departures    Die Abfahrten, die geschrieben werden sollen.
   * @param products      Die aktivierten Produkte (true = erlaubt)
   */
  async writeDepartureStates(stationId, departures, products) {
    var _a, _b;
    try {
      if (this.adapter.config.departures) {
        for (const departure of this.adapter.config.departures) {
          if (departure.id === stationId && departure.enabled === true) {
            await this.library.writedp(`${this.adapter.namespace}.Stations.${stationId}`, void 0, {
              _id: "nicht_definieren",
              type: "folder",
              common: {
                name: ((_b = (_a = departures[0]) == null ? void 0 : _a.stop) == null ? void 0 : _b.name) || "Station"
              },
              native: {}
            });
          }
        }
      }
      await this.library.writedp(
        `${this.adapter.namespace}.Stations.${stationId}.json`,
        JSON.stringify(departures),
        {
          _id: "nicht_definieren",
          type: "state",
          common: {
            name: "raw departures data",
            type: "string",
            role: "json",
            read: true,
            write: false
          },
          native: {}
        }
      );
      const filteredDepartures = products ? this.filterByProducts(departures, products) : departures;
      const departureStates = (0, import_mapper.mapDeparturesToDepartureStates)(filteredDepartures);
      await this.library.garbageColleting(`${this.adapter.namespace}.Stations.${stationId}.`, 2e3);
      await this.library.writeFromJson(
        `${this.adapter.namespace}.Stations.${stationId}.`,
        "departure",
        import_definition.genericStateObjects,
        departureStates,
        true
      );
    } catch (err) {
      this.log.error(`Fehler beim Schreiben der Abfahrten: ${err.message}`);
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DepartureRequest
});
//# sourceMappingURL=departure.js.map

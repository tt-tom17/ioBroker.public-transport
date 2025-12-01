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
var depReq_exports = {};
__export(depReq_exports, {
  DepartureRequest: () => DepartureRequest
});
module.exports = __toCommonJS(depReq_exports);
var import_definition = require("../const/definition");
var import_library = require("../tools/library");
var import_mapper = require("../tools/mapper");
var import_types = require("../types/types");
class DepartureRequest extends import_library.BaseClass {
  response;
  constructor(adapter) {
    super(adapter);
    this.response = {};
  }
  /**
   *  Ruft Abfahrten für eine gegebene stationId ab und schreibt sie in die States.
   *
   * @param stationId     Die ID der Station, für die Abfahrten abgefragt werden sollen.
   * @param service       Der zu verwendende VendoService
   * @param options       Zusätzliche Optionen für die Abfrage.
   * @param products      Die aktivierten Produkte (true = erlaubt)
   */
  async getDepartures(stationId, service, options = {}, products) {
    var _a;
    try {
      if (!stationId) {
        throw new Error("Keine stationId \xFCbergeben");
      }
      const mergedOptions = { ...import_types.defaultDepartureOpt, ...options };
      const result = await service.getDepartures(stationId, mergedOptions);
      this.response = {
        departures: [...result.departures],
        realtimeDataUpdatedAt: (_a = result.realtimeDataUpdatedAt) != null ? _a : Date.now()
      };
      this.adapter.log.debug(JSON.stringify(this.response.departures, null, 1));
      await this.library.writedp(`${this.adapter.namespace}.${stationId}`, void 0, import_definition.defaultFolder);
      if (products) {
        this.response.departures = this.filterByProducts(this.response.departures, products);
      }
      const departureStates = (0, import_mapper.mapDeparturesToDepartureStates)(this.response.departures);
      await this.library.cleanUpTree([`${this.adapter.namespace}.${stationId}`], null, 1);
      await this.library.writeFromJson(
        `${this.adapter.namespace}.${stationId}.`,
        "departures",
        import_definition.genericStateObjects,
        departureStates,
        true
      );
    } catch (error) {
      this.log.error(`Fehler bei der Abfrage der Abfahrten: ${error.message}`);
      throw error;
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
      return departures;
    }
    return departures.filter((departure) => {
      var _a, _b, _c;
      const lineProduct = (_a = departure.line) == null ? void 0 : _a.product;
      if (!lineProduct) {
        this.log.info(
          `Abfahrt ${((_b = departure.line) == null ? void 0 : _b.name) || "unbekannt"} Richtung ${departure.direction} gefiltert: Keine Produktinfo vorhanden`
        );
        return false;
      }
      const isEnabled = enabledProducts.includes(lineProduct);
      if (!isEnabled) {
        this.log.info(
          `Abfahrt ${(_c = departure.line) == null ? void 0 : _c.name} Richtung ${departure.direction} gefiltert: Produkt "${lineProduct}" nicht aktiviert`
        );
      }
      return isEnabled;
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DepartureRequest
});
//# sourceMappingURL=depReq.js.map

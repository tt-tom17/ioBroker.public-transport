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
        throw new Error(this.library.translate("msg_departureNoStationId"));
      }
      const mergedOptions = { ...import_types.defaultDepartureOpt, ...options };
      const response = await service.getDepartures(stationId, mergedOptions);
      await this.writeDepartureStates(stationId, response.departures, products);
      return true;
    } catch (error) {
      this.log.error(this.library.translate("msg_departureQueryError", stationId, error.message));
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
      var _a, _b, _c, _d, _e;
      const lineProduct = (_a = departure.line) == null ? void 0 : _a.product;
      if (!lineProduct) {
        this.log.info2(
          this.library.translate(
            "msg_departureFilterNoProduct",
            ((_b = departure.line) == null ? void 0 : _b.name) || "unbekannt / unknown",
            (_c = departure.direction) != null ? _c : "unbekannt / unknown"
          )
        );
        return false;
      }
      const isEnabled = enabledProducts.includes(lineProduct);
      if (!isEnabled) {
        this.log.info2(
          this.library.translate(
            "msg_departureFilterProductDisabled",
            ((_d = departure.line) == null ? void 0 : _d.name) || "unbekannt / unknown",
            (_e = departure.direction) != null ? _e : "unbekannt / unknown",
            lineProduct
          )
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
    try {
      if (this.adapter.config.stationConfig) {
        for (const departure of this.adapter.config.stationConfig) {
          if (departure.id === stationId && departure.enabled === true) {
            await this.library.writedp(`${this.adapter.namespace}.Stations.${stationId}`, void 0, {
              _id: "nicht_definieren",
              type: "folder",
              common: {
                name: departure.customName || departure.name || "Station"
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
            name: this.library.translate("raw_departure_data"),
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
      await this.writeStates(departureStates, stationId);
    } catch (err) {
      this.log.error(this.library.translate("msg_departureWriteError", err.message));
    }
  }
  /**
   * schreibt die Abfahrts-States in die ioBroker States.
   *
   * @param response  Die Abfahrts-States, die geschrieben werden sollen.
   * @param stationId  Die ID der Station, für die die States geschrieben werden sollen.
   */
  async writeStates(response, stationId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    for (const [index, obj] of response.entries()) {
      try {
        console.log(`
=== Starte Objekt ${index + 1} von ${response.length} ===`);
        const departureIndex = `Departures_${`00${index}`.slice(-2)}`;
        let delayed = false, onTime = false;
        if (obj.delay !== void 0 && obj.delay >= 0) {
          delayed = true;
        } else {
          onTime = true;
        }
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}`,
          void 0,
          {
            _id: "nicht_definieren",
            type: "channel",
            common: {
              name: departureIndex
            },
            native: {}
          }
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Departure`,
          obj.when,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_time"),
              type: "string",
              role: "date",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.DeparturePlanned`,
          obj.plannedWhen,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_plannedTime"),
              type: "string",
              role: "date",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Delay`,
          obj.delay || 0,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_delayInSeconds"),
              type: "number",
              role: "time",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.DepartureDelayed`,
          delayed,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_isDelayed"),
              type: "boolean",
              role: "indicator",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.DepartureOnTime`,
          onTime,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_isOnTime"),
              type: "boolean",
              role: "indicator",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Platform`,
          obj.platform,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_platform"),
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.PlatformPlanned`,
          obj.plannedPlatform,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_plannedPlatform"),
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Direction`,
          obj.direction,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_direction"),
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Name`,
          (_a = obj.line) == null ? void 0 : _a.name,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_lineName"),
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Product`,
          (_b = obj.line) == null ? void 0 : _b.product,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_lineProduct"),
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Operator`,
          (_c = obj.line) == null ? void 0 : _c.operator,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_lineOperator"),
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Mode`,
          (_d = obj.line) == null ? void 0 : _d.mode,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_lineMode"),
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Remarks`,
          void 0,
          {
            _id: "nicht_definieren",
            type: "channel",
            common: {
              name: this.library.translate("departure_remark")
            },
            native: {}
          }
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Remarks.Hint`,
          (_e = obj.remarks) == null ? void 0 : _e.hint,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_remarkHint"),
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Remarks.Status`,
          (_f = obj.remarks) == null ? void 0 : _f.status,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_remarkStatus"),
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Remarks.Warning`,
          (_g = obj.remarks) == null ? void 0 : _g.warning,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_remarkWarning"),
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Stop`,
          void 0,
          {
            _id: "nicht_definieren",
            type: "channel",
            common: {
              name: this.library.translate("departure_stop")
            },
            native: {}
          }
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Stop.Name`,
          (_h = obj.stopinfo) == null ? void 0 : _h.name,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_stopName"),
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Stop.Id`,
          (_i = obj.stopinfo) == null ? void 0 : _i.id,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_stopId"),
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        console.log(`\u2713 Objekt ${index + 1} erfolgreich verarbeitet`);
      } catch (error) {
        console.error(`\u2717 Fehler bei Objekt ${index + 1}:`, error);
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DepartureRequest
});
//# sourceMappingURL=departure.js.map

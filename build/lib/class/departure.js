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
var import_nsPanelTimetable = require("./nsPanelTimetable");
class DepartureRequest extends import_library.BaseClass {
  delayOffset = this.adapter.config.delayOffset || 2;
  nsPanelTimetable;
  constructor(adapter) {
    super(adapter);
    this.log.setLogPrefix("depReq");
    this.nsPanelTimetable = new import_nsPanelTimetable.NsPanelTimetable(adapter);
  }
  /**
   * Validiert, ob der initialisierte Client und das Profil mit dem angegebenen client_profile übereinstimmen.
   *
   * @param client_profile Das erwartete Client-Profil (z.B. "hafas:vbb", "vendo:db")
   * @throws Error wenn Client-Typ oder Profil nicht übereinstimmen
   */
  validateClientProfile(client_profile) {
    if (!client_profile) {
      return;
    }
    const parts = client_profile.split(":");
    const expectedServiceType = parts[0];
    const expectedProfile = parts[1] || "";
    const currentServiceType = this.adapter.config.serviceType || "hafas";
    if (currentServiceType !== expectedServiceType) {
      throw new Error(
        `Wrong client type: Expected '${expectedServiceType}', but '${currentServiceType}' is initialized (client_profile: ${client_profile})`
      );
    }
    if (expectedServiceType === "hafas" && expectedProfile) {
      const currentProfile = this.adapter.config.profile || "";
      if (currentProfile !== expectedProfile) {
        throw new Error(
          `Wrong profile: Expected '${expectedProfile}', but '${currentProfile}' is configured (client_profile: ${client_profile})`
        );
      }
    }
  }
  /**
   *  Ruft Abfahrten für eine gegebene stationId ab und schreibt sie in die States.
   *
   * @param stationId     Die ID der Station, für die Abfahrten abgefragt werden sollen.
   * @param service      Der Service für die Abfrage.
   * @param options      Zusätzliche Optionen für die Abfrage.
   * @param countEntries Die maximale Anzahl der Einträge, die geschrieben werden sollen.
   * @param products     Die aktivierten Produkte (true = erlaubt)
   * @param client_profile Das Client-Profil für die Abfrage (z.B. "hafas:vbb", "vendo:db")
   * @returns             true bei Erfolg, sonst false.
   */
  async getDepartures(stationId, service, options = {}, countEntries = 10, products, client_profile) {
    try {
      if (!stationId) {
        throw new Error("No stationId provided");
      }
      this.validateClientProfile(client_profile);
      const mergedOptions = { ...import_types.defaultDepartureOpt, ...options };
      this.log.debug(
        `Querying departures for station ${stationId} with options: ${JSON.stringify(mergedOptions)}, client_profile: ${client_profile || "kein Profil angegeben"}`
      );
      const response = await service.getDepartures(stationId, mergedOptions);
      if (this.adapter.config.logCompletelyJSON) {
        this.log.debug(JSON.stringify(response.departures, null, 1));
      }
      if (!response.departures || response.departures.length === 0) {
        this.log.info(
          `No departures found for station ${stationId}, client_profile: ${client_profile || "kein Profil angegeben"}`
        );
      }
      await this.writeDepartureStates(stationId, response.departures, countEntries);
      return true;
    } catch (error) {
      this.log.error(`Error querying departures for station ${stationId}: ${error.message}`);
      return false;
    }
  }
  /**
   * Filtert Abfahrten nach den gewählten Produkten.
   * Die API liefert Produktnamen in kebab-case (z.B. "regional-express"),
   * die Config-Keys sind camelCase (z.B. "regionalExpress") – daher wird
   * der API-Wert vor dem Vergleich normalisiert. Über Funktion kebabToCamel()
   * aus der library.ts wird die Normalisierung durchgeführt.
   *
   * @param departures    Die zu filternden Abfahrten
   * @param products      Die aktivierten Produkte (true = erlaubt)
   * @returns             Gefilterte Abfahrten
   */
  /* filterByProducts(departures: readonly Hafas.Alternative[], products: Partial<Products>): Hafas.Alternative[] {
          // Erstelle eine Liste der aktivierten Produktnamen (camelCase)
          const enabledProducts = Object.entries(products)
              .filter(([_, enabled]) => enabled === true)
              .map(([productName, _]) => productName);
  
          // Wenn keine Produkte aktiviert sind, gib alle zurück
          if (enabledProducts.length === 0) {
              return [...departures];
          }
  
          // Filtere Abfahrten: normalisiere API-Produktnamen von kebab-case zu camelCase
          return departures.filter(departure => {
              const lineProduct = departure.line?.product;
              if (!lineProduct) {
                  this.log.info2(
                      `Departure ${departure.line?.name || 'unbekannt / unknown'} to ${departure.direction ?? 'unbekannt / unknown'} filtered: No product info available`,
                  );
                  return false;
              }
              const normalizedProduct = kebabToCamel(lineProduct);
              const isEnabled = enabledProducts.includes(normalizedProduct);
              if (!isEnabled) {
                  this.log.info2(
                      `Departure ${departure.line?.name || 'unbekannt / unknown'} to ${departure.direction ?? 'unbekannt / unknown'} filtered: Product "${lineProduct}" (normalized: "${normalizedProduct}") not enabled`,
                  );
              }
              return isEnabled;
          });
      }*/
  /**
   * Schreibt die Abfahrten in die States der angegebenen Station.
   *
   * @param stationId     Die ID der Station, für die die Abfahrten geschrieben werden sollen.
   * @param departures    Die Abfahrten, die geschrieben werden sollen.
   * @param countEntries  Die maximale Anzahl der Einträge, die geschrieben werden sollen.
   * /@param products      Die aktivierten Produkte (true = erlaubt)
   */
  async writeDepartureStates(stationId, departures, countEntries) {
    try {
      if (!this.adapter.config.stationConfig) {
        return;
      }
      const stationConfig = this.adapter.config.stationConfig.find(
        (station) => station.enabled === true && station.id === stationId
      );
      if (!stationConfig) {
        this.log.warn(`Station with ID ${stationId} not found or not enabled`);
        return;
      }
      await this.library.writedp(`${this.adapter.namespace}.Stations.${stationConfig.id}`, void 0, {
        _id: "nicht_definieren",
        type: "folder",
        common: {
          name: stationConfig.customName || stationConfig.name || "Station",
          statusStates: {
            onlineId: `${this.adapter.namespace}.Stations.${stationConfig.id}.enabled`
          }
        },
        native: {}
      });
      await this.library.writedp(
        `${this.adapter.namespace}.Stations.${stationConfig.id}.json`,
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
      await this.library.writedp(
        `${this.adapter.namespace}.Stations.${stationConfig.id}.enabled`,
        stationConfig.enabled,
        {
          _id: "nicht_definieren",
          type: "state",
          common: {
            name: this.library.translate("station_enabled"),
            type: "boolean",
            role: "indicator",
            read: true,
            write: false
          },
          native: {}
        }
      );
      await this.library.writedp(
        `${this.adapter.namespace}.Stations.${stationConfig.id}.countDepartures`,
        departures.length,
        {
          _id: "nicht_definieren",
          type: "state",
          common: {
            name: this.library.translate("departure_count"),
            type: "number",
            role: "value",
            read: true,
            write: false
          },
          native: {}
        }
      );
      const departureStates = (0, import_mapper.mapDeparturesToDepartureStates)(departures);
      await this.writeBaseStates(departureStates, stationId, countEntries, stationConfig.nspanel);
    } catch (err) {
      this.log.error(`Error writing departures: ${err.message}`);
    }
  }
  /**
   * schreibt die Abfahrts-States in die ioBroker States.
   *
   * @param response  Die Abfahrts-States, die geschrieben werden sollen.
   * @param stationId  Die ID der Station, für die die States geschrieben werden sollen.
   * @param countEntries  Die maximale Anzahl der Einträge, die geschrieben werden sollen.
   * @param nspanel  Ob der NSPanel-Channel angelegt werden soll.
   */
  async writeBaseStates(response, stationId, countEntries, nspanel) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    for (const [index, obj] of response.entries()) {
      try {
        this.log.info2(`=== Starting object ${index + 1} of ${response.length} ===`);
        const departureIndex = `Departures_${`00${index}`.slice(-2)}`;
        const [delayed, onTime] = await this.library.getDelayStatus(obj.delay, this.delayOffset);
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
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.ProductName`,
          (_e = obj.line) == null ? void 0 : _e.productName,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_lineProductName"),
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
          (_f = obj.remarks) == null ? void 0 : _f.hint,
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
          (_g = obj.remarks) == null ? void 0 : _g.status,
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
          (_h = obj.remarks) == null ? void 0 : _h.warning,
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
          (_i = obj.stopinfo) == null ? void 0 : _i.name,
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
          (_j = obj.stopinfo) == null ? void 0 : _j.id,
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
        await this.library.writedp(
          `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}.Stop.Type`,
          (_k = obj.stopinfo) == null ? void 0 : _k.type,
          {
            _id: "nicht_definieren",
            type: "state",
            common: {
              name: this.library.translate("departure_stopType"),
              type: "string",
              role: "text",
              read: true,
              write: false
            },
            native: {}
          },
          true
        );
        if (nspanel) {
          await this.nsPanelTimetable.writeDepartureNsPanel(
            `${this.adapter.namespace}.Stations.${stationId}.${departureIndex}`,
            obj
          );
        }
        this.log.info2(`\u2713 Object ${index + 1} processed successfully`);
        if (index === countEntries - 1) {
          this.log.debug(
            `=== Maximum number of entries reached (${countEntries}), further departures will not be processed ===`
          );
          break;
        }
      } catch (err) {
        this.log.error(`\u2717 Error processing object ${index + 1}: ${err.message}`);
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DepartureRequest
});
//# sourceMappingURL=departure.js.map

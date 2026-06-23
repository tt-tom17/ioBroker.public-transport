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
var nsPanelTimetable_exports = {};
__export(nsPanelTimetable_exports, {
  NsPanelTimetable: () => NsPanelTimetable
});
module.exports = __toCommonJS(nsPanelTimetable_exports);
var import_library = require("../tools/library");
class NsPanelTimetable extends import_library.BaseClass {
  constructor(adapter) {
    super(adapter);
    this.log.setLogPrefix("nsPanelTimetable");
  }
  /**
   * Schreibt den nspanel-Channel für eine Abfahrt.
   *
   * @param prefix     Vollständiger Pfad zur Abfahrt (z.B. `adapter.namespace.Stations.id.Departures_00`)
   * @param departure  Die Abfahrts-State-Daten
   * @param index      Index der Abfahrt (0, 1, 2, ...)
   */
  async writeDepartureNsPanel(prefix, departure, index) {
    var _a, _b, _c, _d, _e, _f;
    await this.library.writedp(`${prefix}.nspanelDep${index}`, void 0, {
      _id: "nicht_definieren",
      type: "channel",
      common: {
        name: `nspanelDep${index}`,
        role: "timeTable"
      },
      native: {}
    });
    await this.library.writedp(`${prefix}.nspanelDep${index}.ACTUAL`, (_a = departure.when) != null ? _a : "", {
      _id: "nicht_definieren",
      type: "state",
      common: {
        name: { de: "Ist-Abfahrtszeit", en: "Actual departure time" },
        type: "string",
        role: "date",
        read: true,
        write: false
      },
      native: {}
    });
    await this.library.writedp(`${prefix}.nspanelDep${index}.VEHICLE`, (_c = (_b = departure.line) == null ? void 0 : _b.mode) != null ? _c : "", {
      _id: "nicht_definieren",
      type: "state",
      common: {
        name: { de: "Fahrzeugtyp", en: "Vehicle type" },
        type: "string",
        role: "state",
        read: true,
        write: false
      },
      native: {}
    });
    await this.library.writedp(`${prefix}.nspanelDep${index}.DEPARTURE`, (_d = departure.plannedWhen) != null ? _d : "", {
      _id: "nicht_definieren",
      type: "state",
      common: {
        name: { de: "Geplante Abfahrt", en: "Planned departure" },
        type: "string",
        role: "date",
        read: true,
        write: false
      },
      native: {}
    });
    await this.library.writedp(`${prefix}.nspanelDep${index}.DELAY`, (_e = departure.delay) != null ? _e : 0, {
      _id: "nicht_definieren",
      type: "state",
      common: {
        name: { de: "Versp\xE4tung", en: "Delay" },
        type: "number",
        role: "state",
        read: true,
        write: false
      },
      native: {}
    });
    await this.library.writedp(`${prefix}.nspanelDep${index}.DIRECTION`, (_f = departure.direction) != null ? _f : "", {
      _id: "nicht_definieren",
      type: "state",
      common: {
        name: { de: "Richtung", en: "Direction" },
        type: "string",
        role: "state",
        read: true,
        write: false
      },
      native: {}
    });
  }
  /**
   * Schreibt den nspanel-Channel für eine Verbindung (Journey).
   *
   * @param prefix   Vollständiger Pfad zur Journey (z.B. `adapter.namespace.Journeys.id.Journey_00`)
   * @param journey  Die Verbindungsdaten (erstes Leg = Abfahrt, letztes Leg = Ziel)
   * @param index    Index der Journey (0, 1, 2, ...)
   */
  async writeJourneyNsPanel(prefix, journey, index) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const firstLeg = journey.legs[0];
    const firstNonWalkingLeg = journey.legs.find((leg) => leg.walking !== true);
    await this.library.writedp(`${prefix}.nspanelJourney${index}`, void 0, {
      _id: "nicht_definieren",
      type: "channel",
      common: {
        name: `nspanelJourney${index}`,
        role: "timeTable"
      },
      native: {}
    });
    await this.library.writedp(`${prefix}.nspanelJourney${index}.ACTUAL`, (_a = firstLeg.departure) != null ? _a : "", {
      _id: "nicht_definieren",
      type: "state",
      common: {
        name: { de: "Ist-Abfahrtszeit", en: "Actual departure time" },
        type: "string",
        role: "date",
        read: true,
        write: false
      },
      native: {}
    });
    await this.library.writedp(`${prefix}.nspanelJourney${index}.VEHICLE`, (_c = (_b = firstNonWalkingLeg == null ? void 0 : firstNonWalkingLeg.line) == null ? void 0 : _b.mode) != null ? _c : "", {
      _id: "nicht_definieren",
      type: "state",
      common: {
        name: { de: "Fahrzeugtyp", en: "Vehicle type" },
        type: "string",
        role: "state",
        read: true,
        write: false
      },
      native: {}
    });
    await this.library.writedp(`${prefix}.nspanelJourney${index}.DEPARTURE`, (_d = firstLeg.plannedDeparture) != null ? _d : "", {
      _id: "nicht_definieren",
      type: "state",
      common: {
        name: { de: "Geplante Abfahrt", en: "Planned departure" },
        type: "string",
        role: "date",
        read: true,
        write: false
      },
      native: {}
    });
    await this.library.writedp(`${prefix}.nspanelJourney${index}.DELAY`, (_e = firstLeg.departureDelay) != null ? _e : 0, {
      _id: "nicht_definieren",
      type: "state",
      common: {
        name: { de: "Versp\xE4tung", en: "Delay" },
        type: "number",
        role: "state",
        read: true,
        write: false
      },
      native: {}
    });
    const dirAndLine = firstLeg.direction && ((_f = firstLeg.line) == null ? void 0 : _f.name) ? `${firstLeg.direction} (${(_g = firstLeg.line) == null ? void 0 : _g.name})` : (_j = (_i = firstLeg.direction) != null ? _i : (_h = firstLeg.line) == null ? void 0 : _h.name) != null ? _j : "";
    await this.library.writedp(`${prefix}.nspanelJourney${index}.DIRECTION`, dirAndLine, {
      _id: "nicht_definieren",
      type: "state",
      common: {
        name: { de: "Richtung", en: "Direction" },
        type: "string",
        role: "state",
        read: true,
        write: false
      },
      native: {}
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NsPanelTimetable
});
//# sourceMappingURL=nsPanelTimetable.js.map

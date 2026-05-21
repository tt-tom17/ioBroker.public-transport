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
   */
  async writeDepartureNsPanel(prefix, departure) {
    var _a, _b, _c, _d, _e, _f;
    await this.library.writedp(`${prefix}.nspanel`, void 0, {
      _id: "nicht_definieren",
      type: "channel",
      common: {
        name: "nspanel",
        role: "timeTable"
      },
      native: {}
    });
    await this.library.writedp(`${prefix}.nspanel.ACTUAL`, (_a = departure.when) != null ? _a : "", {
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
    await this.library.writedp(`${prefix}.nspanel.VEHICLE`, (_c = (_b = departure.line) == null ? void 0 : _b.mode) != null ? _c : "", {
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
    await this.library.writedp(`${prefix}.nspanel.DEPARTURE`, (_d = departure.plannedWhen) != null ? _d : "", {
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
    await this.library.writedp(`${prefix}.nspanel.DELAY`, (_e = departure.delay) != null ? _e : 0, {
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
    await this.library.writedp(`${prefix}.nspanel.DIRECTION`, (_f = departure.direction) != null ? _f : "", {
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
   */
  async writeJourneyNsPanel(prefix, journey) {
    var _a, _b, _c, _d, _e, _f, _g;
    const firstLeg = journey.legs[0];
    const firstNonWalkingLeg = journey.legs.find((leg) => leg.walking !== true);
    const lastLeg = journey.legs[journey.legs.length - 1];
    await this.library.writedp(`${prefix}.nspanel`, void 0, {
      _id: "nicht_definieren",
      type: "channel",
      common: {
        name: "nspanel",
        role: "timeTable"
      },
      native: {}
    });
    await this.library.writedp(`${prefix}.nspanel.ACTUAL`, (_a = firstLeg.departure) != null ? _a : "", {
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
    await this.library.writedp(`${prefix}.nspanel.VEHICLE`, (_c = (_b = firstNonWalkingLeg == null ? void 0 : firstNonWalkingLeg.line) == null ? void 0 : _b.mode) != null ? _c : "", {
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
    await this.library.writedp(`${prefix}.nspanel.DEPARTURE`, (_d = firstLeg.plannedDeparture) != null ? _d : "", {
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
    await this.library.writedp(`${prefix}.nspanel.DELAY`, (_e = firstLeg.departureDelay) != null ? _e : 0, {
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
    await this.library.writedp(`${prefix}.nspanel.DIRECTION`, (_g = (_f = lastLeg.destination) == null ? void 0 : _f.name) != null ? _g : "", {
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

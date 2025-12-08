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
var mapper_exports = {};
__export(mapper_exports, {
  mapDepartureToDepartureState: () => mapDepartureToDepartureState,
  mapDeparturesResponseToStates: () => mapDeparturesResponseToStates,
  mapDeparturesToDepartureStates: () => mapDeparturesToDepartureStates,
  mapStationToStationState: () => mapStationToStationState
});
module.exports = __toCommonJS(mapper_exports);
function groupRemarksByType(remarks) {
  var _a, _b, _c;
  const hints = [];
  const warnings = [];
  const statuses = [];
  for (const remark of remarks) {
    switch (remark.type) {
      case "hint":
        hints.push((_a = remark.text) != null ? _a : "");
        break;
      case "warning":
        warnings.push((_b = remark.text) != null ? _b : "");
        break;
      case "status":
        statuses.push((_c = remark.text) != null ? _c : "");
        break;
    }
  }
  return {
    hint: hints.length > 0 ? hints.join("\n") : null,
    warning: warnings.length > 0 ? warnings.join("\n") : null,
    status: statuses.length > 0 ? statuses.join("\n") : null
  };
}
function mapDepartureToDepartureState(departure) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A;
  return {
    when: (_a = departure.when) != null ? _a : null,
    plannedWhen: (_b = departure.plannedWhen) != null ? _b : null,
    delay: (_c = departure.delay) != null ? _c : null,
    direction: (_d = departure.direction) != null ? _d : null,
    platform: (_e = departure.platform) != null ? _e : null,
    plannedPlatform: (_f = departure.plannedPlatform) != null ? _f : null,
    line: {
      name: (_h = (_g = departure.line) == null ? void 0 : _g.name) != null ? _h : null,
      fahrtNr: (_j = (_i = departure.line) == null ? void 0 : _i.fahrtNr) != null ? _j : null,
      productName: (_l = (_k = departure.line) == null ? void 0 : _k.productName) != null ? _l : null,
      mode: (_n = (_m = departure.line) == null ? void 0 : _m.mode) != null ? _n : null,
      operator: (_q = (_p = (_o = departure.line) == null ? void 0 : _o.operator) == null ? void 0 : _p.name) != null ? _q : null
    },
    remarks: groupRemarksByType((_r = departure.remarks) != null ? _r : []),
    stopinfo: {
      name: (_t = (_s = departure.stop) == null ? void 0 : _s.name) != null ? _t : null,
      id: (_v = (_u = departure.stop) == null ? void 0 : _u.id) != null ? _v : null,
      type: (_x = (_w = departure.stop) == null ? void 0 : _w.type) != null ? _x : null,
      location: ((_y = departure.stop) == null ? void 0 : _y.location) ? {
        latitude: (_z = departure.stop.location.latitude) != null ? _z : null,
        longitude: (_A = departure.stop.location.longitude) != null ? _A : null
      } : null
    }
  };
}
function mapDeparturesToDepartureStates(departures) {
  return departures.map(mapDepartureToDepartureState);
}
function mapDeparturesResponseToStates(response) {
  return mapDeparturesToDepartureStates(response.departures);
}
function mapStationToStationState(station) {
  return {
    name: station.name,
    id: station.id,
    type: station.type,
    location: station.location ? {
      latitude: station.location.latitude,
      longitude: station.location.longitude
    } : void 0
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mapDepartureToDepartureState,
  mapDeparturesResponseToStates,
  mapDeparturesToDepartureStates,
  mapStationToStationState
});
//# sourceMappingURL=mapper.js.map

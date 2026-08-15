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
var efaMapper_exports = {};
__export(efaMapper_exports, {
  mapJourney: () => mapJourney,
  mapLine: () => mapLine,
  mapLocation: () => mapLocation,
  mapRemarks: () => mapRemarks,
  mapStopEvent: () => mapStopEvent,
  mapStopovers: () => mapStopovers
});
module.exports = __toCommonJS(efaMapper_exports);
const MOT_MAP = {
  0: { product: "national", mode: "train" },
  // Zug (Fernverkehr)
  1: { product: "suburban", mode: "train" },
  // S-Bahn
  2: { product: "subway", mode: "train" },
  // U-Bahn
  3: { product: "tram", mode: "train" },
  // Stadtbahn
  4: { product: "tram", mode: "train" },
  // Straßenbahn
  5: { product: "bus", mode: "bus" },
  // Stadtbus
  6: { product: "bus", mode: "bus" },
  // Regionalbus
  7: { product: "bus", mode: "bus" },
  // Schnellbus
  8: { product: "cableCar", mode: "gondola" },
  // Seil-/Zahnradbahn ('cableCar' = Schlüssel der Admin-UI)
  9: { product: "ferry", mode: "watercraft" },
  // Schiff/Fähre
  10: { product: "bus", mode: "bus" },
  // AST/Rufbus
  11: { product: "tram", mode: "train" },
  // Sonstige (u. a. Schwebebahn)
  12: { product: "aircraft", mode: "aircraft" },
  // Flugzeug
  13: { product: "regional", mode: "train" },
  // Regionalzug
  14: { product: "regional", mode: "train" },
  // Regionalzug
  15: { product: "national", mode: "train" },
  // Fernzug
  16: { product: "regional", mode: "train" },
  // "Zug" (Sammelklasse, siehe Hinweis oben)
  17: { product: "bus", mode: "bus" },
  // Schienenersatzverkehr
  18: { product: "regional", mode: "train" },
  // Zug
  19: { product: "bus", mode: "bus" }
  // Bürgerbus
};
const MOT_FOOTPATH = 99;
function isFootpath(transportation) {
  return !(transportation == null ? void 0 : transportation.product) || transportation.product.class === MOT_FOOTPATH;
}
const CANCELLED_STATUS = /* @__PURE__ */ new Set(["TRIP_CANCELLED", "DEPARTURE_CANCELLED", "ARRIVAL_CANCELLED"]);
function delayInSeconds(planned, estimated) {
  if (!planned || !estimated) {
    return void 0;
  }
  const diff = Date.parse(estimated) - Date.parse(planned);
  return Number.isFinite(diff) ? Math.round(diff / 1e3) : void 0;
}
function toLocation(coord) {
  if (!coord || coord.length < 2 || !Number.isFinite(coord[0]) || !Number.isFinite(coord[1])) {
    return void 0;
  }
  return { type: "location", latitude: coord[0], longitude: coord[1] };
}
function toProducts(productClasses) {
  if (!(productClasses == null ? void 0 : productClasses.length)) {
    return void 0;
  }
  const products = {};
  for (const mot of productClasses) {
    const mapped = MOT_MAP[mot];
    if (mapped) {
      products[mapped.product] = true;
    }
  }
  return Object.keys(products).length > 0 ? products : void 0;
}
function mapLocation(location) {
  var _a, _b, _c, _d, _e, _f;
  if (!location) {
    return { type: "location" };
  }
  const coords = toLocation(location.coord);
  if (location.type === "stop" || location.type === "platform") {
    const parent = location.type === "platform" && ((_a = location.parent) == null ? void 0 : _a.type) === "stop" ? location.parent : void 0;
    const stop = {
      type: "stop",
      id: location.id,
      name: (_b = location.name) != null ? _b : location.disassembledName,
      location: coords,
      products: toProducts(
        (_f = (_c = location.productClasses) != null ? _c : parent == null ? void 0 : parent.productClasses) != null ? _f : (_e = (_d = location.assignedStops) == null ? void 0 : _d[0]) == null ? void 0 : _e.productClasses
      ),
      station: parent ? { type: "station", id: parent.id, name: parent.name } : void 0
    };
    return stop;
  }
  return {
    type: "location",
    id: location.id,
    name: location.name,
    poi: location.type === "poi" || void 0,
    address: location.type === "address" ? location.name : void 0,
    latitude: coords == null ? void 0 : coords.latitude,
    longitude: coords == null ? void 0 : coords.longitude
  };
}
function mapLine(transportation) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
  if (!transportation) {
    return void 0;
  }
  const mapped = ((_a = transportation.product) == null ? void 0 : _a.class) !== void 0 ? MOT_MAP[transportation.product.class] : void 0;
  const operatorName = (_b = transportation.operator) == null ? void 0 : _b.name;
  const line = {
    type: "line",
    id: transportation.id,
    name: (_d = (_c = transportation.disassembledName) != null ? _c : transportation.number) != null ? _d : transportation.name,
    fahrtNr: (_h = (_e = transportation.properties) == null ? void 0 : _e.trainNumber) != null ? _h : (_g = (_f = transportation.properties) == null ? void 0 : _f.tripCode) == null ? void 0 : _g.toString(),
    product: (_j = mapped == null ? void 0 : mapped.product) != null ? _j : (_i = transportation.product) == null ? void 0 : _i.name,
    mode: mapped == null ? void 0 : mapped.mode,
    operator: operatorName ? { type: "operator", id: (_l = (_k = transportation.operator) == null ? void 0 : _k.code) != null ? _l : operatorName, name: operatorName } : void 0,
    public: true
  };
  return line;
}
function mapRemarks(infos, hints) {
  var _a, _b, _c, _d;
  const remarks = [];
  for (const info of infos != null ? infos : []) {
    const text = ((_a = info.content) == null ? void 0 : _a.trim()) || ((_b = info.subtitle) == null ? void 0 : _b.trim()) || ((_c = info.title) == null ? void 0 : _c.trim());
    if (text) {
      remarks.push({ type: "status", code: info.type, summary: info.title, text });
    }
  }
  for (const hint of hints != null ? hints : []) {
    const text = (_d = hint.content) == null ? void 0 : _d.trim();
    if (text) {
      remarks.push({ type: "hint", code: hint.infoType, text });
    }
  }
  return remarks.length > 0 ? remarks : void 0;
}
function isCancelled(isCancelled2, realtimeStatus) {
  if (isCancelled2 === true) {
    return true;
  }
  if (realtimeStatus == null ? void 0 : realtimeStatus.some((status) => CANCELLED_STATUS.has(status))) {
    return true;
  }
  return void 0;
}
function mapStopEvent(event, arrival = false) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w;
  const planned = arrival ? (_b = event.arrivalTimePlanned) != null ? _b : (_a = event.location) == null ? void 0 : _a.arrivalTimePlanned : (_d = event.departureTimePlanned) != null ? _d : (_c = event.location) == null ? void 0 : _c.departureTimePlanned;
  const estimated = arrival ? (_f = event.arrivalTimeEstimated) != null ? _f : (_e = event.location) == null ? void 0 : _e.arrivalTimeEstimated : (_h = event.departureTimeEstimated) != null ? _h : (_g = event.location) == null ? void 0 : _g.departureTimeEstimated;
  const platform = (_m = (_j = (_i = event.location) == null ? void 0 : _i.properties) == null ? void 0 : _j.platform) != null ? _m : (_l = (_k = event.location) == null ? void 0 : _k.properties) == null ? void 0 : _l.platformName;
  const plannedPlatform = (_o = (_n = event.location) == null ? void 0 : _n.properties) == null ? void 0 : _o.plannedPlatformName;
  return {
    // FPTF verlangt eine tripId. EFA hat keine eigene ID je Halt, deshalb aus Fahrt und
    // Soll-Zeit zusammengesetzt – innerhalb einer Antwort eindeutig und stabil über Polls.
    tripId: `${(_s = (_r = (_p = event.transportation) == null ? void 0 : _p.id) != null ? _r : (_q = event.transportation) == null ? void 0 : _q.name) != null ? _s : "trip"}#${planned != null ? planned : ""}`,
    direction: (_u = (_t = event.transportation) == null ? void 0 : _t.destination) == null ? void 0 : _u.name,
    line: mapLine(event.transportation),
    stop: mapLocation(event.location),
    when: estimated != null ? estimated : planned,
    plannedWhen: planned,
    delay: delayInSeconds(planned, estimated),
    platform,
    plannedPlatform: plannedPlatform != null ? plannedPlatform : platform,
    cancelled: isCancelled(event.isCancelled, event.realtimeStatus),
    remarks: mapRemarks(event.infos, event.hints),
    origin: ((_v = event.transportation) == null ? void 0 : _v.origin) ? mapLocation(event.transportation.origin) : void 0,
    destination: ((_w = event.transportation) == null ? void 0 : _w.destination) ? mapLocation(event.transportation.destination) : void 0
  };
}
function mapStopovers(stopSequence) {
  if (!(stopSequence == null ? void 0 : stopSequence.length)) {
    return void 0;
  }
  return stopSequence.map((stop) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    return {
      stop: mapLocation(stop),
      departure: (_a = stop.departureTimeEstimated) != null ? _a : stop.departureTimePlanned,
      plannedDeparture: stop.departureTimePlanned,
      departureDelay: delayInSeconds(stop.departureTimePlanned, stop.departureTimeEstimated),
      departurePlatform: (_b = stop.properties) == null ? void 0 : _b.platform,
      plannedDeparturePlatform: (_e = (_c = stop.properties) == null ? void 0 : _c.plannedPlatformName) != null ? _e : (_d = stop.properties) == null ? void 0 : _d.platform,
      arrival: (_f = stop.arrivalTimeEstimated) != null ? _f : stop.arrivalTimePlanned,
      plannedArrival: stop.arrivalTimePlanned,
      arrivalDelay: delayInSeconds(stop.arrivalTimePlanned, stop.arrivalTimeEstimated),
      arrivalPlatform: (_g = stop.properties) == null ? void 0 : _g.platform,
      plannedArrivalPlatform: (_j = (_h = stop.properties) == null ? void 0 : _h.plannedPlatformName) != null ? _j : (_i = stop.properties) == null ? void 0 : _i.platform
    };
  });
}
function mapLeg(leg) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B;
  const walking = isFootpath(leg.transportation);
  return {
    origin: mapLocation(leg.origin),
    destination: mapLocation(leg.destination),
    departure: (_c = (_a = leg.origin) == null ? void 0 : _a.departureTimeEstimated) != null ? _c : (_b = leg.origin) == null ? void 0 : _b.departureTimePlanned,
    plannedDeparture: (_d = leg.origin) == null ? void 0 : _d.departureTimePlanned,
    departureDelay: delayInSeconds((_e = leg.origin) == null ? void 0 : _e.departureTimePlanned, (_f = leg.origin) == null ? void 0 : _f.departureTimeEstimated),
    departurePlatform: (_h = (_g = leg.origin) == null ? void 0 : _g.properties) == null ? void 0 : _h.platform,
    plannedDeparturePlatform: (_m = (_j = (_i = leg.origin) == null ? void 0 : _i.properties) == null ? void 0 : _j.plannedPlatformName) != null ? _m : (_l = (_k = leg.origin) == null ? void 0 : _k.properties) == null ? void 0 : _l.platform,
    arrival: (_p = (_n = leg.destination) == null ? void 0 : _n.arrivalTimeEstimated) != null ? _p : (_o = leg.destination) == null ? void 0 : _o.arrivalTimePlanned,
    plannedArrival: (_q = leg.destination) == null ? void 0 : _q.arrivalTimePlanned,
    arrivalDelay: delayInSeconds((_r = leg.destination) == null ? void 0 : _r.arrivalTimePlanned, (_s = leg.destination) == null ? void 0 : _s.arrivalTimeEstimated),
    arrivalPlatform: (_u = (_t = leg.destination) == null ? void 0 : _t.properties) == null ? void 0 : _u.platform,
    plannedArrivalPlatform: (_z = (_w = (_v = leg.destination) == null ? void 0 : _v.properties) == null ? void 0 : _w.plannedPlatformName) != null ? _z : (_y = (_x = leg.destination) == null ? void 0 : _x.properties) == null ? void 0 : _y.platform,
    line: walking ? void 0 : mapLine(leg.transportation),
    direction: walking ? void 0 : (_B = (_A = leg.transportation) == null ? void 0 : _A.destination) == null ? void 0 : _B.name,
    stopovers: mapStopovers(leg.stopSequence),
    walking: walking || void 0,
    public: true,
    distance: leg.distance,
    cancelled: isCancelled(void 0, leg.realtimeStatus),
    remarks: mapRemarks(leg.infos, leg.hints)
  };
}
function buildWalkingLeg(from, to, duration) {
  var _a, _b;
  const departure = (_a = from == null ? void 0 : from.arrivalTimeEstimated) != null ? _a : from == null ? void 0 : from.arrivalTimePlanned;
  const arrival = (_b = to == null ? void 0 : to.departureTimeEstimated) != null ? _b : to == null ? void 0 : to.departureTimePlanned;
  return {
    origin: mapLocation(from),
    destination: mapLocation(to),
    departure,
    plannedDeparture: from == null ? void 0 : from.arrivalTimePlanned,
    arrival,
    plannedArrival: to == null ? void 0 : to.departureTimePlanned,
    walking: true,
    public: true,
    // Sekunden aus footPathInfo; nur setzen, wenn EFA sie liefert.
    distance: void 0,
    line: void 0,
    remarks: duration ? [{ type: "hint", code: "footpath", text: `Transfer on foot: ${Math.round(duration / 60)} min` }] : void 0
  };
}
function mapJourney(journey) {
  var _a, _b, _c;
  const legs = [];
  const efaLegs = (_a = journey.legs) != null ? _a : [];
  for (let i = 0; i < efaLegs.length; i++) {
    const leg = efaLegs[i];
    legs.push(mapLeg(leg));
    const next = efaLegs[i + 1];
    if (!next || leg.footPathInfoRedundant) {
      continue;
    }
    const after = (_b = leg.footPathInfo) == null ? void 0 : _b.find((info) => info.position === "AFTER");
    const before = (_c = next.footPathInfo) == null ? void 0 : _c.find((info) => info.position === "BEFORE");
    const transfer = after != null ? after : before;
    if (transfer && !isFootpath(next.transportation)) {
      legs.push(buildWalkingLeg(leg.destination, next.origin, transfer.duration));
    }
  }
  return { type: "journey", legs };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mapJourney,
  mapLine,
  mapLocation,
  mapRemarks,
  mapStopEvent,
  mapStopovers
});
//# sourceMappingURL=efaMapper.js.map

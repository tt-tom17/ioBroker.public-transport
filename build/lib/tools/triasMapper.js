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
var triasMapper_exports = {};
__export(triasMapper_exports, {
  delayInSeconds: () => delayInSeconds,
  durationInMinutes: () => durationInMinutes,
  mapJourney: () => mapJourney,
  mapLeg: () => mapLeg,
  mapLine: () => mapLine,
  mapLocation: () => mapLocation,
  mapProduct: () => mapProduct,
  mapRemarks: () => mapRemarks,
  mapStop: () => mapStop,
  mapStopEvent: () => mapStopEvent,
  ptModesForProducts: () => ptModesForProducts,
  readError: () => readError,
  textOf: () => textOf
});
module.exports = __toCommonJS(triasMapper_exports);
const PT_MODE_MAP = {
  air: { product: "aircraft", mode: "aircraft" },
  bus: { product: "bus", mode: "bus" },
  trolleyBus: { product: "bus", mode: "bus" },
  tram: { product: "tram", mode: "train" },
  coach: { product: "bus", mode: "bus" },
  rail: { product: "regional", mode: "train" },
  intercityRail: { product: "national", mode: "train" },
  urbanRail: { product: "suburban", mode: "train" },
  metro: { product: "subway", mode: "train" },
  water: { product: "ferry", mode: "watercraft" },
  cableway: { product: "cableCar", mode: "gondola" },
  funicular: { product: "cableCar", mode: "gondola" },
  // Der Adapter kennt kein eigenes Taxi-Produkt; Anruf-Sammeltaxis laufen deshalb unter Bus,
  // behalten aber die FPTF-Verkehrsmittelart `taxi`.
  taxi: { product: "bus", mode: "taxi" }
};
const SUBMODE_OVERRIDES = {
  // RailSubmodeEnumeration
  highSpeedRail: { product: "national", mode: "train" },
  suburbanRailway: { product: "suburban", mode: "train" },
  longDistance: { product: "national", mode: "train" },
  international: { product: "national", mode: "train" },
  sleeperRailService: { product: "national", mode: "train" },
  nightRail: { product: "national", mode: "train" },
  carTransportRailService: { product: "national", mode: "train" },
  crossCountryRail: { product: "national", mode: "train" },
  replacementRailService: { product: "bus", mode: "bus" },
  rackAndPinionRailway: { product: "cableCar", mode: "gondola" },
  // MetroSubmodeEnumeration: `urbanRailway` ist die S-Bahn, nicht die U-Bahn.
  urbanRailway: { product: "suburban", mode: "train" },
  // AirSubmodeEnumeration: Ein Kanalschiff ist trotz Einordnung unter `air` kein Flug.
  canalBarge: { product: "ferry", mode: "watercraft" }
};
const SUBMODE_FIELDS = [
  "RailSubmode",
  "BusSubmode",
  "TramSubmode",
  "MetroSubmode",
  "WaterSubmode",
  "AirSubmode",
  "CoachSubmode",
  "FunicularSubmode",
  "TelecabinSubmode",
  "TaxiSubmode"
];
const UNSPECIFIC_MODES = /* @__PURE__ */ new Set(["unknown", "undefined", "all", "undefinedFunicular"]);
function textOf(text) {
  if (typeof text === "string") {
    return text.trim() || void 0;
  }
  const value = text == null ? void 0 : text.Text;
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function delayInSeconds(planned, estimated) {
  if (!planned || !estimated) {
    return void 0;
  }
  const from = Date.parse(planned);
  const to = Date.parse(estimated);
  if (Number.isNaN(from) || Number.isNaN(to)) {
    return void 0;
  }
  return Math.round((to - from) / 1e3);
}
function durationInMinutes(duration) {
  if (!duration) {
    return void 0;
  }
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(duration.trim());
  if (!match) {
    return void 0;
  }
  const [, days, hours, minutes, seconds] = match;
  const total = Number(days != null ? days : 0) * 1440 + Number(hours != null ? hours : 0) * 60 + Number(minutes != null ? minutes : 0) + Number(seconds != null ? seconds : 0) / 60;
  return total > 0 ? Math.round(total) : void 0;
}
function mapProduct(service) {
  var _a;
  const mode = (_a = service == null ? void 0 : service.ServiceSection) == null ? void 0 : _a.Mode;
  if (!mode) {
    return void 0;
  }
  for (const field of SUBMODE_FIELDS) {
    const value = mode[field];
    if (typeof value === "string" && !UNSPECIFIC_MODES.has(value)) {
      const override = SUBMODE_OVERRIDES[value];
      if (override) {
        return override;
      }
      break;
    }
  }
  const ptMode = mode.PtMode;
  return ptMode && !UNSPECIFIC_MODES.has(ptMode) ? PT_MODE_MAP[ptMode] : void 0;
}
function mapLine(service) {
  var _a, _b;
  if (!service) {
    return void 0;
  }
  const section = service.ServiceSection;
  const mapping = mapProduct(service);
  const name = (_b = textOf(section == null ? void 0 : section.PublishedLineName)) != null ? _b : textOf((_a = section == null ? void 0 : section.Mode) == null ? void 0 : _a.Name);
  return {
    type: "line",
    id: section == null ? void 0 : section.LineRef,
    name,
    product: mapping == null ? void 0 : mapping.product,
    mode: mapping == null ? void 0 : mapping.mode,
    operator: (section == null ? void 0 : section.OperatorRef) ? { type: "operator", id: section.OperatorRef, name: section.OperatorRef } : void 0
  };
}
function mapStop(call) {
  var _a;
  const id = call == null ? void 0 : call.StopPointRef;
  const name = (_a = textOf(call == null ? void 0 : call.StopPointName)) != null ? _a : textOf(call == null ? void 0 : call.LocationName);
  if (!id && !name) {
    return void 0;
  }
  return { type: "stop", id, name };
}
function mapLocation(result) {
  var _a, _b, _c;
  const stopPoint = (_a = result.Location) == null ? void 0 : _a.StopPoint;
  const position = (_b = result.Location) == null ? void 0 : _b.GeoPosition;
  const latitude = (position == null ? void 0 : position.Latitude) !== void 0 ? Number(position.Latitude) : void 0;
  const longitude = (position == null ? void 0 : position.Longitude) !== void 0 ? Number(position.Longitude) : void 0;
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
  const ort = textOf((_c = result.Location) == null ? void 0 : _c.LocationName);
  const halt = textOf(stopPoint == null ? void 0 : stopPoint.StopPointName);
  const name = ort && halt && !halt.includes(ort) ? `${ort} ${halt}` : halt != null ? halt : ort;
  if (!(stopPoint == null ? void 0 : stopPoint.StopPointRef)) {
    return {
      type: "location",
      name,
      latitude: hasCoordinates ? latitude : void 0,
      longitude: hasCoordinates ? longitude : void 0
    };
  }
  return {
    type: "stop",
    id: stopPoint.StopPointRef,
    name,
    location: hasCoordinates ? { type: "location", latitude, longitude } : void 0
  };
}
function mapRemarks(attributes) {
  const hints = (attributes != null ? attributes : []).map((attribute) => ({ text: textOf(attribute.Text), code: attribute.Code })).filter((hint) => Boolean(hint.text)).map((hint) => ({ type: "hint", code: hint.code, text: hint.text }));
  return hints.length > 0 ? hints : void 0;
}
function isCancelled(service) {
  if ((service == null ? void 0 : service.Cancelled) === void 0) {
    return void 0;
  }
  return String(service.Cancelled).toLowerCase() === "true";
}
function mapStopEvent(result, arrival = false) {
  var _a, _b, _c, _d, _e, _f, _g;
  const call = (_b = (_a = result.StopEvent) == null ? void 0 : _a.ThisCall) == null ? void 0 : _b.CallAtStop;
  const service = (_c = result.StopEvent) == null ? void 0 : _c.Service;
  const times = arrival ? call == null ? void 0 : call.ServiceArrival : call == null ? void 0 : call.ServiceDeparture;
  const planned = times == null ? void 0 : times.TimetabledTime;
  const estimated = times == null ? void 0 : times.EstimatedTime;
  const plannedPlatform = textOf(call == null ? void 0 : call.PlannedBay);
  const platform = (_d = textOf(call == null ? void 0 : call.EstimatedBay)) != null ? _d : plannedPlatform;
  return {
    // `JourneyRef` ist die Fahrtkennung des Verbunds und über Polls hinweg stabil. Fehlt
    // sie, wird wie im EFA-Backend aus Linie und Sollzeit ein Ersatz gebildet.
    tripId: (_g = service == null ? void 0 : service.JourneyRef) != null ? _g : `${(_f = (_e = service == null ? void 0 : service.ServiceSection) == null ? void 0 : _e.LineRef) != null ? _f : "trip"}#${planned != null ? planned : ""}`,
    direction: textOf(service == null ? void 0 : service.DestinationText),
    line: mapLine(service),
    stop: mapStop(call),
    when: estimated != null ? estimated : planned,
    plannedWhen: planned,
    delay: delayInSeconds(planned, estimated),
    platform,
    plannedPlatform,
    cancelled: isCancelled(service),
    remarks: mapRemarks(service == null ? void 0 : service.Attribute),
    origin: (service == null ? void 0 : service.OriginText) ? { type: "stop", id: service.OriginStopPointRef, name: textOf(service.OriginText) } : void 0,
    destination: (service == null ? void 0 : service.DestinationText) ? {
      type: "stop",
      id: service.DestinationStopPointRef,
      name: textOf(service.DestinationText)
    } : void 0
  };
}
function mapLeg(leg) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  if (leg.TimedLeg) {
    const timed = leg.TimedLeg;
    const board = timed.LegBoard;
    const alight = timed.LegAlight;
    const departurePlanned = (_a = board == null ? void 0 : board.ServiceDeparture) == null ? void 0 : _a.TimetabledTime;
    const departureEstimated = (_b = board == null ? void 0 : board.ServiceDeparture) == null ? void 0 : _b.EstimatedTime;
    const arrivalPlanned = (_c = alight == null ? void 0 : alight.ServiceArrival) == null ? void 0 : _c.TimetabledTime;
    const arrivalEstimated = (_d = alight == null ? void 0 : alight.ServiceArrival) == null ? void 0 : _d.EstimatedTime;
    const plannedDeparturePlatform = textOf(board == null ? void 0 : board.PlannedBay);
    const plannedArrivalPlatform = textOf(alight == null ? void 0 : alight.PlannedBay);
    return {
      tripId: (_e = timed.Service) == null ? void 0 : _e.JourneyRef,
      origin: mapStop(board),
      destination: mapStop(alight),
      departure: departureEstimated != null ? departureEstimated : departurePlanned,
      plannedDeparture: departurePlanned,
      departureDelay: delayInSeconds(departurePlanned, departureEstimated),
      departurePlatform: (_f = textOf(board == null ? void 0 : board.EstimatedBay)) != null ? _f : plannedDeparturePlatform,
      plannedDeparturePlatform,
      arrival: arrivalEstimated != null ? arrivalEstimated : arrivalPlanned,
      plannedArrival: arrivalPlanned,
      arrivalDelay: delayInSeconds(arrivalPlanned, arrivalEstimated),
      arrivalPlatform: (_g = textOf(alight == null ? void 0 : alight.EstimatedBay)) != null ? _g : plannedArrivalPlatform,
      plannedArrivalPlatform,
      line: mapLine(timed.Service),
      direction: textOf((_h = timed.Service) == null ? void 0 : _h.DestinationText),
      cancelled: isCancelled(timed.Service),
      remarks: mapRemarks((_i = timed.Service) == null ? void 0 : _i.Attribute),
      stopovers: ((_j = timed.LegIntermediates) != null ? _j : []).map((stop) => {
        var _a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2;
        return {
          stop: mapStop(stop),
          arrival: (_c2 = (_a2 = stop.ServiceArrival) == null ? void 0 : _a2.EstimatedTime) != null ? _c2 : (_b2 = stop.ServiceArrival) == null ? void 0 : _b2.TimetabledTime,
          plannedArrival: (_d2 = stop.ServiceArrival) == null ? void 0 : _d2.TimetabledTime,
          departure: (_g2 = (_e2 = stop.ServiceDeparture) == null ? void 0 : _e2.EstimatedTime) != null ? _g2 : (_f2 = stop.ServiceDeparture) == null ? void 0 : _f2.TimetabledTime,
          plannedDeparture: (_h2 = stop.ServiceDeparture) == null ? void 0 : _h2.TimetabledTime
        };
      }).filter((stopover) => stopover.stop)
    };
  }
  const continuous = (_k = leg.ContinuousLeg) != null ? _k : leg.InterchangeLeg;
  if (!continuous) {
    return void 0;
  }
  const minutes = durationInMinutes(continuous.Duration);
  const start = continuous.LegStart;
  const end = continuous.LegEnd;
  const departure = (_l = start == null ? void 0 : start.ServiceDeparture) == null ? void 0 : _l.TimetabledTime;
  const arrival = (_m = end == null ? void 0 : end.ServiceArrival) == null ? void 0 : _m.TimetabledTime;
  return {
    origin: mapStop(start),
    destination: mapStop(end),
    departure,
    plannedDeparture: departure,
    arrival,
    plannedArrival: arrival,
    walking: true,
    // Die Dauer gehört nicht ins FPTF-Schema, ist aber die einzige belastbare Angabe, wenn
    // TRIAS für den Fußweg keine Zeiten mitliefert.
    distance: void 0,
    public: false,
    remarks: minutes ? [{ type: "hint", text: `${minutes} min` }] : void 0
  };
}
function mapJourney(result) {
  var _a, _b;
  const trip = result.Trip;
  const legs = ((_a = trip == null ? void 0 : trip.TripLeg) != null ? _a : []).map(mapLeg).filter((leg) => Boolean(leg));
  return {
    type: "journey",
    refreshToken: (_b = trip == null ? void 0 : trip.TripId) != null ? _b : result.ResultId,
    legs
  };
}
function readError(messages) {
  const relevant = (messages != null ? messages : []).filter((message) => message.Code !== void 0 || textOf(message.Text));
  if (relevant.length === 0) {
    return void 0;
  }
  return relevant.map((message) => {
    var _a, _b;
    return `${(_a = message.Code) != null ? _a : "?"}: ${(_b = textOf(message.Text)) != null ? _b : "unknown error"}`;
  }).join(" | ");
}
const SUBMODE_BY_MODE = {
  rail: [
    "highSpeedRail",
    "suburbanRailway",
    "longDistance",
    "international",
    "sleeperRailService",
    "nightRail",
    "carTransportRailService",
    "crossCountryRail",
    "replacementRailService",
    "rackAndPinionRailway"
  ],
  metro: ["urbanRailway"],
  air: ["canalBarge"]
};
function ptModesForProducts(products) {
  const entries = Object.entries(products != null ? products : {});
  const wanted = new Set(entries.filter(([, enabled]) => enabled).map(([id]) => id));
  if (wanted.size === 0) {
    return void 0;
  }
  const modes = /* @__PURE__ */ new Set();
  for (const [ptMode, mapping] of Object.entries(PT_MODE_MAP)) {
    if (wanted.has(mapping.product)) {
      modes.add(ptMode);
    }
  }
  for (const [ptMode, submodes] of Object.entries(SUBMODE_BY_MODE)) {
    if (submodes.some((submode) => wanted.has(SUBMODE_OVERRIDES[submode].product))) {
      modes.add(ptMode);
    }
  }
  return modes.size > 0 && modes.size < Object.keys(PT_MODE_MAP).length ? [...modes] : void 0;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  delayInSeconds,
  durationInMinutes,
  mapJourney,
  mapLeg,
  mapLine,
  mapLocation,
  mapProduct,
  mapRemarks,
  mapStop,
  mapStopEvent,
  ptModesForProducts,
  readError,
  textOf
});
//# sourceMappingURL=triasMapper.js.map

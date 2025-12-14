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
  mapJourneyToJourneyState: () => mapJourneyToJourneyState,
  mapJourneysToJourneyStates: () => mapJourneysToJourneyStates,
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
    hint: hints.length > 0 ? hints.join("\n") : void 0,
    warning: warnings.length > 0 ? warnings.join("\n") : void 0,
    status: statuses.length > 0 ? statuses.join("\n") : void 0
  };
}
function mapDepartureToDepartureState(departure) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C;
  return {
    when: (_a = departure.when) != null ? _a : void 0,
    plannedWhen: (_b = departure.plannedWhen) != null ? _b : void 0,
    delay: (_c = departure.delay) != null ? _c : void 0,
    direction: (_d = departure.direction) != null ? _d : void 0,
    platform: (_e = departure.platform) != null ? _e : void 0,
    plannedPlatform: (_f = departure.plannedPlatform) != null ? _f : void 0,
    line: {
      name: (_h = (_g = departure.line) == null ? void 0 : _g.name) != null ? _h : void 0,
      fahrtNr: (_j = (_i = departure.line) == null ? void 0 : _i.fahrtNr) != null ? _j : void 0,
      productName: (_l = (_k = departure.line) == null ? void 0 : _k.productName) != null ? _l : void 0,
      mode: (_n = (_m = departure.line) == null ? void 0 : _m.mode) != null ? _n : void 0,
      product: (_p = (_o = departure.line) == null ? void 0 : _o.product) != null ? _p : void 0,
      operator: (_s = (_r = (_q = departure.line) == null ? void 0 : _q.operator) == null ? void 0 : _r.name) != null ? _s : void 0
    },
    remarks: groupRemarksByType((_t = departure.remarks) != null ? _t : []),
    stopinfo: {
      name: (_v = (_u = departure.stop) == null ? void 0 : _u.name) != null ? _v : void 0,
      id: (_x = (_w = departure.stop) == null ? void 0 : _w.id) != null ? _x : void 0,
      type: (_z = (_y = departure.stop) == null ? void 0 : _y.type) != null ? _z : void 0,
      location: ((_A = departure.stop) == null ? void 0 : _A.location) ? {
        latitude: (_B = departure.stop.location.latitude) != null ? _B : void 0,
        longitude: (_C = departure.stop.location.longitude) != null ? _C : void 0
      } : void 0
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
  var _a, _b;
  return {
    name: station.name,
    id: station.id,
    type: station.type,
    location: station.location ? {
      latitude: station.location.latitude,
      longitude: station.location.longitude
    } : void 0,
    stops: station.type === "station" ? (_b = (_a = station.stops) == null ? void 0 : _a.filter((stop) => stop.type === "stop").map((stop) => {
      var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
      return {
        name: (_a2 = stop.name) != null ? _a2 : void 0,
        id: (_b2 = stop.id) != null ? _b2 : void 0,
        type: (_c = stop.type) != null ? _c : void 0,
        location: stop.location ? {
          latitude: (_d = stop.location.latitude) != null ? _d : void 0,
          longitude: (_e = stop.location.longitude) != null ? _e : void 0
        } : void 0,
        products: stop.products ? {
          suburban: (_f = stop.products.suburban) != null ? _f : void 0,
          subway: (_g = stop.products.subway) != null ? _g : void 0,
          tram: (_h = stop.products.tram) != null ? _h : void 0,
          bus: (_i = stop.products.bus) != null ? _i : void 0,
          ferry: (_j = stop.products.ferry) != null ? _j : void 0,
          express: (_k = stop.products.express) != null ? _k : void 0,
          regional: (_l = stop.products.regional) != null ? _l : void 0,
          regionalexpress: (_m = stop.products.regionalExpress) != null ? _m : void 0,
          national: (_n = stop.products.national) != null ? _n : void 0,
          nationalexpress: (_o = stop.products.nationalExpress) != null ? _o : void 0
        } : void 0
      };
    })) != null ? _b : void 0 : void 0
  };
}
function mapJourneyToJourneyState(journey) {
  var _a, _b;
  return {
    section: (_b = (_a = journey.legs) == null ? void 0 : _a.map((leg) => {
      var _a2, _b2, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F, _G, _H, _I, _J, _K, _L, _M, _N, _O, _P, _Q, _R, _S;
      return {
        tripId: (_a2 = leg.tripId) != null ? _a2 : void 0,
        stationFrom: {
          id: (_c = (_b2 = leg.origin) == null ? void 0 : _b2.id) != null ? _c : void 0,
          name: (_e = (_d = leg.origin) == null ? void 0 : _d.name) != null ? _e : void 0,
          type: (_g = (_f = leg.origin) == null ? void 0 : _f.type) != null ? _g : void 0,
          location: ((_h = leg.origin) == null ? void 0 : _h.type) === "station" || ((_i = leg.origin) == null ? void 0 : _i.type) === "stop" ? leg.origin.location ? {
            latitude: (_j = leg.origin.location.latitude) != null ? _j : void 0,
            longitude: (_k = leg.origin.location.longitude) != null ? _k : void 0
          } : void 0 : void 0
          //products: leg.origin && 'products' in leg.origin ? leg.origin.products : undefined,
        },
        stationTo: {
          id: (_m = (_l = leg.destination) == null ? void 0 : _l.id) != null ? _m : void 0,
          name: (_o = (_n = leg.destination) == null ? void 0 : _n.name) != null ? _o : void 0,
          type: (_q = (_p = leg.destination) == null ? void 0 : _p.type) != null ? _q : void 0,
          location: ((_r = leg.destination) == null ? void 0 : _r.type) === "station" || ((_s = leg.destination) == null ? void 0 : _s.type) === "stop" ? leg.destination.location ? {
            latitude: (_t = leg.destination.location.latitude) != null ? _t : void 0,
            longitude: (_u = leg.destination.location.longitude) != null ? _u : void 0
          } : void 0 : void 0
          //products: leg.destination && 'products' in leg.destination ? leg.destination.products : undefined,
        },
        departure: (_v = leg.departure) != null ? _v : void 0,
        plannedDeparture: (_w = leg.plannedDeparture) != null ? _w : void 0,
        departureDelay: (_x = leg.departureDelay) != null ? _x : void 0,
        arrival: (_y = leg.arrival) != null ? _y : void 0,
        plannedArrival: (_z = leg.plannedArrival) != null ? _z : void 0,
        arrivalDelay: (_A = leg.arrivalDelay) != null ? _A : void 0,
        //reachable: leg.reachable ?? undefined,
        line: leg.line ? {
          //type: leg.line.type ?? undefined,
          id: (_B = leg.line.id) != null ? _B : void 0,
          name: (_C = leg.line.name) != null ? _C : void 0,
          fahrtNr: (_D = leg.line.fahrtNr) != null ? _D : void 0,
          productName: (_E = leg.line.productName) != null ? _E : void 0,
          mode: (_F = leg.line.mode) != null ? _F : void 0,
          product: (_G = leg.line.product) != null ? _G : void 0,
          operator: (_I = (_H = leg.line.operator) == null ? void 0 : _H.name) != null ? _I : void 0
        } : void 0,
        direction: (_J = leg.direction) != null ? _J : void 0,
        arrivalPlatform: (_K = leg.arrivalPlatform) != null ? _K : void 0,
        plannedArrivalPlatform: (_L = leg.plannedArrivalPlatform) != null ? _L : void 0,
        departurePlatform: (_M = leg.departurePlatform) != null ? _M : void 0,
        plannedDeparturePlatform: (_N = leg.plannedDeparturePlatform) != null ? _N : void 0,
        arrivalPrognosisType: (_O = leg.arrivalPrognosisType) != null ? _O : void 0,
        departurePrognosisType: (_P = leg.departurePrognosisType) != null ? _P : void 0,
        walking: (_Q = leg.walking) != null ? _Q : void 0,
        distance: (_R = leg.distance) != null ? _R : void 0,
        remarks: leg.remarks ? groupRemarksByType(leg.remarks) : void 0,
        /*cycle: leg.cycle
            ? {
                  min: leg.cycle.min ?? undefined,
                  max: leg.cycle.max ?? undefined,
                  nr: leg.cycle.nr ?? undefined,
              }
            : undefined,*/
        alternatives: (_S = leg.alternatives) == null ? void 0 : _S.map((alt) => {
          var _a3, _b3, _c2, _d2, _e2, _f2, _g2, _h2, _i2, _j2, _k2, _l2, _m2, _n2;
          return {
            tripId: (_a3 = alt.tripId) != null ? _a3 : void 0,
            line: alt.line ? {
              type: (_b3 = alt.line.type) != null ? _b3 : void 0,
              id: (_c2 = alt.line.id) != null ? _c2 : void 0,
              name: (_d2 = alt.line.name) != null ? _d2 : void 0,
              fahrtNr: (_e2 = alt.line.fahrtNr) != null ? _e2 : void 0,
              productName: (_f2 = alt.line.productName) != null ? _f2 : void 0,
              mode: (_g2 = alt.line.mode) != null ? _g2 : void 0,
              product: (_h2 = alt.line.product) != null ? _h2 : void 0,
              operator: (_j2 = (_i2 = alt.line.operator) == null ? void 0 : _i2.name) != null ? _j2 : void 0
            } : void 0,
            direction: (_k2 = alt.direction) != null ? _k2 : void 0,
            when: (_l2 = alt.when) != null ? _l2 : void 0,
            plannedWhen: (_m2 = alt.plannedWhen) != null ? _m2 : void 0,
            delay: (_n2 = alt.delay) != null ? _n2 : void 0
          };
        })
      };
    })) != null ? _b : void 0
    //remarks: journey.remarks ? groupRemarksByType(journey.remarks) : undefined,
    //refreshToken: journey.refreshToken ?? undefined,
  };
}
function mapJourneysToJourneyStates(journeys) {
  return journeys.map(mapJourneyToJourneyState);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mapDepartureToDepartureState,
  mapDeparturesResponseToStates,
  mapDeparturesToDepartureStates,
  mapJourneyToJourneyState,
  mapJourneysToJourneyStates,
  mapStationToStationState
});
//# sourceMappingURL=mapper.js.map

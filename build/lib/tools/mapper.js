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
  mapDeparturesToDepartureStates: () => mapDeparturesToDepartureStates
});
module.exports = __toCommonJS(mapper_exports);
function groupRemarksByType(remarks) {
  const hints = [];
  const warnings = [];
  const statuses = [];
  for (const remark of remarks) {
    switch (remark.type) {
      case "hint":
        hints.push(remark.text);
        break;
      case "warning":
        warnings.push(remark.text);
        break;
      case "status":
        statuses.push(remark.text);
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
  return {
    when: departure.when,
    plannedWhen: departure.plannedWhen,
    delay: departure.delay,
    direction: departure.direction,
    platform: departure.platform,
    plannedPlatform: departure.plannedPlatform,
    line: {
      name: departure.line.name,
      fahrtNr: departure.line.fahrtNr,
      productName: departure.line.productName,
      mode: departure.line.mode,
      operator: departure.line.operator.name
    },
    remarks: groupRemarksByType(departure.remarks)
  };
}
function mapDeparturesToDepartureStates(departures) {
  return departures.map(mapDepartureToDepartureState);
}
function mapDeparturesResponseToStates(response) {
  return mapDeparturesToDepartureStates(response.departures);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mapDepartureToDepartureState,
  mapDeparturesResponseToStates,
  mapDeparturesToDepartureStates
});
//# sourceMappingURL=mapper.js.map

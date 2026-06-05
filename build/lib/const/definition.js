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
var definition_exports = {};
__export(definition_exports, {
  Defaults: () => Defaults,
  defaultChannel: () => defaultChannel,
  defaultDevice: () => defaultDevice,
  defaultFolder: () => defaultFolder,
  genericStateObjects: () => genericStateObjects
});
module.exports = __toCommonJS(definition_exports);
const defaultChannel = {
  _id: "",
  type: "channel",
  common: {
    name: "Hey no description... "
  },
  native: {}
};
const defaultFolder = {
  _id: "",
  type: "folder",
  common: {
    name: "Hey no description... "
  },
  native: {}
};
const defaultDevice = {
  _id: "",
  type: "device",
  common: {
    name: "Hey no description... "
  },
  native: {}
};
function stateObj(name, type, role, desc = name) {
  return {
    _id: "",
    type: "state",
    common: {
      name,
      type,
      role,
      read: true,
      write: false,
      desc
    },
    native: {}
  };
}
function folderObj(name) {
  return {
    _id: "",
    type: "folder",
    common: { name },
    native: {}
  };
}
const Departure = {
  when: stateObj("When", "string", "date", "Departure time"),
  plannedWhen: stateObj("Planned When", "string", "date", "Planned Departure time"),
  delay: stateObj("Delay", "number", "time", "Delay in seconds"),
  direction: stateObj("Direction", "string", "text", "Direction of the vehicle"),
  plannedPlatform: stateObj("Planned Platform", "string", "text", "Planned Platform for Departure"),
  platform: stateObj("Platform", "string", "text", "Platform for Departure")
};
const StationStopInfo = {
  name: stateObj("Stop Name", "string", "text", "Stop Name"),
  id: stateObj("Stop ID", "string", "text", "Stop ID"),
  type: stateObj("Type", "string", "text", "Type")
};
const Location = {
  latitude: stateObj("Location Latitude", "number", "value.gps.latitude", "Location Latitude"),
  longitude: stateObj("Location Longitude", "number", "value.gps.longitude", "Location Longitude")
};
const Line = {
  id: stateObj("Line ID", "string", "text", "Line ID"),
  name: stateObj("Line Name", "string", "text", "Line Name"),
  fahrtNr: stateObj("Fahrt Number", "string", "text", "Fahrt Number"),
  productName: stateObj("Product Name", "string", "text", "Product Name"),
  mode: stateObj("Mode", "string", "text", "Mode"),
  product: stateObj("Product", "string", "text", "Product"),
  operator: stateObj("Operator", "string", "text", "Operator")
};
const Remarks = {
  hint: stateObj("Remarks Hint", "string", "text", "Remarks Hint"),
  warning: stateObj("Remarks Warning", "string", "text", "Remarks Warning"),
  status: stateObj("Remarks Status", "string", "text", "Remarks Status")
};
const Leg = {
  tripId: stateObj("Trip ID", "string", "text", "Trip ID"),
  departure: stateObj("Departure", "string", "date", "Departure time"),
  plannedDeparture: stateObj("Planned Departure", "string", "date", "Planned Departure time"),
  departureDelay: stateObj("Departure Delay", "number", "time", "Departure Delay in seconds"),
  arrival: stateObj("Arrival", "string", "date", "Arrival time"),
  plannedArrival: stateObj("Planned Arrival", "string", "date", "Planned Arrival time"),
  arrivalDelay: stateObj("Arrival Delay", "number", "time", "Arrival Delay in seconds"),
  direction: stateObj("Direction", "string", "text", "Direction of the vehicle"),
  arrivalPlatform: stateObj("Arrival Platform", "string", "text", "Arrival Platform"),
  plannedArrivalPlatform: stateObj("Planned Arrival Platform", "string", "text", "Planned Arrival Platform"),
  departurePlatform: stateObj("Departure Platform", "string", "text", "Departure Platform"),
  plannedDeparturePlatform: stateObj("Planned Departure Platform", "string", "text", "Planned Departure Platform"),
  arrivalPrognosisType: stateObj("Arrival Prognosis Type", "string", "text", "Arrival Prognosis Type"),
  departurePrognosisType: stateObj("Departure Prognosis Type", "string", "text", "Departure Prognosis Type"),
  walking: stateObj("Walking", "boolean", "indicator", "Is this section a transfer?"),
  distance: stateObj("Distance", "number", "value.distance", "Distance in meters")
};
const AlternativeTrip = {
  tripId: stateObj("Trip ID", "string", "text", "Trip ID"),
  direction: stateObj("Direction", "string", "text", "Direction"),
  when: stateObj("When", "string", "date", "Departure/Arrival time"),
  plannedWhen: stateObj("Planned When", "string", "date", "Planned Departure/Arrival time"),
  delay: stateObj("Delay", "number", "time", "Delay in seconds")
};
const Products = {
  suburban: stateObj("Suburban", "boolean", "indicator", "Is Suburban transport included"),
  subway: stateObj("Subway", "boolean", "indicator", "Is Subway transport included"),
  tram: stateObj("Tram", "boolean", "indicator", "Is Tram transport included"),
  bus: stateObj("Bus", "boolean", "indicator", "Is Bus transport included"),
  ferry: stateObj("Ferry", "boolean", "indicator", "Is Ferry transport included"),
  express: stateObj("Express", "boolean", "indicator", "Is Express transport included"),
  regional: stateObj("Regional", "boolean", "indicator", "Is Regional transport included"),
  regionalExpress: stateObj("Regional Express", "boolean", "indicator", "Is Regional Express transport included"),
  national: stateObj("National", "boolean", "indicator", "Is National transport included"),
  nationalExpress: stateObj("National Express", "boolean", "indicator", "Is National Express transport included")
};
const genericStateObjects = {
  default: {
    _id: "No_definition",
    type: "state",
    common: {
      name: "StateObjects.state",
      type: "string",
      role: "text",
      read: true,
      write: false
    },
    native: {}
  },
  customString: {
    _id: "User_State",
    type: "state",
    common: {
      name: "StateObjects.customString",
      type: "string",
      role: "text",
      read: true,
      write: false
    },
    native: {}
  },
  departure: {
    ...Departure,
    _channel: folderObj("Abfahrt"),
    _array: folderObj("Abfahrt"),
    line: {
      ...Line,
      _channel: folderObj("Line")
    },
    stopinfo: {
      ...StationStopInfo,
      _channel: folderObj("Stopinfo"),
      location: {
        ...Location,
        _channel: folderObj("Location")
      }
    },
    remarks: {
      ...Remarks,
      _channel: folderObj("Remarks")
    }
  },
  journey: {
    _channel: folderObj("Journey"),
    _array: folderObj("Journey"),
    section: {
      ...Leg,
      _channel: folderObj("Section"),
      _array: folderObj("Section"),
      stationFrom: {
        ...StationStopInfo,
        _channel: folderObj("Station From"),
        location: {
          ...Location,
          _channel: folderObj("Location")
        }
      },
      stationTo: {
        ...StationStopInfo,
        _channel: folderObj("Station To"),
        location: {
          ...Location,
          _channel: folderObj("Location")
        }
      },
      line: {
        ...Line,
        _channel: folderObj("Line")
      },
      remarks: {
        ...Remarks,
        _channel: folderObj("Remarks")
      },
      alternatives: {
        ...AlternativeTrip,
        _channel: folderObj("Alternative"),
        _array: folderObj("Alternative"),
        line: {
          ...Line,
          _channel: folderObj("Line")
        }
      }
    }
  },
  station: {
    ...StationStopInfo,
    _channel: folderObj("Station"),
    location: {
      ...Location,
      _channel: folderObj("Location")
    },
    stops: {
      ...StationStopInfo,
      _channel: folderObj("Stop"),
      _array: folderObj("Stop"),
      location: {
        ...Location,
        _channel: folderObj("Location")
      },
      products: {
        ...Products,
        _channel: folderObj("Products")
      }
    }
  }
};
const Defaults = {
  state: {
    _id: "No_definition",
    type: "state",
    common: {
      name: "No definition",
      type: "string",
      role: "text",
      read: true,
      write: false
    },
    native: {}
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Defaults,
  defaultChannel,
  defaultDevice,
  defaultFolder,
  genericStateObjects
});
//# sourceMappingURL=definition.js.map

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
const TimeTableData = {
  departureTime: {
    _id: "",
    type: "state",
    common: {
      name: "Departure Time",
      type: "number",
      role: "value.time",
      read: true,
      write: false,
      desc: "Departure Time as timestamp"
    },
    native: {}
  },
  departureDelaySeconds: {
    _id: "",
    type: "state",
    common: {
      name: "Departure Delay Seconds",
      type: "number",
      role: "value.interval",
      read: true,
      write: false,
      desc: "Departure Delay in Seconds"
    },
    native: {}
  },
  departureDelayed: {
    _id: "",
    type: "state",
    common: {
      name: "Departure Delayed",
      type: "boolean",
      role: "indicator",
      read: true,
      write: false,
      desc: "Is the Departure delayed?"
    },
    native: {}
  },
  departureOnTime: {
    _id: "",
    type: "state",
    common: {
      name: "Departure On Time",
      type: "boolean",
      role: "indicator",
      read: true,
      write: false,
      desc: "Is the Departure on time?"
    },
    native: {}
  },
  departurePlanned: {
    _id: "",
    type: "state",
    common: {
      name: "Departure Planned Time",
      type: "number",
      role: "value.time",
      read: true,
      write: false,
      desc: "Planned Departure Time as timestamp"
    },
    native: {}
  },
  direction: {
    _id: "",
    type: "state",
    common: {
      name: "Direction",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Direction of the vehicle"
    },
    native: {}
  },
  json: {
    _id: "",
    type: "state",
    common: {
      name: "TimeTableData JSON",
      type: "string",
      role: "json",
      read: true,
      write: false,
      desc: "TimeTableData JSON"
    },
    native: {}
  },
  mode: {
    _id: "",
    type: "state",
    common: {
      name: "Mode",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Mode of the vehicle"
    },
    native: {}
  },
  name: {
    _id: "",
    type: "state",
    common: {
      name: "Name",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Name of the vehicle"
    },
    native: {}
  },
  operator: {
    _id: "",
    type: "state",
    common: {
      name: "Operator",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Operator of the vehicle"
    },
    native: {}
  },
  plannedPlatform: {
    _id: "",
    type: "state",
    common: {
      name: "Planned Platform",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Planned Platform for Departure"
    },
    native: {}
  },
  platform: {
    _id: "",
    type: "state",
    common: {
      name: "Platform",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Platform for Departure"
    },
    native: {}
  },
  product: {
    _id: "",
    type: "state",
    common: {
      name: "Product",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Product of the vehicle"
    },
    native: {}
  }
};
const Station = {
  customName: {
    _id: "",
    type: "state",
    common: {
      name: "Custom Name",
      type: "string",
      role: "text",
      read: true,
      write: true,
      desc: "Custom Name for the Station"
    },
    native: {}
  },
  name: {
    _id: "",
    type: "state",
    common: {
      name: "Station Name",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Station Name"
    },
    native: {}
  },
  type: {
    _id: "",
    type: "state",
    common: {
      name: "Station Type",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Station Type"
    },
    native: {}
  },
  json: {
    _id: "",
    type: "state",
    common: {
      name: "Station JSON",
      type: "string",
      role: "json",
      read: true,
      write: false,
      desc: "Station JSON"
    },
    native: {}
  },
  location: {
    latitude: {
      _id: "",
      type: "state",
      common: {
        name: "Station Latitude",
        type: "number",
        role: "value.latitude",
        read: true,
        write: false,
        desc: "Station Latitude"
      },
      native: {}
    },
    longitude: {
      _id: "",
      type: "state",
      common: {
        name: "Station Longitude",
        type: "number",
        role: "value.longitude",
        read: true,
        write: false,
        desc: "Station Longitude"
      },
      native: {}
    }
  },
  data: {
    ...TimeTableData,
    _array: {
      _id: "",
      type: "folder",
      common: {
        name: "TimeTableData Array"
      },
      native: {}
    },
    _channel: {
      _id: "",
      type: "folder",
      common: {
        name: "TimeTableData Channel"
      },
      native: {}
    }
  }
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
  }
  /* abfahrten: {
      _channel: {
          _id: '',
          type: 'folder',
          common: {
              name: 'Abfahrten',
          },
          native: {},
      },
      station: {
          ...Station,
          _channel: {
              _id: '',
              type: 'folder',
              common: {
                  name: 'Station',
              },
              native: {},
          },
      },
  }, */
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

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
const Departure = {
  when: {
    _id: "",
    type: "state",
    common: {
      name: "When",
      type: "string",
      role: "date",
      read: true,
      write: false,
      desc: "Departure time"
    },
    native: {}
  },
  plannedWhen: {
    _id: "",
    type: "state",
    common: {
      name: "Planned When",
      type: "string",
      role: "date",
      read: true,
      write: false,
      desc: "Planned Departure time"
    },
    native: {}
  },
  delay: {
    _id: "",
    type: "state",
    common: {
      name: "Delay",
      type: "number",
      role: "value",
      read: true,
      write: false,
      desc: "Delay in seconds"
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
  }
};
const Stopinfo = {
  name: {
    _id: "",
    type: "state",
    common: {
      name: "Stop Name",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Stop Name"
    },
    native: {}
  },
  id: {
    _id: "",
    type: "state",
    common: {
      name: "Stop ID",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Stop ID"
    },
    native: {}
  },
  type: {
    _id: "",
    type: "state",
    common: {
      name: "Type",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Type"
    },
    native: {}
  }
};
const Location = {
  latitude: {
    _id: "",
    type: "state",
    common: {
      name: "Location Latitude",
      type: "number",
      role: "value.gps.latitude",
      read: true,
      write: false,
      desc: "Location Latitude"
    },
    native: {}
  },
  longitude: {
    _id: "",
    type: "state",
    common: {
      name: "Location Longitude",
      type: "number",
      role: "value.gps.longitude",
      read: true,
      write: false,
      desc: "Location Longitude"
    },
    native: {}
  }
};
const Line = {
  name: {
    _id: "",
    type: "state",
    common: {
      name: "Line Name",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Line Name"
    },
    native: {}
  },
  fahrtNr: {
    _id: "",
    type: "state",
    common: {
      name: "Fahrt Number",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Fahrt Number"
    },
    native: {}
  },
  productName: {
    _id: "",
    type: "state",
    common: {
      name: "Product Name",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Product Name"
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
      desc: "Mode"
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
      desc: "Operator"
    },
    native: {}
  }
};
const Remarks = {
  hint: {
    _id: "",
    type: "state",
    common: {
      name: "Remarks Hint",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Remarks Hint"
    },
    native: {}
  },
  warning: {
    _id: "",
    type: "state",
    common: {
      name: "Remarks Warning",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Remarks Warning"
    },
    native: {}
  },
  status: {
    _id: "",
    type: "state",
    common: {
      name: "Remarks Status",
      type: "string",
      role: "text",
      read: true,
      write: false,
      desc: "Remarks Status"
    },
    native: {}
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
  },
  departure: {
    ...Departure,
    _channel: {
      _id: "",
      type: "folder",
      common: {
        name: "Abfahrt"
      },
      native: {}
    },
    _array: {
      _id: "",
      type: "folder",
      common: {
        name: "Abfahrt"
      },
      native: {}
    },
    line: {
      ...Line,
      _channel: {
        _id: "",
        type: "folder",
        common: {
          name: "Line"
        },
        native: {}
      }
    },
    stopinfo: {
      ...Stopinfo,
      _channel: {
        _id: "",
        type: "folder",
        common: {
          name: "Stopinfo"
        },
        native: {}
      },
      location: {
        ...Location,
        _channel: {
          _id: "",
          type: "folder",
          common: {
            name: "Location"
          },
          native: {}
        }
      }
    },
    remarks: {
      ...Remarks,
      _channel: {
        _id: "",
        type: "folder",
        common: {
          name: "Remarks"
        },
        native: {}
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

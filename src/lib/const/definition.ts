/*export type ChangeTypeToChannelAndState<Obj> = Obj extends object
    ? {
          [K in keyof Obj]-?: ChangeTypeToChannelAndState<Obj[K]>;
      } & customChannelType
    : ioBroker.StateObject;

export type ChangeToChannel<Obj, T> = Obj extends object
    ? { [K in keyof Obj]-?: customChannelType & T }
    : ioBroker.StateObject;
*/
export type ChangeTypeOfKeysForState<Obj, N> = Obj extends object
    ? customChannelType & { [K in keyof Obj]: ChangeTypeOfKeysForState<Obj[K], N> }
    : N;

export type customChannelType = {
    _channel?: ioBroker.ChannelObject | ioBroker.DeviceObject | ioBroker.FolderObject;
    _array?: ioBroker.ChannelObject | ioBroker.DeviceObject | ioBroker.FolderObject;
};

export const defaultChannel: ioBroker.ChannelObject = {
    _id: '',
    type: 'channel',
    common: {
        name: 'Hey no description... ',
    },
    native: {},
};

export const defaultFolder: ioBroker.FolderObject = {
    _id: '',
    type: 'folder',
    common: {
        name: 'Hey no description... ',
    },
    native: {},
};

export const defaultDevice: ioBroker.DeviceObject = {
    _id: '',
    type: 'device',
    common: {
        name: 'Hey no description... ',
    },
    native: {},
};

const Departure: ChangeTypeOfKeysForState<Departure, ioBroker.StateObject> = {
    when: {
        _id: '',
        type: 'state',
        common: {
            name: 'When',
            type: 'string',
            role: 'date',
            read: true,
            write: false,
            desc: 'Departure time',
        },
        native: {},
    },
    plannedWhen: {
        _id: '',
        type: 'state',
        common: {
            name: 'Planned When',
            type: 'string',
            role: 'date',
            read: true,
            write: false,
            desc: 'Planned Departure time',
        },
        native: {},
    },
    delay: {
        _id: '',
        type: 'state',
        common: {
            name: 'Delay',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
            desc: 'Delay in seconds',
        },
        native: {},
    },
    direction: {
        _id: '',
        type: 'state',
        common: {
            name: 'Direction',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Direction of the vehicle',
        },
        native: {},
    },
    plannedPlatform: {
        _id: '',
        type: 'state',
        common: {
            name: 'Planned Platform',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Planned Platform for Departure',
        },
        native: {},
    },
    platform: {
        _id: '',
        type: 'state',
        common: {
            name: 'Platform',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Platform for Departure',
        },
        native: {},
    },
};

const Stopinfo: ChangeTypeOfKeysForState<Stopinfo, ioBroker.StateObject> = {
    name: {
        _id: '',
        type: 'state',
        common: {
            name: 'Stop Name',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Stop Name',
        },
        native: {},
    },
    id: {
        _id: '',
        type: 'state',
        common: {
            name: 'Stop ID',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Stop ID',
        },
        native: {},
    },
    type: {
        _id: '',
        type: 'state',
        common: {
            name: 'Type',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Type',
        },
        native: {},
    },
};

const Location: ChangeTypeOfKeysForState<Location, ioBroker.StateObject> = {
    latitude: {
        _id: '',
        type: 'state',
        common: {
            name: 'Location Latitude',
            type: 'number',
            role: 'value.gps.latitude',
            read: true,
            write: false,
            desc: 'Location Latitude',
        },
        native: {},
    },
    longitude: {
        _id: '',
        type: 'state',
        common: {
            name: 'Location Longitude',
            type: 'number',
            role: 'value.gps.longitude',
            read: true,
            write: false,
            desc: 'Location Longitude',
        },
        native: {},
    },
};

const Line: ChangeTypeOfKeysForState<Line, ioBroker.StateObject> = {
    name: {
        _id: '',
        type: 'state',
        common: {
            name: 'Line Name',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Line Name',
        },
        native: {},
    },
    fahrtNr: {
        _id: '',
        type: 'state',
        common: {
            name: 'Fahrt Number',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Fahrt Number',
        },
        native: {},
    },
    productName: {
        _id: '',
        type: 'state',
        common: {
            name: 'Product Name',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Product Name',
        },
        native: {},
    },
    mode: {
        _id: '',
        type: 'state',
        common: {
            name: 'Mode',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Mode',
        },
        native: {},
    },
    operator: {
        _id: '',
        type: 'state',
        common: {
            name: 'Operator',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Operator',
        },
        native: {},
    },
};

const Remarks: ChangeTypeOfKeysForState<Remarks, ioBroker.StateObject> = {
    hint: {
        _id: '',
        type: 'state',
        common: {
            name: 'Remarks Hint',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Remarks Hint',
        },
        native: {},
    },
    warning: {
        _id: '',
        type: 'state',
        common: {
            name: 'Remarks Warning',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Remarks Warning',
        },
        native: {},
    },
    status: {
        _id: '',
        type: 'state',
        common: {
            name: 'Remarks Status',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Remarks Status',
        },
        native: {},
    },
};

export const genericStateObjects: {
    default: ioBroker.StateObject;
    customString: ioBroker.StateObject;
    departure: customChannelType &
        ChangeTypeOfKeysForState<Departure, ioBroker.StateObject> & {
            line: customChannelType & ChangeTypeOfKeysForState<Line, ioBroker.StateObject>;
            stopinfo: customChannelType &
                ChangeTypeOfKeysForState<Stopinfo, ioBroker.StateObject> & {
                    location: customChannelType & ChangeTypeOfKeysForState<Location, ioBroker.StateObject>;
                };
            remarks: customChannelType & ChangeTypeOfKeysForState<Remarks, ioBroker.StateObject>;
        };
} = {
    default: {
        _id: 'No_definition',
        type: 'state',
        common: {
            name: 'StateObjects.state',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
    customString: {
        _id: 'User_State',
        type: 'state',
        common: {
            name: 'StateObjects.customString',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
    departure: {
        ...Departure,
        _channel: {
            _id: '',
            type: 'folder',
            common: {
                name: 'Abfahrt',
            },
            native: {},
        },
        _array: {
            _id: '',
            type: 'folder',
            common: {
                name: 'Abfahrt',
            },
            native: {},
        },
        line: {
            ...Line,
            _channel: {
                _id: '',
                type: 'folder',
                common: {
                    name: 'Line',
                },
                native: {},
            },
        },
        stopinfo: {
            ...Stopinfo,
            _channel: {
                _id: '',
                type: 'folder',
                common: {
                    name: 'Stopinfo',
                },
                native: {},
            },
            location: {
                ...Location,
                _channel: {
                    _id: '',
                    type: 'folder',
                    common: {
                        name: 'Location',
                    },
                    native: {},
                },
            },
        },
        remarks: {
            ...Remarks,
            _channel: {
                _id: '',
                type: 'folder',
                common: {
                    name: 'Remarks',
                },
                native: {},
            },
        },
    },
};

export const Defaults = {
    state: {
        _id: 'No_definition',
        type: 'state',
        common: {
            name: 'No definition',

            type: 'string',
            role: 'text',
            read: true,
            write: false,
        },
        native: {},
    },
};

type Departure = {
    when: string;
    plannedWhen: string;
    delay: number;
    direction: string;
    platform: string;
    plannedPlatform: string;
};

type Line = {
    name: string;
    fahrtNr: string;
    productName: string;
    mode: string;
    operator: string;
};

type Remarks = {
    hint: string;
    warning: string;
    status: string;
};

type Stopinfo = {
    name: string;
    id: string;
    type: string;
};

type Location = {
    latitude: number;
    longitude: number;
};

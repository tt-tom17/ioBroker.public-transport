export type ChangeTypeToChannelAndState<Obj> = Obj extends object
    ? {
          [K in keyof Obj]-?: ChangeTypeToChannelAndState<Obj[K]>;
      } & customChannelType
    : ioBroker.StateObject;

export type ChangeToChannel<Obj, T> = Obj extends object
    ? { [K in keyof Obj]-?: customChannelType & T }
    : ioBroker.StateObject;

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

const TimeTableData: ChangeTypeOfKeysForState<TimeTableData, ioBroker.StateObject> = {
    departureTime: {
        _id: '',
        type: 'state',
        common: {
            name: 'Departure Time',
            type: 'number',
            role: 'value.time',
            read: true,
            write: false,
            desc: 'Departure Time as timestamp',
        },
        native: {},
    },
    departureDelaySeconds: {
        _id: '',
        type: 'state',
        common: {
            name: 'Departure Delay Seconds',
            type: 'number',
            role: 'value.interval',
            read: true,
            write: false,
            desc: 'Departure Delay in Seconds',
        },
        native: {},
    },
    departureDelayed: {
        _id: '',
        type: 'state',
        common: {
            name: 'Departure Delayed',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
            desc: 'Is the Departure delayed?',
        },
        native: {},
    },
    departureOnTime: {
        _id: '',
        type: 'state',
        common: {
            name: 'Departure On Time',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
            desc: 'Is the Departure on time?',
        },
        native: {},
    },
    departurePlanned: {
        _id: '',
        type: 'state',
        common: {
            name: 'Departure Planned Time',
            type: 'number',
            role: 'value.time',
            read: true,
            write: false,
            desc: 'Planned Departure Time as timestamp',
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
    json: {
        _id: '',
        type: 'state',
        common: {
            name: 'TimeTableData JSON',
            type: 'string',
            role: 'json',
            read: true,
            write: false,
            desc: 'TimeTableData JSON',
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
            desc: 'Mode of the vehicle',
        },
        native: {},
    },
    name: {
        _id: '',
        type: 'state',
        common: {
            name: 'Name',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Name of the vehicle',
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
            desc: 'Operator of the vehicle',
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
    product: {
        _id: '',
        type: 'state',
        common: {
            name: 'Product',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Product of the vehicle',
        },
        native: {},
    },
};

const Station: ChangeTypeOfKeysForState<Station, ioBroker.StateObject> = {
    customName: {
        _id: '',
        type: 'state',
        common: {
            name: 'Custom Name',
            type: 'string',
            role: 'text',
            read: true,
            write: true,
            desc: 'Custom Name for the Station',
        },
        native: {},
    },
    name: {
        _id: '',
        type: 'state',
        common: {
            name: 'Station Name',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Station Name',
        },
        native: {},
    },
    type: {
        _id: '',
        type: 'state',
        common: {
            name: 'Station Type',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Station Type',
        },
        native: {},
    },
    json: {
        _id: '',
        type: 'state',
        common: {
            name: 'Station JSON',
            type: 'string',
            role: 'json',
            read: true,
            write: false,
            desc: 'Station JSON',
        },
        native: {},
    },
    location: {
        latitude: {
            _id: '',
            type: 'state',
            common: {
                name: 'Station Latitude',
                type: 'number',
                role: 'value.latitude',
                read: true,
                write: false,
                desc: 'Station Latitude',
            },
            native: {},
        },
        longitude: {
            _id: '',
            type: 'state',
            common: {
                name: 'Station Longitude',
                type: 'number',
                role: 'value.longitude',
                read: true,
                write: false,
                desc: 'Station Longitude',
            },
            native: {},
        },
    },
    data: {
        ...TimeTableData,
        _array: {
            _id: '',
            type: 'folder',
            common: {
                name: 'TimeTableData Array',
            },
            native: {},
        },
        _channel: {
            _id: '',
            type: 'folder',
            common: {
                name: 'TimeTableData Channel',
            },
            native: {},
        },
    },
};

export const genericStateObjects: {
    default: ioBroker.StateObject;
    customString: ioBroker.StateObject;
    /* abfahrten: customChannelType & {
        station: customChannelType & ChangeTypeOfKeysForState<Station, ioBroker.StateObject>;
    }; */
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

export type TimeTableData = {
    departureTime: number;
    departureDelaySeconds: number;
    departureDelayed: boolean;
    departureOnTime: boolean;
    departurePlanned: number;
    direction: string;
    json: string;
    mode: string;
    name: string;
    operator: string;
    plannedPlatform: string;
    platform: string;
    product: string;
};

export type Station = {
    customName: string;
    //id: string;
    name: string;
    type: string;
    location: {
        latitude: number;
        longitude: number;
    };
    json: string;
    data: TimeTableData;
};

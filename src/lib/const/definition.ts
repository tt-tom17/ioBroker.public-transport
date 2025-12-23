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

const StationStopInfo: ChangeTypeOfKeysForState<StationStopInfo, ioBroker.StateObject> = {
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
    id: {
        _id: '',
        type: 'state',
        common: {
            name: 'Line ID',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Line ID',
        },
        native: {},
    },
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
    product: {
        _id: '',
        type: 'state',
        common: {
            name: 'Product',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Product',
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

const Leg: ChangeTypeOfKeysForState<Leg, ioBroker.StateObject> = {
    tripId: {
        _id: '',
        type: 'state',
        common: {
            name: 'Trip ID',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Trip ID',
        },
        native: {},
    },
    departure: {
        _id: '',
        type: 'state',
        common: {
            name: 'Departure',
            type: 'string',
            role: 'date',
            read: true,
            write: false,
            desc: 'Departure time',
        },
        native: {},
    },
    plannedDeparture: {
        _id: '',
        type: 'state',
        common: {
            name: 'Planned Departure',
            type: 'string',
            role: 'date',
            read: true,
            write: false,
            desc: 'Planned Departure time',
        },
        native: {},
    },
    departureDelay: {
        _id: '',
        type: 'state',
        common: {
            name: 'Departure Delay',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
            desc: 'Departure Delay in seconds',
        },
        native: {},
    },
    arrival: {
        _id: '',
        type: 'state',
        common: {
            name: 'Arrival',
            type: 'string',
            role: 'date',
            read: true,
            write: false,
            desc: 'Arrival time',
        },
        native: {},
    },
    plannedArrival: {
        _id: '',
        type: 'state',
        common: {
            name: 'Planned Arrival',
            type: 'string',
            role: 'date',
            read: true,
            write: false,
            desc: 'Planned Arrival time',
        },
        native: {},
    },
    arrivalDelay: {
        _id: '',
        type: 'state',
        common: {
            name: 'Arrival Delay',
            type: 'number',
            role: 'value',
            read: true,
            write: false,
            desc: 'Arrival Delay in seconds',
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
    arrivalPlatform: {
        _id: '',
        type: 'state',
        common: {
            name: 'Arrival Platform',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Arrival Platform',
        },
        native: {},
    },
    plannedArrivalPlatform: {
        _id: '',
        type: 'state',
        common: {
            name: 'Planned Arrival Platform',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Planned Arrival Platform',
        },
        native: {},
    },
    departurePlatform: {
        _id: '',
        type: 'state',
        common: {
            name: 'Departure Platform',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Departure Platform',
        },
        native: {},
    },
    plannedDeparturePlatform: {
        _id: '',
        type: 'state',
        common: {
            name: 'Planned Departure Platform',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Planned Departure Platform',
        },
        native: {},
    },
    arrivalPrognosisType: {
        _id: '',
        type: 'state',
        common: {
            name: 'Arrival Prognosis Type',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Arrival Prognosis Type',
        },
        native: {},
    },
    departurePrognosisType: {
        _id: '',
        type: 'state',
        common: {
            name: 'Departure Prognosis Type',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Departure Prognosis Type',
        },
        native: {},
    },
    walking: {
        _id: '',
        type: 'state',
        common: {
            name: 'Walking',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
            desc: 'Is this section a transfer?',
        },
        native: {},
    },
    distance: {
        _id: '',
        type: 'state',
        common: {
            name: 'Distance',
            type: 'number',
            role: 'value.distance',
            read: true,
            write: false,
            desc: 'Distance in meters',
        },
        native: {},
    },
};

const AlternativeTrip: ChangeTypeOfKeysForState<AlternativeTrip, ioBroker.StateObject> = {
    tripId: {
        _id: '',
        type: 'state',
        common: {
            name: 'Trip ID',
            type: 'string',
            role: 'text',
            read: true,
            write: false,
            desc: 'Trip ID',
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
            desc: 'Direction',
        },
        native: {},
    },
    when: {
        _id: '',
        type: 'state',
        common: {
            name: 'When',
            type: 'string',
            role: 'date',
            read: true,
            write: false,
            desc: 'Departure/Arrival time',
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
            desc: 'Planned Departure/Arrival time',
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
};

const Products: ChangeTypeOfKeysForState<Products, ioBroker.StateObject> = {
    suburban: {
        _id: '',
        type: 'state',
        common: {
            name: 'Suburban',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
            desc: 'Is Suburban transport included',
        },
        native: {},
    },
    subway: {
        _id: '',
        type: 'state',
        common: {
            name: 'Subway',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
            desc: 'Is Subway transport included',
        },
        native: {},
    },
    tram: {
        _id: '',
        type: 'state',
        common: {
            name: 'Tram',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
            desc: 'Is Tram transport included',
        },
        native: {},
    },
    bus: {
        _id: '',
        type: 'state',
        common: {
            name: 'Bus',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
            desc: 'Is Bus transport included',
        },
        native: {},
    },
    ferry: {
        _id: '',
        type: 'state',
        common: {
            name: 'Ferry',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
            desc: 'Is Ferry transport included',
        },
        native: {},
    },
    express: {
        _id: '',
        type: 'state',
        common: {
            name: 'Express',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
            desc: 'Is Express transport included',
        },
        native: {},
    },
    regional: {
        _id: '',
        type: 'state',
        common: {
            name: 'Regional',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
            desc: 'Is Regional transport included',
        },
        native: {},
    },
    regionalExpress: {
        _id: '',
        type: 'state',
        common: {
            name: 'Regional Express',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
            desc: 'Is Regional Express transport included',
        },
        native: {},
    },
    national: {
        _id: '',
        type: 'state',
        common: {
            name: 'National',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
            desc: 'Is National transport included',
        },
        native: {},
    },
    nationalExpress: {
        _id: '',
        type: 'state',
        common: {
            name: 'National Express',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
            desc: 'Is National Express transport included',
        },
        native: {},
    },
    nationalexpress: {
        _id: '',
        type: 'state',
        common: {
            name: 'Nationalexpress',
            type: 'boolean',
            role: 'indicator',
            read: true,
            write: false,
            desc: 'Is Nationalexpress transport included',
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
                ChangeTypeOfKeysForState<StationStopInfo, ioBroker.StateObject> & {
                    location: customChannelType & ChangeTypeOfKeysForState<Location, ioBroker.StateObject>;
                };
            remarks: customChannelType & ChangeTypeOfKeysForState<Remarks, ioBroker.StateObject>;
        };
    journey: customChannelType & {
        section: customChannelType &
            ChangeTypeOfKeysForState<Leg, ioBroker.StateObject> & {
                stationFrom: customChannelType &
                    ChangeTypeOfKeysForState<StationStopInfo, ioBroker.StateObject> & {
                        location: customChannelType & ChangeTypeOfKeysForState<Location, ioBroker.StateObject>;
                    };
                stationTo: customChannelType &
                    ChangeTypeOfKeysForState<StationStopInfo, ioBroker.StateObject> & {
                        location: customChannelType & ChangeTypeOfKeysForState<Location, ioBroker.StateObject>;
                    };
                line: customChannelType & ChangeTypeOfKeysForState<Line, ioBroker.StateObject>;
                remarks: customChannelType & ChangeTypeOfKeysForState<Remarks, ioBroker.StateObject>;
                alternatives: customChannelType &
                    ChangeTypeOfKeysForState<AlternativeTrip, ioBroker.StateObject> & {
                        line: customChannelType & ChangeTypeOfKeysForState<Line, ioBroker.StateObject>;
                    };
            };
    };
    station: customChannelType &
        ChangeTypeOfKeysForState<StationStopInfo, ioBroker.StateObject> & {
            location: customChannelType & ChangeTypeOfKeysForState<Location, ioBroker.StateObject>;
            stops: customChannelType &
                ChangeTypeOfKeysForState<StationStopInfo, ioBroker.StateObject> & {
                    location: customChannelType & ChangeTypeOfKeysForState<Location, ioBroker.StateObject>;
                    products: customChannelType & ChangeTypeOfKeysForState<Products, ioBroker.StateObject>;
                };
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
            ...StationStopInfo,
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
    journey: {
        _channel: {
            _id: '',
            type: 'folder',
            common: {
                name: 'Journey',
            },
            native: {},
        },
        _array: {
            _id: '',
            type: 'folder',
            common: {
                name: 'Journey',
            },
            native: {},
        },
        section: {
            ...Leg,
            _channel: {
                _id: '',
                type: 'folder',
                common: {
                    name: 'Section',
                },
                native: {},
            },
            _array: {
                _id: '',
                type: 'folder',
                common: {
                    name: 'Section',
                },
                native: {},
            },
            stationFrom: {
                ...StationStopInfo,
                _channel: {
                    _id: '',
                    type: 'folder',
                    common: {
                        name: 'Station From',
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
            stationTo: {
                ...StationStopInfo,
                _channel: {
                    _id: '',
                    type: 'folder',
                    common: {
                        name: 'Station To',
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
            alternatives: {
                ...AlternativeTrip,
                _channel: {
                    _id: '',
                    type: 'folder',
                    common: {
                        name: 'Alternative',
                    },
                    native: {},
                },
                _array: {
                    _id: '',
                    type: 'folder',
                    common: {
                        name: 'Alternative',
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
            },
        },
    },
    station: {
        ...StationStopInfo,
        _channel: {
            _id: '',
            type: 'folder',
            common: {
                name: 'Station',
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
        stops: {
            ...StationStopInfo,
            _channel: {
                _id: '',
                type: 'folder',
                common: {
                    name: 'Stop',
                },
                native: {},
            },
            _array: {
                _id: '',
                type: 'folder',
                common: {
                    name: 'Stop',
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
            products: {
                ...Products,
                _channel: {
                    _id: '',
                    type: 'folder',
                    common: {
                        name: 'Products',
                    },
                    native: {},
                },
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
    id?: string;
    name: string;
    fahrtNr: string;
    productName: string;
    mode: string;
    product?: string;
    operator: string;
};

type Remarks = {
    hint: string;
    warning: string;
    status: string;
};

type Location = {
    latitude: number;
    longitude: number;
};

type StationStopInfo = {
    id: string;
    name: string;
    type: string;
};

type Leg = {
    tripId: string;
    departure: string;
    plannedDeparture: string;
    departureDelay: number;
    arrival: string;
    plannedArrival: string;
    arrivalDelay: number;
    direction: string;
    arrivalPlatform: string;
    plannedArrivalPlatform: string;
    departurePlatform: string;
    plannedDeparturePlatform: string;
    arrivalPrognosisType: string;
    departurePrognosisType: string;
    walking?: boolean;
    distance?: number;
};

type AlternativeTrip = {
    tripId: string;
    direction: string;
    when: string;
    plannedWhen: string;
    delay: number;
};

type Products = {
    suburban?: boolean | undefined;
    subway?: boolean | undefined;
    tram?: boolean | undefined;
    bus?: boolean | undefined;
    ferry?: boolean | undefined;
    express?: boolean | undefined;
    regional?: boolean | undefined;
    regionalExpress?: boolean | undefined;
    national?: boolean | undefined;
    nationalExpress?: boolean | undefined;
    nationalexpress?: boolean | undefined;
};

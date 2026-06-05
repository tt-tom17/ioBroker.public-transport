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

/**
 * Erzeugt ein ioBroker-State-Objekt mit den im Adapter durchgängigen Defaults
 * (_id:'', read:true, write:false, native:{}). `desc` fällt auf `name` zurück.
 * Reduziert die sonst pro State wiederholte 13-Zeilen-Boilerplate auf eine Zeile.
 *
 * @param name  Anzeigename des States (common.name)
 * @param type  Datentyp (common.type)
 * @param role  ioBroker-Rolle (common.role)
 * @param desc  Beschreibung (common.desc); ohne Angabe = name
 * @returns vollständiges ioBroker.StateObject
 */
function stateObj(name: string, type: ioBroker.CommonType, role: string, desc: string = name): ioBroker.StateObject {
    return {
        _id: '',
        type: 'state',
        common: {
            name,
            type,
            role,
            read: true,
            write: false,
            desc,
        },
        native: {},
    };
}

/**
 * Erzeugt ein Folder-Objekt (für _channel/_array) mit den durchgängigen Defaults.
 *
 * @param name Anzeigename des Folders (common.name)
 * @returns vollständiges ioBroker.FolderObject
 */
function folderObj(name: string): ioBroker.FolderObject {
    return {
        _id: '',
        type: 'folder',
        common: { name },
        native: {},
    };
}

const Departure: ChangeTypeOfKeysForState<Departure, ioBroker.StateObject> = {
    when: stateObj('When', 'string', 'date', 'Departure time'),
    plannedWhen: stateObj('Planned When', 'string', 'date', 'Planned Departure time'),
    delay: stateObj('Delay', 'number', 'time', 'Delay in seconds'),
    direction: stateObj('Direction', 'string', 'text', 'Direction of the vehicle'),
    plannedPlatform: stateObj('Planned Platform', 'string', 'text', 'Planned Platform for Departure'),
    platform: stateObj('Platform', 'string', 'text', 'Platform for Departure'),
};

const StationStopInfo: ChangeTypeOfKeysForState<StationStopInfo, ioBroker.StateObject> = {
    name: stateObj('Stop Name', 'string', 'text', 'Stop Name'),
    id: stateObj('Stop ID', 'string', 'text', 'Stop ID'),
    type: stateObj('Type', 'string', 'text', 'Type'),
};

const Location: ChangeTypeOfKeysForState<Location, ioBroker.StateObject> = {
    latitude: stateObj('Location Latitude', 'number', 'value.gps.latitude', 'Location Latitude'),
    longitude: stateObj('Location Longitude', 'number', 'value.gps.longitude', 'Location Longitude'),
};

const Line: ChangeTypeOfKeysForState<Line, ioBroker.StateObject> = {
    id: stateObj('Line ID', 'string', 'text', 'Line ID'),
    name: stateObj('Line Name', 'string', 'text', 'Line Name'),
    fahrtNr: stateObj('Fahrt Number', 'string', 'text', 'Fahrt Number'),
    productName: stateObj('Product Name', 'string', 'text', 'Product Name'),
    mode: stateObj('Mode', 'string', 'text', 'Mode'),
    product: stateObj('Product', 'string', 'text', 'Product'),
    operator: stateObj('Operator', 'string', 'text', 'Operator'),
};

const Remarks: ChangeTypeOfKeysForState<Remarks, ioBroker.StateObject> = {
    hint: stateObj('Remarks Hint', 'string', 'text', 'Remarks Hint'),
    warning: stateObj('Remarks Warning', 'string', 'text', 'Remarks Warning'),
    status: stateObj('Remarks Status', 'string', 'text', 'Remarks Status'),
};

const Leg: ChangeTypeOfKeysForState<Leg, ioBroker.StateObject> = {
    tripId: stateObj('Trip ID', 'string', 'text', 'Trip ID'),
    departure: stateObj('Departure', 'string', 'date', 'Departure time'),
    plannedDeparture: stateObj('Planned Departure', 'string', 'date', 'Planned Departure time'),
    departureDelay: stateObj('Departure Delay', 'number', 'time', 'Departure Delay in seconds'),
    arrival: stateObj('Arrival', 'string', 'date', 'Arrival time'),
    plannedArrival: stateObj('Planned Arrival', 'string', 'date', 'Planned Arrival time'),
    arrivalDelay: stateObj('Arrival Delay', 'number', 'time', 'Arrival Delay in seconds'),
    direction: stateObj('Direction', 'string', 'text', 'Direction of the vehicle'),
    arrivalPlatform: stateObj('Arrival Platform', 'string', 'text', 'Arrival Platform'),
    plannedArrivalPlatform: stateObj('Planned Arrival Platform', 'string', 'text', 'Planned Arrival Platform'),
    departurePlatform: stateObj('Departure Platform', 'string', 'text', 'Departure Platform'),
    plannedDeparturePlatform: stateObj('Planned Departure Platform', 'string', 'text', 'Planned Departure Platform'),
    arrivalPrognosisType: stateObj('Arrival Prognosis Type', 'string', 'text', 'Arrival Prognosis Type'),
    departurePrognosisType: stateObj('Departure Prognosis Type', 'string', 'text', 'Departure Prognosis Type'),
    walking: stateObj('Walking', 'boolean', 'indicator', 'Is this section a transfer?'),
    distance: stateObj('Distance', 'number', 'value.distance', 'Distance in meters'),
};

const AlternativeTrip: ChangeTypeOfKeysForState<AlternativeTrip, ioBroker.StateObject> = {
    tripId: stateObj('Trip ID', 'string', 'text', 'Trip ID'),
    direction: stateObj('Direction', 'string', 'text', 'Direction'),
    when: stateObj('When', 'string', 'date', 'Departure/Arrival time'),
    plannedWhen: stateObj('Planned When', 'string', 'date', 'Planned Departure/Arrival time'),
    delay: stateObj('Delay', 'number', 'time', 'Delay in seconds'),
};

const Products: ChangeTypeOfKeysForState<Products, ioBroker.StateObject> = {
    suburban: stateObj('Suburban', 'boolean', 'indicator', 'Is Suburban transport included'),
    subway: stateObj('Subway', 'boolean', 'indicator', 'Is Subway transport included'),
    tram: stateObj('Tram', 'boolean', 'indicator', 'Is Tram transport included'),
    bus: stateObj('Bus', 'boolean', 'indicator', 'Is Bus transport included'),
    ferry: stateObj('Ferry', 'boolean', 'indicator', 'Is Ferry transport included'),
    express: stateObj('Express', 'boolean', 'indicator', 'Is Express transport included'),
    regional: stateObj('Regional', 'boolean', 'indicator', 'Is Regional transport included'),
    regionalExpress: stateObj('Regional Express', 'boolean', 'indicator', 'Is Regional Express transport included'),
    national: stateObj('National', 'boolean', 'indicator', 'Is National transport included'),
    nationalExpress: stateObj('National Express', 'boolean', 'indicator', 'Is National Express transport included'),
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
        _channel: folderObj('Abfahrt'),
        _array: folderObj('Abfahrt'),
        line: {
            ...Line,
            _channel: folderObj('Line'),
        },
        stopinfo: {
            ...StationStopInfo,
            _channel: folderObj('Stopinfo'),
            location: {
                ...Location,
                _channel: folderObj('Location'),
            },
        },
        remarks: {
            ...Remarks,
            _channel: folderObj('Remarks'),
        },
    },
    journey: {
        _channel: folderObj('Journey'),
        _array: folderObj('Journey'),
        section: {
            ...Leg,
            _channel: folderObj('Section'),
            _array: folderObj('Section'),
            stationFrom: {
                ...StationStopInfo,
                _channel: folderObj('Station From'),
                location: {
                    ...Location,
                    _channel: folderObj('Location'),
                },
            },
            stationTo: {
                ...StationStopInfo,
                _channel: folderObj('Station To'),
                location: {
                    ...Location,
                    _channel: folderObj('Location'),
                },
            },
            line: {
                ...Line,
                _channel: folderObj('Line'),
            },
            remarks: {
                ...Remarks,
                _channel: folderObj('Remarks'),
            },
            alternatives: {
                ...AlternativeTrip,
                _channel: folderObj('Alternative'),
                _array: folderObj('Alternative'),
                line: {
                    ...Line,
                    _channel: folderObj('Line'),
                },
            },
        },
    },
    station: {
        ...StationStopInfo,
        _channel: folderObj('Station'),
        location: {
            ...Location,
            _channel: folderObj('Location'),
        },
        stops: {
            ...StationStopInfo,
            _channel: folderObj('Stop'),
            _array: folderObj('Stop'),
            location: {
                ...Location,
                _channel: folderObj('Location'),
            },
            products: {
                ...Products,
                _channel: folderObj('Products'),
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
};

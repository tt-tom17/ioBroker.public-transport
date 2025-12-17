import type { TTAdapter } from '../../main';
import { BaseClass } from '../tools/library';

export class WriteState extends BaseClass {
    constructor(adapter: TTAdapter) {
        super(adapter);
        this.log.setLogPrefix('depReq');
    }
    async writeDepartureState(response: any[], basePath: string): Promise<void> {
        for (const [index, obj] of response.entries()) {
            const departureIndex = `Departures_${`00${index}`.slice(-2)}`;
            let delayed = false,
                onTime = false;
            if (obj.delay !== undefined && obj.delay >= 0) {
                delayed = true;
            } else {
                onTime = true;
            }
            // Erstelle Channel Departures_XX und darunter die States
            await this.library.writedp(`${basePath}.${departureIndex}`, undefined, {
                _id: 'nicht_definieren',
                type: 'channel',
                common: {
                    name: departureIndex,
                },
                native: {},
            });
            // Departure
            await this.library.writedp(
                `${basePath}.${departureIndex}.Departure`,
                obj.when,
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('departure_time'),
                        type: 'string',
                        role: 'date',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                true,
            );
            // Planned Departure Time
            await this.library.writedp(
                `${basePath}.${departureIndex}.DeparturePlanned`,
                obj.plannedWhen,
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('departure_plannedTime'),
                        type: 'string',
                        role: 'date',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                true,
            );
            // Delay in Seconds
            await this.library.writedp(
                `${basePath}.${departureIndex}.Delay`,
                obj.delay || 0,
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('departure_delayInSeconds'),
                        type: 'number',
                        role: 'time',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                true,
            );
            // Departure Delayed
            await this.library.writedp(
                `${basePath}.${departureIndex}.DepartureDelayed`,
                delayed,
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('departure_isDelayed'),
                        type: 'boolean',
                        role: 'indicator',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                true,
            );
            // Departure On Time
            await this.library.writedp(
                `${basePath}.${departureIndex}.DepartureOnTime`,
                onTime,
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('departure_isOnTime'),
                        type: 'boolean',
                        role: 'indicator',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                true,
            );
            // Platform
            await this.library.writedp(
                `${basePath}.${departureIndex}.Platform`,
                obj.platform,
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('departure_platform'),
                        type: 'string',
                        role: 'text',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                true,
            );
            // Planned Platform
            await this.library.writedp(
                `${basePath}.${departureIndex}.PlatformPlanned`,
                obj.plannedPlatform,
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('departure_plannedPlatform'),
                        type: 'string',
                        role: 'text',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                true,
            );
            // Direction
            await this.library.writedp(
                `${basePath}.${departureIndex}.Direction`,
                obj.direction,
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('departure_direction'),
                        type: 'string',
                        role: 'text',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                true,
            );
        }
    }

    async writeArrivalState(response: any[], basePath: string): Promise<void> {
        for (const [index, obj] of response.entries()) {
            let delayed = false,
                onTime = false;
            if (obj.delay !== undefined && obj.delay >= 0) {
                delayed = true;
            } else {
                onTime = true;
            }
            await this.library.writedp(
                `${basePath}.Arrivals_${`00${index}`.slice(-2)}.Arrival`,
                delayed,
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('arrival_time'),
                        type: 'string',
                        role: 'date',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                true,
            );
            await this.library.writedp(
                `${basePath}.Arrivals_${`00${index}`.slice(-2)}.ArrivalPlanned`,
                onTime,
                {
                    _id: 'nicht_definieren',
                    type: 'state',
                    common: {
                        name: this.library.translate('arrival_plannedTime'),
                        type: 'string',
                        role: 'date',
                        read: true,
                        write: false,
                    },
                    native: {},
                },
                true,
            );
        }
    }
}

import * as utils from '@iobroker/adapter-core';
import type { DepartureRequest } from '../class/departure';
import type { JourneysRequest } from '../class/journeys';
import type { StationRequest } from '../class/station';
import type { HafasService } from '../hafasService';
import type { Library } from '../tools/library';
import type { ITransportService } from './transportService';

export declare class PublicTransport extends utils.Adapter {
    library: Library;
    hService: HafasService;
    depRequest: DepartureRequest;
    journeysRequest: JourneysRequest;
    stationRequest: StationRequest;
    unload: boolean;
    activeService: ITransportService | undefined;
    getActiveService(): ITransportService;
}

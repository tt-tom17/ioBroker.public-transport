import * as utils from '@iobroker/adapter-core';
import type { VendoService } from '../class/dbVendoService';
import type { DepartureRequest } from '../class/depReq';
import type { Library } from '../tools/library';

declare class TTAdapter extends utils.Adapter {
    library: Library;
    vService: VendoService;
    depRequest: DepartureRequest;
    getVendoService(): VendoService;
    unload: boolean;
}

import * as utils from '@iobroker/adapter-core';
import type { VendoService } from '../class/dbVendoService';
import type { DepartureRequest } from '../class/departure';
import type { HafasService } from '../hafasService';
import type { Library } from '../tools/library';

declare class TTAdapter extends utils.Adapter {
    library: Library;
    hService: HafasService;
    vService: VendoService;
    depRequest: DepartureRequest;
    unload: boolean;
}

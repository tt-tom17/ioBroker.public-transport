// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
	namespace ioBroker {
		interface AdapterConfig {
			serviceType: 'hafas' | 'vendo';
			profile?: string;
			clientName?: string;
			logUnknownTokens?: boolean;
			departures?: DepartureStation[];
			pollInterval?: number;
			suppressInfoLogs?: boolean;
		}
		
		interface DepartureStation {
			id: string;
			name: string;
			customName?: string;
			enabled: boolean;
			numDepartures?: number;
			offsetTime?: number;
			duration?: number;
			products?: Products;
		}

		interface Products {
    		suburban?: boolean;   // S-Bahn
    		subway?: boolean;     // U-Bahn
    		tram?: boolean;       // Straßenbahn
    		bus?: boolean;        // Bus
    		ferry?: boolean;      // Fähre
    		express?: boolean;    // ICE/IC/EC (Fernverkehr)
    		regional?: boolean;   // RE/RB (Regionalverkehr)
		}
	}
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export { };

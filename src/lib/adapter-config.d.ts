// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
	namespace ioBroker {
		interface AdapterConfig {
			serviceType: 'hafas' | 'vendo';
			profile?: string;
			clientName?: string;
			logUnknownTokens?: boolean;
			stationConfig?: StationConfig[];
			journeyConfig?: JourneyConfig[];
			pollInterval?: number;
			suppressInfoLogs?: boolean;
			delayOffset?: number;
		}
		
		interface StationConfig {
			id: string;
			name: string;
			customName?: string;
			enabled: boolean;
			numDepartures?: number;
			offsetTime?: number;
			duration?: number;
			products?: Products;
			delayOffset?: number;
		}

		interface Products {
    		suburban?: boolean;         // S-Bahn
    		subway?: boolean;           // U-Bahn
    		tram?: boolean;             // Straßenbahn
    		bus?: boolean;              // Bus
    		ferry?: boolean;            // Fähre
    		regional?: boolean;         // RE/RB (Regionalverkehr)
    		regionalExpress?: boolean;  // RE (Regional Express)
    		nationalExpress?: boolean;  // ICE (InterCity Express)
    		national?: boolean;         // IC/EC (InterCity)
		}

		interface JourneyConfig {
			id: string;
			customName: string;
			enabled: boolean;
			numResults?: number;
			fromStationId: string;
			fromStationName: string;
			toStationId: string;
			toStationName: string;
			departure?: string;
			arrival?: string;
			via?: string;
			stopovers?: boolean;
			transfers?: number;
			transferTime?: number;
			accessibility?: 'partial' | 'complete';
			bike?: boolean;
			products?: Products;
			delayOffset?: number;
		}
	}
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export { };

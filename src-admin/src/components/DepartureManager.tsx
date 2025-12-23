import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { Box, Dialog } from '@mui/material';
import React from 'react';
import { defaultProducts, filterAvailableProducts, type Products } from './ProductSelector';
import StationConfig from './StationConfig';
import StationList from './StationList';
import StationSearch from './StationSearch';

interface Station {
    id: string;
    name: string;
    customName?: string;
    enabled?: boolean;
    numDepartures?: number;
    products?: Products;
    availableProducts?: Partial<Products>; // Produkte die von HAFAS für diese Station zurückgegeben wurden
    client_profile?: string;
}

interface DepartureManagerState extends ConfigGenericState {
    stations: Station[];
    selectedStationId: string | null;
    showSearchDialog: boolean;
}

class DepartureManager extends ConfigGeneric<ConfigGenericProps, DepartureManagerState> {
    constructor(props: ConfigGenericProps) {
        super(props);

        // Initialisiere stations aus props.data.departures
        const departures = ConfigGeneric.getValue(this.props.data, 'stationConfig');
        const initialStations = Array.isArray(departures) ? departures : [];

        this.state = {
            ...this.state,
            stations: initialStations,
            selectedStationId: null,
            showSearchDialog: false,
        };
    }

    componentDidMount(): void {
        // Lade gespeicherte Stationen beim Start
        const departures = ConfigGeneric.getValue(this.props.data, 'stationConfig');
        if (Array.isArray(departures)) {
            this.setState({ stations: departures });
        }
    }

    componentDidUpdate(prevProps: ConfigGenericProps): void {
        if (prevProps.data !== this.props.data) {
            const departures = ConfigGeneric.getValue(this.props.data, 'stationConfig');
            if (Array.isArray(departures)) {
                this.setState({ stations: departures });
            }
        }
    }

    handleAddStation = (): void => {
        this.setState({ showSearchDialog: true });
    };

    handleStationSelected = async (
        stationId: string,
        stationName: string,
        availableProducts?: Partial<Products>,
    ): Promise<void> => {
        // Filtere nur die Products mit true Werten
        const filteredProducts = filterAvailableProducts(availableProducts);

        // Hole die aktuellen ClientConfig-Einstellungen
        const serviceType = ConfigGeneric.getValue(this.props.data, 'serviceType') as string;
        const profile = ConfigGeneric.getValue(this.props.data, 'profile') as string;
        const client_profile = `${serviceType || 'unknown'}:${profile || 'unknown'}`;

        const newStation: Station = {
            id: stationId,
            name: stationName,
            customName: stationName,
            enabled: true,
            numDepartures: 10,
            products: filteredProducts ? { ...filteredProducts } : { ...defaultProducts },
            availableProducts: filteredProducts,
            client_profile,
        };

        // Prüfe ob Station bereits existiert
        const exists = this.state.stations.some(s => s.id === stationId);
        if (!exists) {
            const updatedStations = [...this.state.stations, newStation];
            this.setState({
                stations: updatedStations,
                selectedStationId: stationId, // Automatisch die neue Station auswählen
            });

            // Verwende this.onChange() statt this.props.onChange()
            await this.onChange('stationConfig', updatedStations);
        }

        this.setState({ showSearchDialog: false });
    };

    handleDeleteStation = async (stationId: string): Promise<void> => {
        const updatedStations = this.state.stations.filter(s => s.id !== stationId);
        this.setState({ stations: updatedStations });

        // Verwende this.onChange() statt this.props.onChange()
        await this.onChange('stationConfig', updatedStations);

        // Wenn die gelöschte Station ausgewählt war, Auswahl zurücksetzen
        if (this.state.selectedStationId === stationId) {
            this.setState({ selectedStationId: null });
        }
    };

    handleStationUpdate = async (stationId: string, updates: Partial<Station>): Promise<void> => {
        const updatedStations = this.state.stations.map(station =>
            station.id === stationId ? { ...station, ...updates } : station,
        );

        this.setState({ stations: updatedStations });

        // Verwende this.onChange() statt this.props.onChange()
        await this.onChange('stationConfig', updatedStations);
    };

    handleStationClick = (stationId: string): void => {
        this.setState({ selectedStationId: stationId });
    };

    handleCloseSearch = (): void => {
        this.setState({ showSearchDialog: false });
    };

    render(): React.JSX.Element {
        const { stations, selectedStationId, showSearchDialog } = this.state;
        const selectedStation = stations.find(s => s.id === selectedStationId) || null;

        return (
            <Box sx={{ height: '100%', p: { xs: 1, sm: 2 } }}>
                {/* Zwei-Spalten Layout - Desktop: nebeneinander, Mobile: untereinander */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 2,
                        height: '100%',
                        width: '100%',
                    }}
                >
                    {/* Linke Spalte - Stationsübersicht */}
                    <Box
                        sx={{
                            // Mobile: volle Breite, Desktop: fixe 400px
                            width: { xs: '100%', md: 400 },
                            flexShrink: { md: 0 },
                            minHeight: { xs: 300, md: 'auto' },
                        }}
                    >
                        <StationList
                            stations={stations}
                            selectedStationId={selectedStationId}
                            onAddStation={this.handleAddStation}
                            onDeleteStation={this.handleDeleteStation}
                            onStationClick={this.handleStationClick}
                        />
                    </Box>

                    {/* Rechte Spalte - Konfiguration */}
                    <Box
                        sx={{
                            // Mobile: volle Breite, Desktop: restlicher Platz
                            width: { xs: '100%', md: 'calc(100% - 400px - 16px)' },
                            maxWidth: { md: '500px' },
                            flexGrow: { md: 1 },
                            minHeight: { xs: 200, md: 'auto' },
                        }}
                    >
                        <StationConfig
                            station={selectedStation}
                            onUpdate={this.handleStationUpdate}
                        />
                    </Box>
                </Box>

                {/* Station Search Dialog */}
                <Dialog
                    open={showSearchDialog}
                    onClose={this.handleCloseSearch}
                    maxWidth="md"
                    fullWidth
                    fullScreen={false}
                    sx={{
                        '& .MuiDialog-paper': {
                            m: { xs: 1, sm: 2 },
                            maxHeight: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 64px)' },
                            width: { xs: 'calc(100% - 16px)', sm: 'auto' },
                        },
                    }}
                >
                    <StationSearch
                        {...this.props}
                        onStationSelected={this.handleStationSelected}
                        onClose={this.handleCloseSearch}
                    />
                </Dialog>
            </Box>
        );
    }
}

export default DepartureManager;

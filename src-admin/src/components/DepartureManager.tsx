import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { Box, Dialog, Grid } from '@mui/material';
import React from 'react';
import StationConfig from './StationConfig';
import StationList from './StationList';
import StationSearch from './StationSearch';

interface Station {
    id: string;
    name: string;
}

interface DepartureManagerState extends ConfigGenericState {
    stations: Station[];
    selectedStationId: string | null;
    showSearchDialog: boolean;
}

class DepartureManager extends ConfigGeneric<ConfigGenericProps, DepartureManagerState> {
    constructor(props: ConfigGenericProps) {
        super(props);
        this.state = {
            ...this.state,
            stations: [],
            selectedStationId: null,
            showSearchDialog: false,
        };
    }

    componentDidUpdate(prevProps: ConfigGenericProps): void {
        if (prevProps.data !== this.props.data && this.props.data) {
            this.setState({ stations: this.props.data as Station[] });
        }
    }

    handleAddStation = (): void => {
        this.setState({ showSearchDialog: true });
    };

    handleStationSelected = (stationId: string, stationName: string): void => {
        const newStation: Station = {
            id: stationId,
            name: stationName,
        };

        // Prüfe ob Station bereits existiert
        const exists = this.state.stations.some(s => s.id === stationId);
        if (!exists) {
            const updatedStations = [...this.state.stations, newStation];
            this.setState({ stations: updatedStations });

            if (this.props.onChange) {
                this.props.onChange(updatedStations);
            }
        }

        this.setState({ showSearchDialog: false });
    };

    handleDeleteStation = (stationId: string): void => {
        const updatedStations = this.state.stations.filter(s => s.id !== stationId);
        this.setState({ stations: updatedStations });

        if (this.props.onChange) {
            this.props.onChange(updatedStations);
        }

        // Wenn die gelöschte Station ausgewählt war, Auswahl zurücksetzen
        if (this.state.selectedStationId === stationId) {
            this.setState({ selectedStationId: null });
        }
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
                <Grid
                    container
                    spacing={{ xs: 1, sm: 2 }}
                    sx={{ 
                        height: '100%',
                        flexDirection: { xs: 'column', md: 'row' }
                    }}
                >
                    {/* Linke Spalte - Stationsübersicht */}
                    <Grid
                        item
                        xs={12}
                        md={5}
                        sx={{ 
                            height: { xs: 'auto', md: '100%' },
                            minHeight: { xs: 300, md: 'auto' },
                            maxHeight: { xs: 400, md: 'none' }
                        }}
                    >
                        <StationList
                            stations={stations}
                            selectedStationId={selectedStationId}
                            onAddStation={this.handleAddStation}
                            onDeleteStation={this.handleDeleteStation}
                            onStationClick={this.handleStationClick}
                        />
                    </Grid>

                    {/* Rechte Spalte - Konfiguration */}
                    <Grid
                        item
                        xs={12}
                        md={7}
                        sx={{ 
                            height: { xs: 'auto', md: '100%' },
                            minHeight: { xs: 200, md: 'auto' }
                        }}
                    >
                        <StationConfig station={selectedStation} />
                    </Grid>
                </Grid>

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
                            width: { xs: 'calc(100% - 16px)', sm: 'auto' }
                        }
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

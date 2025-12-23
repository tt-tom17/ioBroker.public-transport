import { I18n } from '@iobroker/adapter-react-v5';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import DirectionsRailwayIcon from '@mui/icons-material/DirectionsRailway';
import SubwayIcon from '@mui/icons-material/Subway';
import TrainIcon from '@mui/icons-material/Train';
import TramIcon from '@mui/icons-material/Tram';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import React from 'react';

interface Station {
    id: string;
    name: string;
    type?: string;
    location?: {
        latitude?: number;
        longitude?: number;
    };
    products?: {
        tram?: boolean;
        bus?: boolean;
        subway?: boolean;
        express?: boolean;
        regional?: boolean;
        regionalExpress?: boolean;
        nationalExpress?: boolean;
        national?: boolean;
        ferry?: boolean;
        suburban?: boolean;
    };
}

interface StationSearchProps extends ConfigGenericProps {
    onStationSelected?: (stationId: string, stationName: string, availableProducts?: Station['products']) => void;
    onClose?: () => void;
}

interface StationSearchState extends ConfigGenericState {
    searchQuery: string;
    stations: Station[];
    selectedStation: Station | null;
    loading: boolean;
    error: string | null;
}

class StationSearch extends ConfigGeneric<StationSearchProps, StationSearchState> {
    private searchTimeout: NodeJS.Timeout | null = null;

    constructor(props: StationSearchProps) {
        super(props);
        this.state = {
            ...this.state,
            searchQuery: '',
            stations: [],
            selectedStation: null,
            loading: false,
            error: null,
        };
    }

    handleClose = (): void => {
        if (this.props.onClose) {
            this.props.onClose();
        }
        this.setState({
            searchQuery: '',
            stations: [],
            selectedStation: null,
            error: null,
        });
    };

    handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const query = event.target.value;
        this.setState({ searchQuery: query });

        // Debounce search
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        if (query.length >= 2) {
            this.searchTimeout = setTimeout(() => {
                void this.searchStations(query);
            }, 500);
        } else {
            this.setState({ stations: [], selectedStation: null });
        }
    };

    searchStations = async (query: string): Promise<void> => {
        this.setState({ loading: true, error: null });

        try {
            // Call adapter method via sendTo
            const result = await this.props.oContext.socket.sendTo(
                `${this.props.oContext.adapterName}.${this.props.oContext.instance}`,
                'location',
                { query },
            );

            console.log('Search result:', result);
            console.log('Result type:', typeof result, 'Is array:', Array.isArray(result));

            if (result && Array.isArray(result)) {
                console.log('Number of stations:', result.length);
                if (result.length > 0) {
                    console.log('First station:', JSON.stringify(result[0], null, 2));
                }
                this.setState({
                    stations: result,
                    loading: false,
                });
            } else {
                this.setState({
                    stations: [],
                    loading: false,
                    error: I18n.t('stationSearch_no_results_found'),
                });
            }
        } catch (error) {
            console.error('Search error:', error);
            this.setState({
                loading: false,
                error: I18n.t('stationSearch_error').replace(
                    '%s',
                    error instanceof Error ? error.message : String(error),
                ),
            });
        }
    };

    handleStationSelect = (station: Station): void => {
        this.setState({ selectedStation: station });
    };

    handleConfirm = (): void => {
        if (this.state.selectedStation) {
            console.log('Confirming station:', this.state.selectedStation);
            if (this.props.onStationSelected) {
                this.props.onStationSelected(
                    this.state.selectedStation.id,
                    this.state.selectedStation.name,
                    this.state.selectedStation.products,
                );
            }
            this.handleClose();
        }
    };

    getProductIcons = (products?: Station['products']): React.ReactElement[] => {
        if (!products) {
            console.log('No products provided');
            return [];
        }

        console.log('Products:', products);
        const icons: React.ReactElement[] = [];
        const iconMap: Record<string, { icon: React.ReactElement; label: string; color: string }> = {
            tram: { icon: <TramIcon fontSize="small" />, label: 'tram', color: '#D5001C' },
            bus: { icon: <DirectionsBusIcon fontSize="small" />, label: 'bus', color: '#a5027D' },
            subway: { icon: <SubwayIcon fontSize="small" />, label: 'u_bahn', color: '#0065AE' },
            express: { icon: <DirectionsRailwayIcon fontSize="small" />, label: 'ice_ic_ec', color: '#ec0016' },
            regional: { icon: <TrainIcon fontSize="small" />, label: 're_rb', color: '#1455C0' },
            regionalExpress: { icon: <TrainIcon fontSize="small" />, label: 're', color: '#0A3D62' },
            nationalExpress: { icon: <TrainIcon fontSize="small" />, label: 'ice', color: '#FF6F00' },
            national: { icon: <TrainIcon fontSize="small" />, label: 'ic_ec', color: '#FF8F00' },
            ferry: { icon: <DirectionsBoatIcon fontSize="small" />, label: 'ferry', color: '#0080C8' },
            suburban: { icon: <TrainIcon fontSize="small" />, label: 's_bahn', color: '#008D4F' },
        };

        Object.entries(products).forEach(([key, value]) => {
            console.log(`Product ${key}: ${value}`);
            if (value && iconMap[key]) {
                icons.push(
                    <Tooltip
                        key={key}
                        title={I18n.t(iconMap[key].label)}
                        arrow
                    >
                        <Box
                            key={key}
                            component="span"
                            title={iconMap[key].label}
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                color: iconMap[key].color,
                                mr: 1,
                            }}
                        >
                            {iconMap[key].icon}
                        </Box>
                    </Tooltip>,
                );
            }
        });

        console.log('Generated icons count:', icons.length);
        return icons;
    };

    renderItem(_error: string, _disabled: boolean): React.ReactElement {
        const { searchQuery, stations, selectedStation, loading, error } = this.state;

        return (
            <Dialog
                open={true}
                onClose={this.handleClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>{I18n.t('stationSearch_title')}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label={I18n.t('stationSearch_input_label')}
                        value={searchQuery}
                        onChange={this.handleSearchChange}
                        placeholder={I18n.t('stationSearch_input_placeholder')}
                        sx={{ mt: 2, mb: 2 }}
                    />

                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {error && (
                        <Typography
                            color="error"
                            sx={{ p: 2, textAlign: 'center' }}
                        >
                            {error}
                        </Typography>
                    )}

                    {!loading && !error && stations.length > 0 && (
                        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {stations.map(station => (
                                <ListItem
                                    key={station.id}
                                    disablePadding
                                >
                                    <ListItemButton
                                        selected={selectedStation?.id === station.id}
                                        onClick={() => this.handleStationSelect(station)}
                                    >
                                        <ListItemText
                                            primary={station.name}
                                            secondary={
                                                <Box sx={{ mt: 0.5 }}>
                                                    <Typography
                                                        variant="caption"
                                                        display="block"
                                                        sx={{ mb: 0.5 }}
                                                    >
                                                        {station.type
                                                            ? `${station.type}${station.location ? ` (${station.location.latitude?.toFixed(4)}, ${station.location.longitude?.toFixed(4)})` : ''}`
                                                            : station.id}
                                                    </Typography>
                                                    {station.products && (
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                                            {this.getProductIcons(station.products)}
                                                        </Box>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    )}

                    {!loading && !error && searchQuery.length >= 2 && stations.length === 0 && (
                        <Typography
                            color="text.secondary"
                            sx={{ p: 2, textAlign: 'center' }}
                        >
                            {I18n.t('stationSearch_no_results')}
                        </Typography>
                    )}

                    {searchQuery.length < 2 && (
                        <Typography
                            color="text.secondary"
                            sx={{ p: 2, textAlign: 'center' }}
                        >
                            {I18n.t('stationSearch_min_chars')}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.handleClose}>{I18n.t('stationSearch_cancel')}</Button>
                    <Button
                        onClick={this.handleConfirm}
                        variant="contained"
                        disabled={!selectedStation}
                    >
                        {I18n.t('stationSearch_confirm')}
                    </Button>
                </DialogActions>
            </Dialog>
        );
    }
}

export default StationSearch;

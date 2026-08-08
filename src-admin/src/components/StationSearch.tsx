import { I18n } from '@iobroker/gui-components';
import type { ConfigGenericProps } from '@iobroker/json-config';
import {
    Box,
    Button,
    CircularProgress,
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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeProducts, productConfig, type Products } from './Products';

export interface Station {
    id: string;
    name: string;
    type?: string;
    location?: {
        latitude?: number;
        longitude?: number;
    };
    products?: Products;
}

interface StationSearchProps {
    oContext: ConfigGenericProps['oContext'];
    onStationSelected?: (stationId: string, stationName: string, availableProducts?: Station['products']) => void;
    onClose?: () => void;
    alive: boolean;
}

const getProductIcons = (products?: Station['products']): React.ReactElement[] => {
    if (!products) {
        return [];
    }

    const icons: React.ReactElement[] = [];
    Object.entries(products).forEach(([key, value]) => {
        if (value) {
            const config = productConfig.find(p => p.key === key);
            if (config) {
                const IconComponent = config.icon;
                icons.push(
                    <Tooltip
                        key={key}
                        title={I18n.t(config.label)}
                        arrow
                    >
                        <Box
                            component="span"
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                color: config.color,
                                mr: 1,
                            }}
                        >
                            <IconComponent fontSize="small" />
                        </Box>
                    </Tooltip>,
                );
            }
        }
    });

    return icons;
};

const StationSearch: React.FC<StationSearchProps> = ({ oContext, onStationSelected, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [stations, setStations] = useState<Station[]>([]);
    const [selectedStation, setSelectedStation] = useState<Station | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const searchStations = useCallback(
        async (query: string): Promise<void> => {
            setLoading(true);
            setError(null);

            try {
                const result = await oContext.socket.sendTo(
                    `${oContext.adapterName}.${oContext.instance}`,
                    'location',
                    { query },
                );

                if (result && Array.isArray(result)) {
                    console.log('Search result:', result);
                    const normalized = result.map((station: Station) => ({
                        ...station,
                        products: normalizeProducts(station.products as Record<string, boolean>),
                    }));
                    setStations(normalized);
                    setLoading(false);
                } else {
                    setStations([]);
                    setLoading(false);
                    setError(I18n.t('stationSearch_no_results_found'));
                }
            } catch (err) {
                console.error('Search error:', err);
                setLoading(false);
                setError(I18n.t('stationSearch_error').replace('%s', err instanceof Error ? err.message : String(err)));
            }
        },
        [oContext],
    );

    const handleSearchChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            const query = event.target.value;
            setSearchQuery(query);

            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }

            if (query.length >= 2) {
                searchTimeoutRef.current = setTimeout(() => {
                    void searchStations(query);
                }, 500);
            } else {
                setStations([]);
                setSelectedStation(null);
            }
        },
        [searchStations],
    );

    const handleClose = useCallback((): void => {
        onClose?.();
    }, [onClose]);

    const handleConfirm = useCallback((): void => {
        if (selectedStation) {
            onStationSelected?.(selectedStation.id, selectedStation.name, selectedStation.products);
            handleClose();
        }
    }, [selectedStation, onStationSelected, handleClose]);

    return (
        <>
            <DialogTitle>{I18n.t('stationSearch_title')}</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    fullWidth
                    label={I18n.t('stationSearch_input_label')}
                    value={searchQuery}
                    onChange={handleSearchChange}
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
                                    onClick={() => setSelectedStation(station)}
                                >
                                    <ListItemText
                                        primary={station.name}
                                        secondary={
                                            <Box sx={{ mt: 0.5 }}>
                                                <Typography
                                                    variant="caption"
                                                    sx={{ display: 'block', mb: 0.5 }}
                                                >
                                                    {station.type
                                                        ? `${station.type}${station.location ? ` (${station.location.latitude?.toFixed(4)}, ${station.location.longitude?.toFixed(4)})` : ''}`
                                                        : station.id}
                                                </Typography>
                                                {station.products && (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                                                        {getProductIcons(station.products)}
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
                <Button onClick={handleClose}>{I18n.t('stationSearch_cancel')}</Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    disabled={!selectedStation}
                >
                    {I18n.t('stationSearch_confirm')}
                </Button>
            </DialogActions>
        </>
    );
};

export default StationSearch;

import { I18n } from '@iobroker/adapter-react-v5';
import { Box, Divider, FormControlLabel, Paper, Switch, TextField, Typography } from '@mui/material';
import React from 'react';
import ProductSelector, { defaultProducts, type Products } from './ProductSelector';

interface Station {
    id: string;
    name: string;
    customName?: string;
    enabled?: boolean;
    numDepartures?: number;
    offsetTime?: number;
    products?: Products;
    availableProducts?: Partial<Products>; // Produkte die von HAFAS für diese Station zurückgegeben wurden
    client_profile?: string;
}

interface StationConfigProps {
    station: Station | null;
    onUpdate?: (stationId: string, updates: Partial<Station>) => void;
}

const StationConfig: React.FC<StationConfigProps> = ({ station, onUpdate }) => {
    const handleCustomNameChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (station && onUpdate) {
            onUpdate(station.id, { customName: event.target.value });
        }
    };

    const handleEnabledChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (station && onUpdate) {
            onUpdate(station.id, { enabled: event.target.checked });
        }
    };

    const handlenumDeparturesChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (station && onUpdate) {
            const value = parseInt(event.target.value, 10);
            if (!isNaN(value) && value > 0) {
                onUpdate(station.id, { numDepartures: value });
            }
        }
    };

    const handleOffsetTimeChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (station && onUpdate) {
            const value = parseInt(event.target.value, 10);
            if (!isNaN(value) && value >= 0) {
                onUpdate(station.id, { offsetTime: value });
            }
        }
    };

    const handleProductsChange = (products: Products): void => {
        if (station && onUpdate) {
            onUpdate(station.id, { products });
        }
    };

    return (
        <Paper sx={{ p: 2, height: '100%' }}>
            <Typography
                variant="h6"
                sx={{ mb: 2 }}
            >
                {I18n.t('station_configuration')}
            </Typography>

            {station ? (
                <Box>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                    >
                        {I18n.t('configuration_for_station')}: {station.name}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Station ID (read-only) */}
                        <TextField
                            label={I18n.t('station_id')}
                            value={station.id}
                            disabled
                            fullWidth
                            size="small"
                        />

                        {/* Original Name (read-only) */}
                        <TextField
                            label={I18n.t('station_name')}
                            value={station.name}
                            disabled
                            fullWidth
                            size="small"
                        />

                        {/* Custom Name */}
                        <TextField
                            label={I18n.t('custom_name')}
                            value={station.customName || station.name}
                            onChange={handleCustomNameChange}
                            fullWidth
                            size="small"
                            helperText={I18n.t('custom_name_hint')}
                        />

                        {/* Enabled Switch */}
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={station.enabled !== false}
                                    onChange={handleEnabledChange}
                                />
                            }
                            label={I18n.t('enabled')}
                        />

                        {/* Count Departures */}
                        <TextField
                            label={I18n.t('departure_count')}
                            type="number"
                            value={station.numDepartures || 3}
                            onChange={handlenumDeparturesChange}
                            fullWidth
                            size="small"
                            inputProps={{ min: 1, max: 50 }}
                            helperText={I18n.t('departure_count_hint')}
                        />

                        {/* Offset Time */}
                        <TextField
                            label={I18n.t('offset_time')}
                            type="number"
                            value={station.offsetTime || 0}
                            onChange={handleOffsetTimeChange}
                            fullWidth
                            size="small"
                            inputProps={{ min: 0 }}
                            helperText={I18n.t('offset_time_hint')}
                        />

                        <Divider sx={{ my: 1 }} />

                        {/* Product Selector */}
                        <ProductSelector
                            products={station.products || defaultProducts}
                            onChange={handleProductsChange}
                            disabled={station.enabled === false}
                            availableProducts={station.availableProducts}
                        />
                    </Box>
                </Box>
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '80%',
                        color: 'text.secondary',
                    }}
                >
                    <Typography variant="body2">{I18n.t('select_station_to_configure')}</Typography>
                </Box>
            )}
        </Paper>
    );
};

export default StationConfig;

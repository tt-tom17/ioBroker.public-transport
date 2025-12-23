import { I18n } from '@iobroker/adapter-react-v5';
import type { ConfigGenericProps } from '@iobroker/json-config';
import { Box, Button, Dialog, Divider, FormControlLabel, Paper, Switch, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import ProductSelector, { defaultProducts, filterAvailableProducts, type Products } from './ProductSelector';
import StationSearch from './StationSearch';

interface Journey {
    id: string;
    customName: string;
    fromStationId?: string;
    fromStationName?: string;
    toStationId?: string;
    toStationName?: string;
    enabled?: boolean;
    numResults?: number;
    products?: Products;
    availableProducts?: Partial<Products>; // Produkte die für diese Route verfügbar sind
    client_profile?: string;
}

interface JourneyConfigProps {
    journey: Journey | null;
    onUpdate?: (journeyId: string, updates: Partial<Journey>) => void;
    configProps?: ConfigGenericProps;
}

const JourneyConfig: React.FC<JourneyConfigProps> = ({ journey, onUpdate, configProps }) => {
    const [showFromSearch, setShowFromSearch] = useState(false);
    const [showToSearch, setShowToSearch] = useState(false);

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (journey && onUpdate) {
            onUpdate(journey.id, { customName: event.target.value });
        }
    };

    const handleEnabledChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (journey && onUpdate) {
            onUpdate(journey.id, { enabled: event.target.checked });
        }
    };

    const handleNumResultsChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (journey && onUpdate) {
            const value = parseInt(event.target.value, 10);
            if (!isNaN(value) && value > 0) {
                onUpdate(journey.id, { numResults: value });
            }
        }
    };

    const handleProductsChange = (products: Products): void => {
        if (journey && onUpdate) {
            onUpdate(journey.id, { products });
        }
    };

    const handleFromStationSelected = (
        stationId: string,
        stationName: string,
        availableProducts?: Partial<Products>,
    ): void => {
        if (journey && onUpdate) {
            const filteredProducts = filterAvailableProducts(availableProducts);
            onUpdate(journey.id, {
                fromStationId: stationId,
                fromStationName: stationName,
                availableProducts: filteredProducts,
            });
        }
        setShowFromSearch(false);
    };

    const handleToStationSelected = (
        stationId: string,
        stationName: string,
        availableProducts?: Partial<Products>,
    ): void => {
        if (journey && onUpdate) {
            const filteredProducts = filterAvailableProducts(availableProducts);
            // Merge die availableProducts von beiden Stationen
            const mergedProducts = journey.availableProducts
                ? filterAvailableProducts({ ...journey.availableProducts, ...filteredProducts })
                : filteredProducts;
            onUpdate(journey.id, {
                toStationId: stationId,
                toStationName: stationName,
                availableProducts: mergedProducts,
            });
        }
        setShowToSearch(false);
    };

    return (
        <>
            <Paper sx={{ p: 2, height: '100%' }}>
                <Typography
                    variant="h6"
                    sx={{ mb: 2 }}
                >
                    {I18n.t('journey_configuration')}
                </Typography>

                {journey ? (
                    <Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {/* Journey Name */}
                            <TextField
                                label={I18n.t('journey_name')}
                                value={journey.customName}
                                onChange={handleNameChange}
                                fullWidth
                                size="small"
                                helperText={I18n.t('journey_name_hint')}
                            />

                            {/* From Station */}
                            <Box>
                                <TextField
                                    label={I18n.t('from_station')}
                                    value={journey.fromStationName || ''}
                                    disabled
                                    fullWidth
                                    size="small"
                                    helperText={journey.fromStationId ? `ID: ${journey.fromStationId}` : ''}
                                />
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setShowFromSearch(true)}
                                    sx={{ mt: 1 }}
                                    fullWidth
                                >
                                    {journey.fromStationName
                                        ? I18n.t('change_from_station')
                                        : I18n.t('select_from_station')}
                                </Button>
                            </Box>

                            {/* To Station */}
                            <Box>
                                <TextField
                                    label={I18n.t('to_station')}
                                    value={journey.toStationName || ''}
                                    disabled
                                    fullWidth
                                    size="small"
                                    helperText={journey.toStationId ? `ID: ${journey.toStationId}` : ''}
                                />
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setShowToSearch(true)}
                                    sx={{ mt: 1 }}
                                    fullWidth
                                >
                                    {journey.toStationName ? I18n.t('change_to_station') : I18n.t('select_to_station')}
                                </Button>
                            </Box>

                            {/* Enabled Switch */}
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={journey.enabled !== false}
                                        onChange={handleEnabledChange}
                                    />
                                }
                                label={I18n.t('enabled')}
                            />

                            {/* Number of Results */}
                            <TextField
                                label={I18n.t('journey_results_count')}
                                type="number"
                                value={journey.numResults || 5}
                                onChange={handleNumResultsChange}
                                fullWidth
                                size="small"
                                inputProps={{ min: 1, max: 20 }}
                                helperText={I18n.t('journey_results_count_hint')}
                            />

                            <Divider sx={{ my: 1 }} />

                            {/* Product Selector */}
                            <ProductSelector
                                products={journey.products || defaultProducts}
                                onChange={handleProductsChange}
                                disabled={journey.enabled === false}
                                availableProducts={journey.availableProducts}
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
                        <Typography variant="body2">{I18n.t('select_journey_to_configure')}</Typography>
                    </Box>
                )}
            </Paper>

            {/* From Station Search Dialog */}
            {showFromSearch && journey && configProps && (
                <Dialog
                    open={showFromSearch}
                    onClose={() => setShowFromSearch(false)}
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
                        {...configProps}
                        onStationSelected={handleFromStationSelected}
                        onClose={() => setShowFromSearch(false)}
                    />
                </Dialog>
            )}

            {/* To Station Search Dialog */}
            {showToSearch && journey && configProps && (
                <Dialog
                    open={showToSearch}
                    onClose={() => setShowToSearch(false)}
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
                        {...configProps}
                        onStationSelected={handleToStationSelected}
                        onClose={() => setShowToSearch(false)}
                    />
                </Dialog>
            )}
        </>
    );
};

export default JourneyConfig;

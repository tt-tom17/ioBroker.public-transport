import { I18n } from '@iobroker/gui-components';
import type { ConfigGenericProps } from '@iobroker/json-config';
import type { SelectChangeEvent } from '@mui/material';
import {
    Box,
    Button,
    Dialog,
    Divider,
    FormControl,
    FormControlLabel,
    FormHelperText,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { defaultProducts, getProductsForProfile, type Products } from './Products';
import ProductSelector from './ProductSelector';
import StationSearch from './StationSearch';

// Auswahlwerte für „Anzahl Umstiege": -1 = Backend entscheidet (unbegrenzt), 0 = nur Direktverbindungen
const TRANSFER_OPTIONS = [-1, 0, 1, 2, 3, 4, 5];

interface Journey {
    id: string;
    customName: string;
    fromStationId?: string;
    fromStationName?: string;
    toStationId?: string;
    toStationName?: string;
    enabled?: boolean;
    numResults?: number;
    transfers?: number;
    products?: Products;
    availableProducts?: Partial<Products>; // Produkte die für diese Route verfügbar sind
    client_profile?: string;
    nspanel?: boolean;
}

interface JourneyConfigProps {
    journey: Journey | null;
    onUpdate?: (journeyId: string, updates: Partial<Journey>) => void;
    oContext?: ConfigGenericProps['oContext'];
    alive: boolean;
    serviceType?: string;
    profile?: string;
}

const JourneyConfig: React.FC<JourneyConfigProps> = ({ journey, onUpdate, oContext, alive, serviceType, profile }) => {
    const [showFromSearch, setShowFromSearch] = useState(false);
    const [showToSearch, setShowToSearch] = useState(false);
    const profileProducts = getProductsForProfile(serviceType ?? '', profile ?? '');

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

    const handleNsPanelChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        if (journey && onUpdate) {
            onUpdate(journey.id, { nspanel: event.target.checked });
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

    const handleTransfersChange = (event: SelectChangeEvent<number>): void => {
        if (journey && onUpdate) {
            const raw = event.target.value;
            const value = typeof raw === 'number' ? raw : parseInt(raw, 10);
            if (!isNaN(value)) {
                onUpdate(journey.id, { transfers: value });
            }
        }
    };

    const handleProductsChange = (products: Products): void => {
        if (journey && onUpdate) {
            // Wenn availableProducts definiert sind, filtere nur die verfügbaren Produkte
            let productsToSave: Products = products;
            if (journey.availableProducts) {
                productsToSave = {};
                // Nur Produkte speichern, die in availableProducts vorhanden sind
                Object.keys(journey.availableProducts).forEach(key => {
                    const productKey = key as keyof Products;
                    if (productKey in products) {
                        productsToSave[productKey] = products[productKey];
                    }
                });
            }
            onUpdate(journey.id, { products: productsToSave });
        }
    };

    const handleFromStationSelected = (stationId: string, stationName: string): void => {
        if (journey && onUpdate) {
            onUpdate(journey.id, {
                fromStationId: stationId,
                fromStationName: stationName,
            });
        }
        setShowFromSearch(false);
    };

    const handleToStationSelected = (stationId: string, stationName: string): void => {
        if (journey && onUpdate) {
            onUpdate(journey.id, {
                toStationId: stationId,
                toStationName: stationName,
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
                                disabled={!alive}
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
                                    disabled={!alive}
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
                                    disabled={!alive}
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
                                        disabled={!alive}
                                    />
                                }
                                label={I18n.t('enabled')}
                            />

                            {/* NSPanel Channel Switch */}
                            <Box>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={journey.nspanel === true}
                                            onChange={handleNsPanelChange}
                                            disabled={!alive}
                                        />
                                    }
                                    label={I18n.t('nspanel_channel')}
                                />
                                <FormHelperText>{I18n.t('nspanel_channel_hint')}</FormHelperText>
                            </Box>

                            {/* Number of Results */}
                            <TextField
                                label={I18n.t('journey_results_count')}
                                type="number"
                                value={journey.numResults || 5}
                                onChange={handleNumResultsChange}
                                fullWidth
                                size="small"
                                slotProps={{ htmlInput: { min: 1, max: 20 } }}
                                helperText={I18n.t('journey_results_count_hint')}
                                disabled={!alive}
                            />

                            {/* Number of Transfers */}
                            <FormControl
                                fullWidth
                                size="small"
                                disabled={!alive}
                            >
                                <InputLabel id="journey-transfers-label">{I18n.t('journey_transfers')}</InputLabel>
                                <Select
                                    labelId="journey-transfers-label"
                                    id="journey-transfers-select"
                                    value={journey.transfers ?? -1}
                                    label={I18n.t('journey_transfers')}
                                    onChange={handleTransfersChange}
                                    disabled={!alive}
                                >
                                    {TRANSFER_OPTIONS.map(option => (
                                        <MenuItem
                                            key={option}
                                            value={option}
                                        >
                                            {option === -1
                                                ? `-1 (${I18n.t('journey_transfers_any')})`
                                                : option === 0
                                                  ? `0 (${I18n.t('journey_transfers_direct')})`
                                                  : option}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>{I18n.t('journey_transfers_hint')}</FormHelperText>
                            </FormControl>

                            <Divider sx={{ my: 1 }} />

                            {/* Product Selector */}
                            <ProductSelector
                                products={journey.products || defaultProducts}
                                onChange={handleProductsChange}
                                disabled={journey.enabled === false || !alive}
                                availableProducts={journey.availableProducts ?? profileProducts}
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
            {showFromSearch && journey && oContext && (
                <Dialog
                    open
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
                        oContext={oContext}
                        alive={alive}
                        onStationSelected={handleFromStationSelected}
                        onClose={() => setShowFromSearch(false)}
                    />
                </Dialog>
            )}

            {/* To Station Search Dialog */}
            {showToSearch && journey && oContext && (
                <Dialog
                    open
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
                        oContext={oContext}
                        alive={alive}
                        onStationSelected={handleToStationSelected}
                        onClose={() => setShowToSearch(false)}
                    />
                </Dialog>
            )}
        </>
    );
};

export default JourneyConfig;

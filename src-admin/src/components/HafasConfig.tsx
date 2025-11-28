import { I18n } from '@iobroker/adapter-react-v5';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import type { SelectChangeEvent } from '@mui/material';
import {
    Box,
    Button,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import React from 'react';
import StationSearch from './StationSearch';

interface HafasConfigState extends ConfigGenericState {
    showStationSearch: boolean;
}

class HafasConfig extends ConfigGeneric<ConfigGenericProps, HafasConfigState> {
    constructor(props: ConfigGenericProps) {
        super(props);
        this.state = {
            ...this.state,
            showStationSearch: false,
        };
    }

    renderItem(_error: string, disabled: boolean): React.ReactElement {
        // Use ConfigGeneric.getValue to safely get values
        const hafasProfile = ConfigGeneric.getValue(this.props.data, 'hafasProfile') as string;
        const clientName = ConfigGeneric.getValue(this.props.data, 'clientName') as string;
        const stationId = ConfigGeneric.getValue(this.props.data, 'stationId') as string;
        const stationName = ConfigGeneric.getValue(this.props.data, 'stationName') as string;

        const handleProfileChange = async (event: SelectChangeEvent<string>): Promise<void> => {
            const newValue = event.target.value;
            await this.onChange('hafasProfile', newValue);
        };

        const handleClientNameChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
            const newValue = event.target.value;
            await this.onChange('clientName', newValue);
        };

        const handleOpenStationSearch = (): void => {
            this.setState({ showStationSearch: true });
        };

        const handleCloseStationSearch = (): void => {
            this.setState({ showStationSearch: false });
        };

        const handleStationSelected = async (selectedStationId: string, selectedStationName: string): Promise<void> => {
            console.log('Station selected:', { id: selectedStationId, name: selectedStationName });
            console.log('Saving stationId:', selectedStationId);
            console.log('Saving stationName:', selectedStationName);

            // Save both values sequentially to ensure they both get saved
            await this.onChange('stationId', selectedStationId);
            await this.onChange('stationName', selectedStationName);

            // Verify the values were saved
            const savedId = ConfigGeneric.getValue(this.props.data, 'stationId');
            const savedName = ConfigGeneric.getValue(this.props.data, 'stationName');
            console.log('Saved values:', { savedId, savedName });

            this.setState({ showStationSearch: false });
        };

        return (
            <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 1200, mx: 'auto' }}>
                <Typography
                    variant="h5"
                    sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                    {I18n.t('hafasConfig_title')}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
                    <FormControl
                        sx={{ flex: { sm: '1 1 0' }, minWidth: { xs: '100%', sm: 200 } }}
                        disabled={disabled}
                        fullWidth
                    >
                        <InputLabel id="hafas-profile-label">{I18n.t('hafasConfig_profile_label')}</InputLabel>
                        <Select
                            labelId="hafas-profile-label"
                            id="hafas-profile-select"
                            value={hafasProfile || ''}
                            label={I18n.t('hafasConfig_profile_label')}
                            onChange={handleProfileChange}
                        >
                            <MenuItem value="vbb">{I18n.t('hafasConfig_profile_vbb')}</MenuItem>
                            <MenuItem value="db">{I18n.t('hafasConfig_profile_db')}</MenuItem>
                        </Select>
                        <FormHelperText>{I18n.t('hafasConfig_profile_helper')}</FormHelperText>
                    </FormControl>

                    <FormControl
                        sx={{ flex: { sm: '1 1 0' }, minWidth: { xs: '100%', sm: 200 } }}
                        disabled={disabled}
                        fullWidth
                    >
                        <TextField
                            id="client-name-input"
                            label={I18n.t('hafasConfig_clientName_label')}
                            value={clientName || ''}
                            onChange={handleClientNameChange}
                            helperText={I18n.t('hafasConfig_clientName_helper')}
                            disabled={disabled}
                            fullWidth
                        />
                    </FormControl>
                </Box>

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        alignItems: { sm: 'flex-start' },
                    }}
                >
                    <TextField
                        label={I18n.t('hafasConfig_station_label')}
                        value={stationName || stationId || ''}
                        InputProps={{
                            readOnly: true,
                        }}
                        helperText={
                            stationId
                                ? I18n.t('hafasConfig_station_helper_id').replace('%s', stationId)
                                : I18n.t('hafasConfig_station_helper_empty')
                        }
                        disabled={disabled}
                        fullWidth
                        sx={{ flex: { sm: 1 } }}
                    />
                    <Button
                        variant="contained"
                        onClick={handleOpenStationSearch}
                        disabled={disabled}
                        sx={{
                            mt: { xs: 0, sm: 0.5 },
                            minWidth: { xs: '100%', sm: 120 },
                            height: { xs: 48, sm: 56 },
                        }}
                        fullWidth={false}
                    >
                        {I18n.t('hafasConfig_station_search_button')}
                    </Button>
                </Box>

                {this.state.showStationSearch && (
                    <StationSearch
                        {...this.props}
                        onStationSelected={handleStationSelected}
                        onClose={handleCloseStationSearch}
                    />
                )}
            </Box>
        );
    }
}

export default HafasConfig;

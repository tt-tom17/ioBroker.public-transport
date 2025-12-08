import { I18n } from '@iobroker/adapter-react-v5';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import type { SelectChangeEvent } from '@mui/material';
import {
    Box,
    Checkbox,
    FormControl,
    FormControlLabel,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import React from 'react';

// Define the structure for service options
interface ServiceOption {
    value: string;
    label: string;
    serviceType: 'hafas' | 'vendo';
    profile: string;
}

// List of available service options
const SERVICE_OPTIONS: ServiceOption[] = [
    { value: 'hafas:vbb', label: 'HAFAS - VBB (Berlin/Brandenburg)', serviceType: 'hafas', profile: 'vbb' },
    { value: 'hafas:oebb', label: 'HAFAS - ÖBB (Österreich)', serviceType: 'hafas', profile: 'oebb' },
    { value: 'hafas:sbb', label: 'HAFAS - SBB (Schweiz)', serviceType: 'hafas', profile: 'sbb' },
    { value: 'vendo:db', label: 'Vendo - Deutsche Bahn', serviceType: 'vendo', profile: 'db' },
];

class ClientConfig extends ConfigGeneric<ConfigGenericProps, ConfigGenericState> {
    constructor(props: ConfigGenericProps) {
        super(props);
        this.state = {
            ...this.state,
        };
    }

    renderItem(_error: string, disabled: boolean): React.ReactElement {
        // Use ConfigGeneric.getValue to safely get values
        const serviceType = ConfigGeneric.getValue(this.props.data, 'serviceType') as string;
        const profile = ConfigGeneric.getValue(this.props.data, 'profile') as string;
        const combinedValue = `${serviceType || 'hafas'}:${profile || 'vbb'}`;

        const clientName = ConfigGeneric.getValue(this.props.data, 'clientName') as string;
        const pollInterval = ConfigGeneric.getValue(this.props.data, 'pollInterval') as number;
        const logUnknownTokens = ConfigGeneric.getValue(this.props.data, 'logUnknownTokens') as boolean;
        const suppressInfoLogs = ConfigGeneric.getValue(this.props.data, 'suppressInfoLogs') as boolean;

        const handlePollIntervalChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
            const newValue = parseInt(event.target.value, 10);
            await this.onChange('pollInterval', isNaN(newValue) ? 5 : newValue);
        };

        const handleProfileChange = async (event: SelectChangeEvent<string>): Promise<void> => {
            const selected = SERVICE_OPTIONS.find(opt => opt.value === event.target.value);
            if (selected) {
                await this.onChange('serviceType', selected.serviceType);
                await this.onChange('profile', selected.profile);
            }
        };

        const handleClientNameChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
            const newValue = event.target.value;
            await this.onChange('clientName', newValue);
        };

        const handlelogUnknownTokensChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
            await this.onChange('logUnknownTokens', event.target.checked);
        };

        const handleSuppressInfoLogsChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
            await this.onChange('suppressInfoLogs', event.target.checked);
        };

        return (
            <Box sx={{ p: { xs: 1, sm: 2 }, maxWidth: 1200, mx: 'auto' }}>
                <Typography
                    variant="h5"
                    sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                    {I18n.t('clientConfig_title')}
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
                    <FormControl
                        sx={{ flex: { sm: '1 1 0' }, minWidth: { xs: '100%', sm: 200 } }}
                        disabled={disabled}
                        fullWidth
                    >
                        <InputLabel id="client-profile-label">{I18n.t('clientConfig_profile_label')}</InputLabel>
                        <Select
                            labelId="client-profile-label"
                            id="client-profile-select"
                            value={combinedValue}
                            label={I18n.t('clientConfig_profile_label')}
                            onChange={handleProfileChange}
                        >
                            {SERVICE_OPTIONS.map(option => (
                                <MenuItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>{I18n.t('clientConfig_profile_helper')}</FormHelperText>
                    </FormControl>

                    <FormControl
                        sx={{ flex: { sm: '1 1 0' }, minWidth: { xs: '100%', sm: 200 } }}
                        disabled={disabled}
                        fullWidth
                    >
                        <TextField
                            id="client-name-input"
                            label={I18n.t('clientConfig_clientName_label')}
                            value={clientName || ''}
                            onChange={handleClientNameChange}
                            helperText={I18n.t('clientConfig_clientName_helper')}
                            disabled={disabled}
                            fullWidth
                        />
                    </FormControl>
                </Box>
                <Typography
                    variant="h5"
                    sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                >
                    {I18n.t('settings_title')}
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
                    <FormControl
                        sx={{ flex: { sm: '1 1 0' }, minWidth: { xs: '100%', sm: 200 } }}
                        disabled={disabled}
                        fullWidth
                    >
                        {/* Pollintervall */}
                        <TextField
                            label={I18n.t('clientConfig_pollInterval_label')}
                            type="number"
                            value={pollInterval || 0}
                            onChange={handlePollIntervalChange}
                            fullWidth
                            size="small"
                            inputProps={{ min: 5, step: 1, max: 60 }}
                            helperText={I18n.t('clientConfig_pollInterval_helper')}
                        />
                    </FormControl>

                    <FormControl
                        sx={{ flex: { sm: '1 1 0' }, minWidth: { xs: '100%', sm: 200 } }}
                        disabled={disabled}
                    >
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={logUnknownTokens || false}
                                    onChange={handlelogUnknownTokensChange}
                                    disabled={disabled}
                                />
                            }
                            label={I18n.t('clientConfig_logUnknownTokens_label')}
                        />
                        <FormHelperText>{I18n.t('clientConfig_logUnknownTokens_helper')}</FormHelperText>
                    </FormControl>

                    <FormControl
                        sx={{ flex: { sm: '1 1 0' }, minWidth: { xs: '100%', sm: 200 } }}
                        disabled={disabled}
                    >
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={suppressInfoLogs || false}
                                    onChange={handleSuppressInfoLogsChange}
                                    disabled={disabled}
                                />
                            }
                            label={I18n.t('clientConfig_suppressInfoLogs_label')}
                        />
                        <FormHelperText>{I18n.t('clientConfig_suppressInfoLogs_helper')}</FormHelperText>
                    </FormControl>
                </Box>
            </Box>
        );
    }
}

export default ClientConfig;

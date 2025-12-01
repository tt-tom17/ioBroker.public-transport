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

class ClientConfig extends ConfigGeneric<ConfigGenericProps, ConfigGenericState> {
    constructor(props: ConfigGenericProps) {
        super(props);
        this.state = {
            ...this.state,
        };
    }

    renderItem(_error: string, disabled: boolean): React.ReactElement {
        // Use ConfigGeneric.getValue to safely get values
        const hafasProfile = ConfigGeneric.getValue(this.props.data, 'hafasProfile') as string;
        const clientName = ConfigGeneric.getValue(this.props.data, 'clientName') as string;
        const pollInterval = ConfigGeneric.getValue(this.props.data, 'pollInterval') as number;
        const logUnknownTokens = ConfigGeneric.getValue(this.props.data, 'logUnknownTokens') as boolean;

        const handlePollIntervalChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
            const newValue = parseInt(event.target.value, 10);
            await this.onChange('pollInterval', isNaN(newValue) ? 5 : newValue);
        };

        const handleProfileChange = async (event: SelectChangeEvent<string>): Promise<void> => {
            const newValue = event.target.value;
            await this.onChange('hafasProfile', newValue);
        };

        const handleClientNameChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
            const newValue = event.target.value;
            await this.onChange('clientName', newValue);
        };

        const handlelogUnknownTokensChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
            await this.onChange('logUnknownTokens', event.target.checked);
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
                            value={hafasProfile || ''}
                            label={I18n.t('clientConfig_profile_label')}
                            onChange={handleProfileChange}
                        >
                            <MenuItem value="vbb">{I18n.t('clientConfig_profile_vbb')}</MenuItem>
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
                </Box>
            </Box>
        );
    }
}

export default ClientConfig;

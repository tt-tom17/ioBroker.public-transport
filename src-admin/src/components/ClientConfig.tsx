import { I18n } from '@iobroker/gui-components';
import { ConfigGeneric } from '@iobroker/json-config';
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
import { withConfigGeneric, type ConfigComponentProps } from './ConfigGenericWrapper';

interface ServiceOption {
    value: string;
    label: string;
    serviceType: 'hafas' | 'vendo' | 'motis' | 'efa';
    profile: string;
    disabled?: boolean;
}

/** Mindestwert für die Objektanzahl-Warnschwelle */
const OBJECTS_WARN_LIMIT_MIN = 5000;

const SERVICE_OPTIONS: ServiceOption[] = [
    { value: 'hafas:vbb', label: 'HAFAS - VBB (Berlin/Brandenburg)', serviceType: 'hafas', profile: 'vbb' },
    { value: 'hafas:oebb', label: 'HAFAS - ÖBB (Österreich)', serviceType: 'hafas', profile: 'oebb' },
    { value: 'hafas:vbn', label: 'HAFAS - VBN (Bremen/Niedersachsen)', serviceType: 'hafas', profile: 'vbn' },
    { value: 'hafas:rmv', label: 'HAFAS - RMV (Rhein-Main/Mainz)', serviceType: 'hafas', profile: 'rmv' },
    { value: 'hafas:vmt', label: 'HAFAS - VMT (Thüringen)', serviceType: 'hafas', profile: 'vmt' },
    // 'vendo:db' (Deutsche Bahn) deaktiviert: db-vendo-Endpoint liefert aktuell OPS_BLOCKED (serverseitige Sperre).
    { value: 'vendo:db', label: 'Vendo - Deutsche Bahn', serviceType: 'vendo', profile: 'db', disabled: true },
    { value: 'motis:compat', label: 'MOTIS - Transitous (DE & Europa)', serviceType: 'motis', profile: 'compat' },
    { value: 'efa:vrr', label: 'EFA - VRR (Rhein-Ruhr)', serviceType: 'efa', profile: 'vrr' },
];

/**
 * Vorbelegung der Basis-URL je EFA-Profil. Weitere EFA-Verbünde sprechen dasselbe Format und
 * lassen sich durch Überschreiben des Feldes anbinden.
 */
const EFA_DEFAULT_ENDPOINTS: Record<string, string> = {
    vrr: 'https://openservice.vrr.de/openservice',
};

const ClientConfigContent: React.FC<ConfigComponentProps> = ({ oContext, data, onChange, alive, disabled }) => {
    const serviceType = ConfigGeneric.getValue(data, 'serviceType') as string;
    const profile = ConfigGeneric.getValue(data, 'profile') as string;
    const combinedValue = `${serviceType || 'hafas'}:${profile || 'vbb'}`;

    const clientName = ConfigGeneric.getValue(data, 'clientName') as string;
    const efaEndpoint = ConfigGeneric.getValue(data, 'efaEndpoint') as string;
    const pollInterval = ConfigGeneric.getValue(data, 'pollInterval') as number;
    const suppressInfoLogs = ConfigGeneric.getValue(data, 'suppressInfoLogs') as boolean;
    const delayOffset = ConfigGeneric.getValue(data, 'delayOffset') as number;
    const objectsWarnLimit = ConfigGeneric.getValue(data, 'objectsWarnLimit') as number | undefined;

    const isDisabled = disabled || !alive;

    // Aktuelle Warnschwelle beim Öffnen der UI über onMessage vom laufenden Adapter laden.
    // Dient als Anzeige-Vorgabe, solange in der Config (native) noch kein Wert gespeichert ist.
    const [loadedWarnLimit, setLoadedWarnLimit] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (!alive) {
            setLoadedWarnLimit(null);
            return;
        }
        let cancelled = false;
        void (async (): Promise<void> => {
            try {
                const result = await oContext.socket.sendTo(
                    `${oContext.adapterName}.${oContext.instance}`,
                    'getObjectsWarnLimit',
                    {},
                );
                if (!cancelled) {
                    setLoadedWarnLimit(
                        result && typeof result.objectsWarnLimit === 'number' ? result.objectsWarnLimit : null,
                    );
                }
            } catch (err) {
                console.error('Failed to load objectsWarnLimit', err);
                if (!cancelled) {
                    setLoadedWarnLimit(null);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [alive, oContext]);

    // Im Feld angezeigter Wert: gespeicherte Config bevorzugen, sonst der via onMessage geladene Wert
    const warnLimitValue = objectsWarnLimit ?? loadedWarnLimit ?? '';
    const warnLimitInvalid = objectsWarnLimit !== undefined && objectsWarnLimit < OBJECTS_WARN_LIMIT_MIN;

    const handleObjectsWarnLimitChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const newValue = parseInt(event.target.value, 10);
        await onChange('objectsWarnLimit', isNaN(newValue) ? null : newValue);
    };

    const handlePollIntervalChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const newValue = parseInt(event.target.value, 10);
        await onChange('pollInterval', isNaN(newValue) ? 5 : newValue);
    };

    const handleProfileChange = async (event: SelectChangeEvent<string>): Promise<void> => {
        const selected = SERVICE_OPTIONS.find(opt => opt.value === event.target.value);
        if (selected) {
            await onChange('serviceType', selected.serviceType);
            await onChange('profile', selected.profile);
            // Beim Wechsel auf EFA die passende Basis-URL vorbelegen, aber eine bereits
            // eingetragene URL niemals überschreiben – sie kann bewusst abweichen.
            if (selected.serviceType === 'efa' && !efaEndpoint) {
                await onChange('efaEndpoint', EFA_DEFAULT_ENDPOINTS[selected.profile] ?? '');
            }
        }
    };

    const handleEfaEndpointChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        await onChange('efaEndpoint', event.target.value);
    };

    const handleClientNameChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        await onChange('clientName', event.target.value);
    };

    const handleSuppressInfoLogsChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        await onChange('suppressInfoLogs', event.target.checked);
    };

    const handleDelayOffsetChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const newValue = parseInt(event.target.value, 10);
        await onChange('delayOffset', isNaN(newValue) ? 0 : newValue);
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
                {/* Auswahl des Fahrplan-Services und Profils */}
                <FormControl
                    sx={{ flex: { sm: '1 1 0' }, minWidth: { xs: '100%', sm: 200 } }}
                    disabled={isDisabled}
                    fullWidth
                >
                    <InputLabel id="client-profile-label">{I18n.t('clientConfig_profile_label')}</InputLabel>
                    <Select
                        labelId="client-profile-label"
                        id="client-profile-select"
                        value={combinedValue}
                        label={I18n.t('clientConfig_profile_label')}
                        onChange={handleProfileChange}
                        disabled={isDisabled}
                    >
                        {SERVICE_OPTIONS.map(option => (
                            <MenuItem
                                key={option.value}
                                value={option.value}
                                disabled={option.disabled}
                            >
                                {option.disabled ? `${option.label} (${I18n.t('client_unavailable')})` : option.label}
                            </MenuItem>
                        ))}
                    </Select>
                    <FormHelperText>{I18n.t('clientConfig_profile_helper')}</FormHelperText>
                </FormControl>

                {/* Optionaler Name für den Client */}
                <FormControl
                    sx={{ flex: { sm: '1 1 0' }, minWidth: { xs: '100%', sm: 200 } }}
                    disabled={isDisabled}
                    fullWidth
                >
                    <TextField
                        id="client-name-input"
                        label={I18n.t('clientConfig_clientName_label')}
                        value={clientName || ''}
                        onChange={handleClientNameChange}
                        helperText={I18n.t('clientConfig_clientName_helper')}
                        disabled={isDisabled}
                        fullWidth
                    />
                </FormControl>
            </Box>

            {/* Basis-URL des EFA-Systems: nur bei EFA sichtbar, dort aber Pflichtangabe */}
            {serviceType === 'efa' && (
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
                    <FormControl
                        sx={{ flex: { sm: '1 1 0' }, minWidth: { xs: '100%', sm: 200 } }}
                        disabled={isDisabled}
                        fullWidth
                    >
                        <TextField
                            id="efa-endpoint-input"
                            label={I18n.t('clientConfig_efaEndpoint_label')}
                            value={efaEndpoint || ''}
                            onChange={handleEfaEndpointChange}
                            error={!!efaEndpoint && !/^https?:\/\//i.test(efaEndpoint)}
                            helperText={I18n.t('clientConfig_efaEndpoint_helper')}
                            disabled={isDisabled}
                            fullWidth
                        />
                    </FormControl>
                </Box>
            )}

            <Typography
                variant="h5"
                sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
            >
                {I18n.t('settings_title')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
                {/* Abruf Intervall in minuten */}
                <FormControl
                    sx={{ flex: { sm: '1 1 0' }, minWidth: { xs: '100%', sm: 200 } }}
                    disabled={isDisabled}
                    fullWidth
                >
                    <TextField
                        label={I18n.t('clientConfig_pollInterval_label')}
                        type="number"
                        value={pollInterval || 5}
                        onChange={handlePollIntervalChange}
                        fullWidth
                        size="small"
                        slotProps={{ htmlInput: { min: 5, step: 1, max: 60, disabled: isDisabled } }}
                        helperText={I18n.t('clientConfig_pollInterval_helper')}
                    />
                </FormControl>

                {/* Erweiterte Info-Logs unterdrücken */}
                <FormControl
                    sx={{ flex: { sm: '1 1 0' }, minWidth: { xs: '100%', sm: 200 } }}
                    disabled={isDisabled}
                >
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={suppressInfoLogs || false}
                                onChange={handleSuppressInfoLogsChange}
                                disabled={isDisabled}
                            />
                        }
                        label={I18n.t('clientConfig_suppressInfoLogs_label')}
                    />
                    <FormHelperText>{I18n.t('clientConfig_suppressInfoLogs_helper')}</FormHelperText>
                </FormControl>

                {/* Offset in Minuten, damit die Verspätung noch als Pünktlich gilt */}
                <FormControl
                    sx={{ flex: { sm: '1 1 0' }, minWidth: { xs: '100%', sm: 200 } }}
                    disabled={isDisabled}
                    fullWidth
                >
                    <TextField
                        label={I18n.t('clientConfig_delayOffset_label')}
                        type="number"
                        value={delayOffset || 2}
                        onChange={handleDelayOffsetChange}
                        fullWidth
                        size="small"
                        slotProps={{ htmlInput: { min: 2, step: 1, max: 60, disabled: isDisabled } }}
                        helperText={I18n.t('clientConfig_delayOffset_helper')}
                    />
                </FormControl>

                {/* Objektanzahl-Warnschwelle (js-controller): beim Öffnen via onMessage geladen, über Save gespeichert */}
                <FormControl
                    sx={{ flex: { sm: '1 1 0' }, minWidth: { xs: '100%', sm: 200 } }}
                    disabled={isDisabled}
                    fullWidth
                >
                    <TextField
                        label={I18n.t('clientConfig_objectsWarnLimit_label')}
                        type="number"
                        value={warnLimitValue}
                        onChange={handleObjectsWarnLimitChange}
                        fullWidth
                        size="small"
                        error={warnLimitInvalid}
                        slotProps={{ htmlInput: { min: OBJECTS_WARN_LIMIT_MIN, step: 100, disabled: isDisabled } }}
                        helperText={
                            warnLimitInvalid
                                ? I18n.t('clientConfig_objectsWarnLimit_min_error').replace(
                                      '%s',
                                      String(OBJECTS_WARN_LIMIT_MIN),
                                  )
                                : I18n.t('clientConfig_objectsWarnLimit_helper')
                        }
                    />
                </FormControl>
            </Box>
        </Box>
    );
};

export default withConfigGeneric(ClientConfigContent);

import { I18n } from '@iobroker/adapter-react-v5';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import React from 'react';

interface Station {
    id: string;
    name: string;
    customName?: string;
    enabled?: boolean;
    client_profile?: string;
}

interface StationListProps {
    stations: Station[];
    selectedStationId: string | null;
    onAddStation: () => void;
    onDeleteStation: (stationId: string) => void;
    onStationClick: (stationId: string) => void;
}

const StationList: React.FC<StationListProps> = ({
    stations,
    selectedStationId,
    onAddStation,
    onDeleteStation,
    onStationClick,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    return (
        <Paper sx={{ p: 2, height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'stretch' : 'center',
                    gap: 1,
                    mb: 2,
                }}
            >
                <Typography variant="h6">{I18n.t('stations_overview')}</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAddStation}
                    size="small"
                    fullWidth={isMobile}
                >
                    {I18n.t('add_station')}
                </Button>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {stations.length === 0 ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            color: 'text.secondary',
                        }}
                    >
                        <Typography variant="body2">{I18n.t('no_stations_hint')}</Typography>
                    </Box>
                ) : (
                    <List>
                        {stations.map(station => (
                            <ListItemButton
                                key={station.id}
                                selected={selectedStationId === station.id}
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    mb: 1,
                                    opacity: station.enabled === false ? 0.5 : 1,
                                    '&.Mui-selected': {
                                        backgroundColor: 'action.selected',
                                    },
                                }}
                                onClick={() => onStationClick(station.id)}
                            >
                                <ListItemText
                                    primary={station.customName || station.name}
                                    secondary={
                                        <>
                                            <Typography
                                                component="span"
                                                variant="caption"
                                                display="block"
                                            >
                                                ID: {station.id}
                                            </Typography>
                                            {station.customName && station.customName !== station.name && (
                                                <Typography
                                                    component="span"
                                                    variant="caption"
                                                    display="block"
                                                    color="text.secondary"
                                                >
                                                    Original: {station.name}
                                                </Typography>
                                            )}
                                            <Typography
                                                component="span"
                                                variant="caption"
                                                display="block"
                                            >
                                                {station.enabled === false ? I18n.t('disabled') : I18n.t('active')}
                                            </Typography>
                                            {station.client_profile && (
                                                <Typography
                                                    component="span"
                                                    variant="caption"
                                                    display="block"
                                                >
                                                    {station.client_profile}
                                                </Typography>
                                            )}
                                        </>
                                    }
                                    primaryTypographyProps={{ fontWeight: 500 }}
                                    secondaryTypographyProps={{ component: 'div' }}
                                />
                                <IconButton
                                    edge="end"
                                    aria-label="delete"
                                    onClick={e => {
                                        e.stopPropagation();
                                        onDeleteStation(station.id);
                                    }}
                                    size="small"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemButton>
                        ))}
                    </List>
                )}
            </Box>
        </Paper>
    );
};

export default StationList;

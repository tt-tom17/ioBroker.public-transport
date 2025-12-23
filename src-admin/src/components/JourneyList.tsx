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

interface Journey {
    id: string;
    customName: string;
    fromStationId?: string;
    fromStationName?: string;
    toStationId?: string;
    toStationName?: string;
    enabled?: boolean;
    client_profile?: string;
}

interface JourneyListProps {
    journeys: Journey[];
    selectedJourneyId: string | null;
    onAddJourney: () => void;
    onDeleteJourney: (journeyId: string) => void;
    onJourneyClick: (journeyId: string) => void;
}

const JourneyList: React.FC<JourneyListProps> = ({
    journeys,
    selectedJourneyId,
    onAddJourney,
    onDeleteJourney,
    onJourneyClick,
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
                <Typography variant="h6">{I18n.t('journeys_overview')}</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={onAddJourney}
                    size="small"
                    fullWidth={isMobile}
                >
                    {I18n.t('add_journey')}
                </Button>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {journeys.length === 0 ? (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            color: 'text.secondary',
                        }}
                    >
                        <Typography variant="body2">{I18n.t('no_journeys_hint')}</Typography>
                    </Box>
                ) : (
                    <List>
                        {journeys.map(journey => (
                            <ListItemButton
                                key={journey.id}
                                selected={selectedJourneyId === journey.id}
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    mb: 1,
                                    opacity: journey.enabled === false ? 0.5 : 1,
                                    '&.Mui-selected': {
                                        backgroundColor: 'action.selected',
                                    },
                                }}
                                onClick={() => onJourneyClick(journey.id)}
                            >
                                <ListItemText
                                    primary={journey.customName}
                                    secondary={
                                        <>
                                            {journey.fromStationName && (
                                                <Typography
                                                    component="span"
                                                    variant="caption"
                                                    display="block"
                                                >
                                                    {I18n.t('from')}: {journey.fromStationName}
                                                </Typography>
                                            )}
                                            {journey.toStationName && (
                                                <Typography
                                                    component="span"
                                                    variant="caption"
                                                    display="block"
                                                >
                                                    {I18n.t('to')}: {journey.toStationName}
                                                </Typography>
                                            )}
                                            <Typography
                                                component="span"
                                                variant="caption"
                                                display="block"
                                            >
                                                {journey.enabled === false ? I18n.t('disabled') : I18n.t('active')}
                                            </Typography>
                                            {journey.client_profile && (
                                                <Typography
                                                    component="span"
                                                    variant="caption"
                                                    display="block"
                                                >
                                                    {journey.client_profile}
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
                                        onDeleteJourney(journey.id);
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

export default JourneyList;

import { ConfigGeneric } from '@iobroker/json-config';
import { Box } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { withConfigGeneric, type ConfigComponentProps } from './ConfigGenericWrapper';
import JourneyConfig from './JourneyConfig';
import JourneyList from './JourneyList';
import { getProductsForProfile, type Products } from './Products';

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
    availableProducts?: Partial<Products>;
    client_profile?: string;
}

const JourneyManagerContent: React.FC<ConfigComponentProps> = ({ oContext, data, onChange, alive, onSave }) => {
    const [journeys, setJourneys] = useState<Journey[]>(() => {
        const saved = ConfigGeneric.getValue(data, 'journeyConfig');
        return Array.isArray(saved) ? saved : [];
    });
    const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);

    useEffect(() => {
        const saved = ConfigGeneric.getValue(data, 'journeyConfig');
        if (Array.isArray(saved)) {
            setJourneys(saved);
        }
    }, [data]);

    const handleAddJourney = useCallback((): void => {
        const newId = `journey_${Date.now()}`;

        const serviceType = ConfigGeneric.getValue(data, 'serviceType') as string;
        const profile = ConfigGeneric.getValue(data, 'profile') as string;
        const client_profile = `${serviceType || 'unknown'}:${profile || 'unknown'}`;

        const availableProducts = getProductsForProfile(serviceType, profile);

        const newJourney: Journey = {
            id: newId,
            customName: `Journey ${journeys.length + 1}`,
            enabled: true,
            numResults: 5,
            transfers: -1,
            products: { ...availableProducts } as Products,
            availableProducts,
            client_profile,
        };

        const updatedJourneys = [...journeys, newJourney];
        setJourneys(updatedJourneys);
        setSelectedJourneyId(newId);
        void onChange('journeyConfig', updatedJourneys);
    }, [data, journeys, onChange]);

    const handleDeleteJourney = useCallback(
        async (journeyId: string): Promise<void> => {
            const updated = journeys.filter(j => j.id !== journeyId);
            setJourneys(updated);
            setSelectedJourneyId(prev => (prev === journeyId ? null : prev));

            // ioBroker-Objekte rekursiv löschen (Journeys/{journeyId} inkl. Unterordner)
            try {
                await oContext.socket.delObjects(
                    `${oContext.adapterName}.${oContext.instance}.Journeys.${journeyId}`,
                    false,
                );
            } catch (err) {
                console.error('Cannot delete journey objects:', err);
            }

            // Konfiguration direkt speichern (ohne Dialog)
            await onSave('journeyConfig', updated);
        },
        [journeys, oContext, onSave],
    );

    const handleJourneyUpdate = useCallback(
        (journeyId: string, updates: Partial<Journey>): void => {
            setJourneys(prev => {
                const updated = prev.map(journey => (journey.id === journeyId ? { ...journey, ...updates } : journey));
                void onChange('journeyConfig', updated);
                return updated;
            });
        },
        [onChange],
    );

    const handleJourneyClick = useCallback((journeyId: string): void => {
        setSelectedJourneyId(journeyId);
    }, []);

    const selectedJourney = journeys.find(j => j.id === selectedJourneyId) || null;

    return (
        <Box sx={{ height: '100%', p: { xs: 1, sm: 2 } }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 2,
                    height: '100%',
                    width: '100%',
                }}
            >
                <Box
                    sx={{
                        width: { xs: '100%', md: 400 },
                        flexShrink: { md: 0 },
                        minHeight: { xs: 300, md: 'auto' },
                    }}
                >
                    <JourneyList
                        journeys={journeys}
                        selectedJourneyId={selectedJourneyId}
                        onAddJourney={handleAddJourney}
                        onDeleteJourney={handleDeleteJourney}
                        onJourneyClick={handleJourneyClick}
                        alive={alive}
                    />
                </Box>

                <Box
                    sx={{
                        width: { xs: '100%', md: 'calc(100% - 400px - 16px)' },
                        maxWidth: { md: '500px' },
                        flexGrow: { md: 1 },
                        minHeight: { xs: 200, md: 'auto' },
                    }}
                >
                    <JourneyConfig
                        journey={selectedJourney}
                        onUpdate={handleJourneyUpdate}
                        oContext={oContext}
                        alive={alive}
                        serviceType={ConfigGeneric.getValue(data, 'serviceType') as string}
                        profile={ConfigGeneric.getValue(data, 'profile') as string}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default withConfigGeneric(JourneyManagerContent, { useRenderItem: false });

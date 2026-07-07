import { ConfigGeneric } from '@iobroker/json-config';
import { Box, Dialog } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { withConfigGeneric, type ConfigComponentProps } from './ConfigGenericWrapper';
import { defaultProducts, getProductsForProfile, type Products } from './Products';
import StationConfig from './StationConfig';
import StationList from './StationList';
import StationSearch from './StationSearch';

interface Station {
    id: string;
    name: string;
    customName?: string;
    enabled?: boolean;
    numDepartures?: number;
    offsetTime?: number;
    duration?: number;
    products?: Products;
    availableProducts?: Partial<Products>;
    nativeProducts?: Partial<Products>; // Von HAFAS gemeldete Produkte der Station (unveränderlich)
    client_profile?: string;
}

const DepartureManagerContent: React.FC<ConfigComponentProps> = ({ oContext, data, onChange, alive, onSave }) => {
    const [stations, setStations] = useState<Station[]>(() => {
        const departures = ConfigGeneric.getValue(data, 'stationConfig');
        return Array.isArray(departures) ? departures : [];
    });
    const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
    const [showSearchDialog, setShowSearchDialog] = useState(false);

    useEffect(() => {
        const departures = ConfigGeneric.getValue(data, 'stationConfig');
        if (Array.isArray(departures)) {
            setStations(departures);
        }
    }, [data]);

    const handleAddStation = useCallback((): void => {
        setShowSearchDialog(true);
    }, []);

    const handleStationSelected = useCallback(
        (stationId: string, stationName: string, stationProducts?: Partial<Products>): void => {
            const serviceType = ConfigGeneric.getValue(data, 'serviceType') as string;
            const profile = ConfigGeneric.getValue(data, 'profile') as string;
            const client_profile = `${serviceType || 'unknown'}:${profile || 'unknown'}`;

            // Alle Produkte des Profils als verfügbare Produkte (alle auf true)
            const availableProducts = getProductsForProfile(serviceType, profile);

            // Initiale Auswahl: true für Produkte, die die Station laut HAFAS bedient
            const initialProducts: Products = {};
            Object.keys(availableProducts).forEach(key => {
                initialProducts[key as keyof Products] = stationProducts
                    ? (stationProducts[key as keyof Products] ?? false)
                    : true;
            });

            const newStation: Station = {
                id: stationId,
                name: stationName,
                customName: stationName,
                enabled: true,
                numDepartures: 10,
                products: Object.keys(initialProducts).length > 0 ? initialProducts : { ...defaultProducts },
                availableProducts,
                nativeProducts: stationProducts ?? availableProducts,
                client_profile,
            };

            setStations(prev => {
                const exists = prev.some(s => s.id === stationId);
                if (exists) {
                    return prev;
                }
                const updated = [...prev, newStation];
                void onChange('stationConfig', updated);
                return updated;
            });

            setSelectedStationId(stationId);
            setShowSearchDialog(false);
        },
        [data, onChange],
    );

    const handleDeleteStation = useCallback(
        async (stationId: string): Promise<void> => {
            const updated = stations.filter(s => s.id !== stationId);
            setStations(updated);
            setSelectedStationId(prev => (prev === stationId ? null : prev));

            // ioBroker-Objekte rekursiv löschen (Stations/{stationId} inkl. Unterordner)
            try {
                await oContext.socket.delObjects(
                    `${oContext.adapterName}.${oContext.instance}.Stations.${stationId}`,
                    false,
                );
            } catch (err) {
                console.error('Cannot delete station objects:', err);
            }

            // Konfiguration direkt speichern (ohne Dialog)
            await onSave('stationConfig', updated);
        },
        [stations, oContext, onSave],
    );

    const handleStationUpdate = useCallback(
        (stationId: string, updates: Partial<Station>): void => {
            setStations(prev => {
                const updated = prev.map(station => (station.id === stationId ? { ...station, ...updates } : station));
                void onChange('stationConfig', updated);
                return updated;
            });
        },
        [onChange],
    );

    const handleStationClick = useCallback((stationId: string): void => {
        setSelectedStationId(stationId);
    }, []);

    const handleCloseSearch = useCallback((): void => {
        setShowSearchDialog(false);
    }, []);

    const selectedStation = stations.find(s => s.id === selectedStationId) || null;

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
                    <StationList
                        stations={stations}
                        selectedStationId={selectedStationId}
                        onAddStation={handleAddStation}
                        onDeleteStation={handleDeleteStation}
                        onStationClick={handleStationClick}
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
                    <StationConfig
                        station={selectedStation}
                        onUpdate={handleStationUpdate}
                        alive={alive}
                    />
                </Box>
            </Box>

            {showSearchDialog && (
                <Dialog
                    open
                    onClose={handleCloseSearch}
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
                        onStationSelected={handleStationSelected}
                        onClose={handleCloseSearch}
                    />
                </Dialog>
            )}
        </Box>
    );
};

export default withConfigGeneric(DepartureManagerContent, { useRenderItem: false });

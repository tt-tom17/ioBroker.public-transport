import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { Box } from '@mui/material';
import React from 'react';
import JourneyConfig from './JourneyConfig';
import JourneyList from './JourneyList';
import { defaultProducts, type Products } from './ProductSelector';

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
    client_profile?: string;
}

interface JourneyManagerState extends ConfigGenericState {
    journeys: Journey[];
    selectedJourneyId: string | null;
}

class JourneyManager extends ConfigGeneric<ConfigGenericProps, JourneyManagerState> {
    constructor(props: ConfigGenericProps) {
        super(props);

        // Initialisiere journeys aus props.data.journeyConfig
        const journeys = ConfigGeneric.getValue(this.props.data, 'journeyConfig');
        const initialJourneys = Array.isArray(journeys) ? journeys : [];

        this.state = {
            ...this.state,
            journeys: initialJourneys,
            selectedJourneyId: null,
        };
    }

    componentDidMount(): void {
        // Lade gespeicherte Journeys beim Start
        const journeys = ConfigGeneric.getValue(this.props.data, 'journeyConfig');
        if (Array.isArray(journeys)) {
            this.setState({ journeys });
        }
    }

    componentDidUpdate(prevProps: ConfigGenericProps): void {
        if (prevProps.data !== this.props.data) {
            const journeys = ConfigGeneric.getValue(this.props.data, 'journeyConfig');
            if (Array.isArray(journeys)) {
                this.setState({ journeys });
            }
        }
    }

    handleAddJourney = (): void => {
        // Erstelle eine neue Journey mit einer eindeutigen ID
        const newId = `journey_${Date.now()}`;

        // Hole die aktuellen ClientConfig-Einstellungen
        const serviceType = ConfigGeneric.getValue(this.props.data, 'serviceType') as string;
        const profile = ConfigGeneric.getValue(this.props.data, 'profile') as string;
        const client_profile = `${serviceType || 'unknown'}:${profile || 'unknown'}`;

        const newJourney: Journey = {
            id: newId,
            customName: `Journey ${this.state.journeys.length + 1}`,
            enabled: true,
            numResults: 5,
            products: { ...defaultProducts },
            client_profile,
        };

        const updatedJourneys = [...this.state.journeys, newJourney];
        this.setState({
            journeys: updatedJourneys,
            selectedJourneyId: newId, // Automatisch die neue Journey auswählen
        });

        // Speichere die Änderungen
        void this.onChange('journeyConfig', updatedJourneys);
    };

    handleDeleteJourney = async (journeyId: string): Promise<void> => {
        const updatedJourneys = this.state.journeys.filter(j => j.id !== journeyId);
        this.setState({ journeys: updatedJourneys });

        // Verwende this.onChange() statt this.props.onChange()
        await this.onChange('journeyConfig', updatedJourneys);

        // Wenn die gelöschte Journey ausgewählt war, Auswahl zurücksetzen
        if (this.state.selectedJourneyId === journeyId) {
            this.setState({ selectedJourneyId: null });
        }
    };

    handleJourneyUpdate = async (journeyId: string, updates: Partial<Journey>): Promise<void> => {
        const updatedJourneys = this.state.journeys.map(journey =>
            journey.id === journeyId ? { ...journey, ...updates } : journey,
        );

        this.setState({ journeys: updatedJourneys });

        // Verwende this.onChange() statt this.props.onChange()
        await this.onChange('journeyConfig', updatedJourneys);
    };

    handleJourneyClick = (journeyId: string): void => {
        this.setState({ selectedJourneyId: journeyId });
    };

    render(): React.JSX.Element {
        const { journeys, selectedJourneyId } = this.state;
        const selectedJourney = journeys.find(j => j.id === selectedJourneyId) || null;

        return (
            <Box sx={{ height: '100%', p: { xs: 1, sm: 2 } }}>
                {/* Zwei-Spalten Layout - Desktop: nebeneinander, Mobile: untereinander */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 2,
                        height: '100%',
                        width: '100%',
                    }}
                >
                    {/* Linke Spalte - Journey-Übersicht */}
                    <Box
                        sx={{
                            // Mobile: volle Breite, Desktop: fixe 400px
                            width: { xs: '100%', md: 400 },
                            flexShrink: { md: 0 },
                            minHeight: { xs: 300, md: 'auto' },
                        }}
                    >
                        <JourneyList
                            journeys={journeys}
                            selectedJourneyId={selectedJourneyId}
                            onAddJourney={this.handleAddJourney}
                            onDeleteJourney={this.handleDeleteJourney}
                            onJourneyClick={this.handleJourneyClick}
                        />
                    </Box>

                    {/* Rechte Spalte - Konfiguration */}
                    <Box
                        sx={{
                            // Mobile: volle Breite, Desktop: restlicher Platz
                            width: { xs: '100%', md: 'calc(100% - 400px - 16px)' },
                            maxWidth: { md: '500px' },
                            flexGrow: { md: 1 },
                            minHeight: { xs: 200, md: 'auto' },
                        }}
                    >
                        <JourneyConfig
                            journey={selectedJourney}
                            onUpdate={this.handleJourneyUpdate}
                            configProps={this.props}
                        />
                    </Box>
                </Box>
            </Box>
        );
    }
}

export default JourneyManager;

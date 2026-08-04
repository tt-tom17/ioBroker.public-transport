// this file used only for simulation and not used in end build
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import React from 'react';

import { Box, Tab, Tabs } from '@mui/material';

import {
    GenericApp,
    I18n,
    Loader,
    type GenericAppProps,
    type GenericAppState,
    type IobTheme,
} from '@iobroker/gui-components';

import ClientConfig from './components/ClientConfig';
import DepartureManager from './components/DepartureManager';
import JourneyManager from './components/JourneyManager';

import deLocal from './i18n/de.json';
import enLocal from './i18n/en.json';
import esLocal from './i18n/es.json';
import frLocal from './i18n/fr.json';
import itLocal from './i18n/it.json';
import nlLocal from './i18n/nl.json';
import plLocal from './i18n/pl.json';
import ptLocal from './i18n/pt.json';
import ruLocal from './i18n/ru.json';
import ukLocal from './i18n/uk.json';
import zhCNLocal from './i18n/zh-cn.json';

const styles: Record<string, any> = {
    app: (theme: IobTheme): React.CSSProperties => ({
        backgroundColor: theme.palette.background.default,
        color: theme.palette.text.primary,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    }),
    TabContent: {
        padding: 24,
        flex: 1,
        overflow: 'auto',
    },
};

interface AppState extends GenericAppState {
    data: Record<string, any>;
    originalData: Record<string, any>;
    activeTab: number;
}

class App extends GenericApp<GenericAppProps, AppState> {
    constructor(props: GenericAppProps) {
        const extendedProps = { ...props };
        super(props, extendedProps);

        this.state = {
            ...this.state,
            loaded: true,
            data: { myCustomAttribute: 'red' },
            originalData: { myCustomAttribute: 'red' },
            theme: this.createTheme(),
            activeTab: 0,
        };
        const translations = {
            en: enLocal,
            de: deLocal,
            ru: ruLocal,
            pt: ptLocal,
            nl: nlLocal,
            fr: frLocal,
            it: itLocal,
            es: esLocal,
            pl: plLocal,
            uk: ukLocal,
            'zh-cn': zhCNLocal,
        };

        I18n.setTranslations(translations);
        // @ts-expect-error userLanguage could exist
        I18n.setLanguage((navigator.language || navigator.userLanguage || 'en').substring(0, 2).toLowerCase());
    }

    render(): React.JSX.Element {
        if (!this.state.loaded) {
            return (
                <StyledEngineProvider injectFirst>
                    <ThemeProvider theme={this.state.theme}>
                        <Loader themeType={this.state.themeType} />
                    </ThemeProvider>
                </StyledEngineProvider>
            );
        }

        const oCtx = {
            adapterName: 'public-transport',
            socket: this.socket,
            instance: 0,
            themeType: this.state.theme.palette.mode,
            isFloatComma: true,
            dateFormat: '',
            forceUpdate: () => {},
            systemConfig: {} as ioBroker.SystemConfigCommon,
            theme: this.state.theme,
            _themeName: this.state.themeName,
            onCommandRunning: (_commandRunning: boolean): void => {},
        };

        const commonProps = {
            oContext: oCtx,
            alive: true,
            changed: JSON.stringify(this.state.originalData) !== JSON.stringify(this.state.data),
            themeName: this.state.theme.palette.mode,
            themeType: this.state.theme.palette.mode as any,
            theme: this.state.theme,
            common: {} as ioBroker.InstanceCommon,
            data: this.state.data,
            originalData: this.state.originalData,
            onError: (): void => {},
            onChange: (attrOrData?: string | Record<string, any>): void => {
                if (typeof attrOrData === 'object') {
                    this.setState({ data: attrOrData });
                }
            },
        };

        const tabs: { label: string; content: React.JSX.Element }[] = [
            {
                label: 'client_config',
                content: (
                    <ClientConfig
                        {...commonProps}
                        attr="myCustomAttribute"
                        schema={{
                            url: '',
                            i18n: true,
                            name: 'AdminComponentEasyAccessSet/Components/ClientConfig',
                            type: 'custom',
                        }}
                    />
                ),
            },
            {
                label: 'departure_manager',
                content: (
                    <DepartureManager
                        {...commonProps}
                        attr="myCustomAttribute"
                        schema={{
                            url: '',
                            i18n: true,
                            name: 'AdminComponentEasyAccessSet/Components/DepartureManager',
                            type: 'custom',
                        }}
                    />
                ),
            },
            {
                label: 'journey_manager',
                content: (
                    <JourneyManager
                        {...commonProps}
                        attr="myCustomAttribute"
                        schema={{
                            url: '',
                            i18n: true,
                            name: 'AdminComponentEasyAccessSet/Components/JourneyManager',
                            type: 'custom',
                        }}
                    />
                ),
            },
        ];

        return (
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.state.theme}>
                    <Box sx={styles.app}>
                        <Tabs
                            value={this.state.activeTab}
                            onChange={(_e, v: number) => this.setState({ activeTab: v })}
                            variant="scrollable"
                            scrollButtons="auto"
                        >
                            {tabs.map(t => (
                                <Tab
                                    key={t.label}
                                    label={t.label}
                                />
                            ))}
                        </Tabs>
                        <Box style={styles.tabContent}>{tabs[this.state.activeTab].content}</Box>
                    </Box>
                </ThemeProvider>
            </StyledEngineProvider>
        );
    }
}

export default App;

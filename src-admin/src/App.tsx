// this file used only for simulation and not used in end build
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import React from 'react';

import { Box } from '@mui/material';

import {
    GenericApp,
    I18n,
    Loader,
    type GenericAppProps,
    type GenericAppState,
    type IobTheme,
} from '@iobroker/adapter-react-v5';

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
    }),
    item: {
        padding: 50,
        width: 400,
    },
};

interface AppState extends GenericAppState {
    data: Record<string, any>;
    originalData: Record<string, any>;
}

class App extends GenericApp<GenericAppProps, AppState> {
    constructor(props: GenericAppProps) {
        const extendedProps = { ...props };
        super(props, extendedProps);

        this.state = {
            ...this.state,
            data: { myCustomAttribute: 'red' },
            originalData: { myCustomAttribute: 'red' },
            theme: this.createTheme(),
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

        return (
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={this.state.theme}>
                    <Box sx={styles.app}>
                        <div style={styles.item}>{I18n.t('Welcome to public-transport admin interface')}</div>
                        <div style={styles.item}>Admin-UI Simulation für public-transport</div>
                        <div style={styles.item}>{I18n.t('This is where you can configure the adapter settings.')}</div>
                    </Box>
                </ThemeProvider>
            </StyledEngineProvider>
        );
    }
}

export default App;

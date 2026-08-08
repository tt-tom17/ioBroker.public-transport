import { moduleFederationShared } from '@iobroker/gui-components/modulefederation.admin.config';
import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import commonjs from 'vite-plugin-commonjs';
import vitetsConfigPaths from 'vite-tsconfig-paths';

const config = {
    plugins: [
        federation({
            manifest: true,
            dts: false,
            name: 'AdminComponentEasyAccessSet',
            filename: 'customComponents.js',
            exposes: {
                './Components': './src/Components.tsx',
            },
            remotes: {},
            shared: moduleFederationShared(JSON.parse(readFileSync('./package.json').toString())),
        }),
        react(),
        vitetsConfigPaths(),
        commonjs(),
    ],
    server: {
        port: 3000,
    },
    base: './',
    build: {
        target: 'chrome89',
        outDir: './build',
        chunkSizeWarningLimit: 3000,
    },
};

export default config;

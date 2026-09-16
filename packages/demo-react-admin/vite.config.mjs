import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(dirname, '../../packages');

// Resolve every workspace package to its sources, so the demo picks up local changes
// without a build step.
const aliases = fs.readdirSync(packagesDir).map(dirName => {
    const packageJson = JSON.parse(
        fs.readFileSync(path.resolve(packagesDir, dirName, 'package.json'), 'utf-8')
    );
    return {
        find: new RegExp(`^${packageJson.name}$`),
        replacement: path.resolve(packagesDir, `${packageJson.name}/src`),
    };
});

/**
 * https://vitejs.dev/config/
 * @type { import('vite').UserConfig }
 */
export default {
    plugins: [react()],
    resolve: {
        alias: [...aliases],
    },
    server: {
        port: 8080,
        host: '0.0.0.0',
    },
    define: { 'process.env': {} },
};

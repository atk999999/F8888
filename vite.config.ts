import { defineConfig } from 'vite';
export default defineConfig({ base: './', server: { allowedHosts:['terminal.local','.run.app','.cloudworkstations.dev'], host: '0.0.0.0', port: 3000 } });

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/terminalD/', // Set the base path for assets
  build: {
    outDir: 'dist', // Ensure output is to 'dist'
  },
  define: {
    'import.meta.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL),
  },
});

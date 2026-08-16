import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Nécessaire dans un conteneur : sans cela, Vite ne voit pas les
    // modifications de fichiers montés depuis l'hôte.
    watch: { usePolling: true },
  },
});

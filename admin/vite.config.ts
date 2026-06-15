import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite para el admin dashboard
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});

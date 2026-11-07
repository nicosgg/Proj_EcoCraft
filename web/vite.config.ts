import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Web client berjalan di http://localhost:5173 dan memanggil API di VITE_API_BASE_URL (lihat .env)
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});

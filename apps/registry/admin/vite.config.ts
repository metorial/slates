import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  base: '/admin/',
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom']
  },
  build: {
    outDir: path.resolve(__dirname, '../dist/admin'),
    emptyOutDir: true
  },
  server: {
    port: 52043,
    proxy: {
      '/slates-registry-admin': 'http://localhost:52042'
    }
  }
});

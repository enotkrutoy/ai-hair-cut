import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiKey = process.env.API_KEY || env.VITE_API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(apiKey || ''),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'gemini-sdk': ['@google/genai'],
          },
        },
      },
      chunkSizeWarningLimit: 1500,
    },
    server: {
      port: 3000,
      host: true,
    }
  };
});
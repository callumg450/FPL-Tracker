import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    root: 'src/client',
    publicDir: 'public',
    base: '/',
    build: {
      outDir: 'dist',
      emptyOutDir: true
    },
    server: {
      port: parseInt(process.env.PORT) || 3000,
      host: '0.0.0.0'
    },
    preview: {
      port: parseInt(process.env.PORT) || 3000,
      host: '0.0.0.0'
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src/client')
      }
    },
    define: {
      'import.meta.env.VITE_BASE_URL': JSON.stringify(env.VITE_BASE_URL)
    }
  };
});

import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.AIzaSyDk35hN7SfjjW0wF2l68CmWNtx5doJv23g),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.AIzaSyDk35hN7SfjjW0wF2l68CmWNtx5doJv23g)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

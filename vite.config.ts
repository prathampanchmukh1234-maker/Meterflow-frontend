import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname),
      },
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (id.includes('@tanstack')) {
              return 'query-vendor';
            }

            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }

            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts-vendor';
            }

            if (id.includes('socket.io') || id.includes('engine.io')) {
              return 'realtime-vendor';
            }

            if (id.includes('lucide-react') || id.includes('motion')) {
              return 'ui-vendor';
            }

            return 'vendor';
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': 'http://localhost:3000',
        '/socket.io': {
          target: 'http://localhost:3000',
          ws: true,
        },
      },
    },
  };
});

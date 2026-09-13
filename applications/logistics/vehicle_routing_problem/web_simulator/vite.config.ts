import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const htmlRewritesPlugin = (): Plugin => ({
  name: 'html-rewrites-plugin',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      const url = req.url?.split('?')[0];
      if (url === '/docs' || url === '/docs/') {
        req.url = '/docs.html' + (req.url?.includes('?') ? '?' + req.url.split('?')[1] : '');
      } else if (url === '/redoc' || url === '/redoc/') {
        req.url = '/redoc.html' + (req.url?.includes('?') ? '?' + req.url.split('?')[1] : '');
      } else if (url === '/sqlite' || url === '/sqlite/') {
        req.url = '/sqlite.html' + (req.url?.includes('?') ? '?' + req.url.split('?')[1] : '');
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), htmlRewritesPlugin()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        bypass: (req) => {
          if (req.url && req.url.includes('.json')) {
            return req.url;
          }
        },
      },
    },
  },
});

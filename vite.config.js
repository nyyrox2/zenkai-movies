import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'express-backend',
      configureServer(server) {
        import('./server.js').then(({ app }) => {
          server.middlewares.use(app);
        });
      }
    }
  ],
  server: {
    port: 5173,
    host: true
  }
});

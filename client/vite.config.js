import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      // Proxy Socket.IO requests to backend in development
      '/socket.io': {
        target: 'http://localhost:8080',
        ws: true, // Enable WebSocket proxying
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

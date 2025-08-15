import { defineConfig } from 'vite'

export default defineConfig({
  base: "/athena/",
  optimizeDeps: {
    exclude: ['ol-mapbox-style']
  },
  server: {
    fs: {
      strict: false
    }
  },
  build: {
    sourcemap: true,
  }
})  
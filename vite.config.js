import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ['ol-mapbox-style']
  },
  build: {
    base: "/athena/",
    sourcemap: true
  }
})
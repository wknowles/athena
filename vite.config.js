import { defineConfig } from 'vite'

export default defineConfig({
  optimizeDeps: {
    exclude: ['ol-mapbox-style']
  },
  server: {
    fs: {
      strict: false
    }
  },
  build: {
    base: "/athena/",
    sourcemap: true,
  }
})  
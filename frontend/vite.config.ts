import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        uploads: resolve(__dirname, 'uploads.html'),
        result: resolve(__dirname, 'result.html'),
        api: resolve(__dirname, 'api.html'),
        plugins: resolve(__dirname, 'plugins.html'),
        pricing: resolve(__dirname, 'pricing.html'),
        docs: resolve(__dirname, 'docs.html'),
        signup: resolve(__dirname, 'signup.html'),
      },
    },
  },
})

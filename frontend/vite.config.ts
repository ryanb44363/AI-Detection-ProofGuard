import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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

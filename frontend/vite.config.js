import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const createRssProxy = (target) => ({
  '/rss.xml': {
    target,
    changeOrigin: false,
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', 'VITE_')
  const rssProxy = createRssProxy(env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000')

  return {
    plugins: [react()],
    server: {
      proxy: rssProxy,
    },
    preview: {
      proxy: rssProxy,
    },
  }
})

/* global process, __dirname */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { formatAnswer } from './api/ai-format.js'
import { getImageKitAuth } from './api/imagekit-auth.js'

/**
 * Serves /api/ai-format and /api/imagekit-auth during `npm run dev`
 * (on Vercel the files in /api run instead), keeping all secret keys server-side.
 */
function devApi(env) {
  return {
    name: 'examsync-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/ai-format', async (req, res) => {
        const send = (status, data) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        }
        if (req.method !== 'POST') return send(405, { error: 'Use POST' })
        try {
          let raw = ''
          for await (const chunk of req) raw += chunk
          const html = await formatAnswer(JSON.parse(raw || '{}'), env)
          send(200, { html })
        } catch (err) {
          send(err.status || 500, { error: err.message || 'AI formatting failed' })
        }
      })

      server.middlewares.use('/api/imagekit-auth', async (req, res) => {
        const send = (status, data) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        }
        if (req.method !== 'GET') return send(405, { error: 'Use GET' })
        try {
          const auth = getImageKitAuth(env)
          send(200, auth)
        } catch (err) {
          send(err.status || 500, { error: err.message || 'ImageKit auth failed' })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      devApi(env),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})

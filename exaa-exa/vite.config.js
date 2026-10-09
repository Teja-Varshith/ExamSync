/* global process, __dirname */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { formatAnswer } from './api/ai-format.js'

/**
 * Serves /api/ai-format during `npm run dev` (on Vercel the file in /api runs instead),
 * using GROQ_API_KEY from .env.local — the key never reaches the browser.
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
        '@': path.resolve(__dirname, './src/Quiz'),
      },
    },
  }
})

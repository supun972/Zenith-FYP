import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import path from 'path'
import { pathToFileURL } from 'url'

// Load .env and .env.local into process.env for local API routes
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const localApiPlugin = () => ({
  name: 'local-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if ((req.url === '/api/tutor-chat' || req.url === '/api/generate-quiz') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            req.body = JSON.parse(body || '{}');
            res.status = (code) => { res.statusCode = code; return res; };
            res.json = (data) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); };
            
            const modulePath = req.url === '/api/tutor-chat' ? 'api/tutor-chat.js' : 'api/generate-quiz.js';
            const absolutePath = pathToFileURL(path.resolve(process.cwd(), modulePath)).href;
            const { default: handler } = await import(absolutePath);
            await handler(req, res);
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api/tts': {
        target: 'https://translate.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tts/, '/translate_tts')
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  }
})

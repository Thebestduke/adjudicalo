/**
 * Auditor CO — Backend Proxy
 * Recibe peticiones del frontend y las reenvía a OpenAI
 * con la API key guardada en .env (nunca expuesta al browser).
 */

const express = require('express');
const path    = require('path');
const { Readable } = require('stream');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '100mb' }));

// ── Bloquear acceso a archivos sensibles del servidor ─────────────────────────
const BLOCKED = ['/server.js', '/package.json', '/package-lock.json', '/.env'];
app.use((req, res, next) => {
  if (BLOCKED.includes(req.path) || req.path.startsWith('/node_modules')) {
    return res.status(404).end();
  }
  next();
});

// ── Servir frontend estático desde la misma carpeta ──────────────────────────
app.use(express.static(__dirname));

// ── Proxy OpenAI ──────────────────────────────────────────────────────────────
app.post('/api/openai', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY no configurada en el servidor (.env)' });
  }

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(req.body)
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      return res.status(upstream.status).send(err);
    }

    if (req.body.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Accel-Buffering', 'no');
      Readable.fromWeb(upstream.body).pipe(res);
    } else {
      const data = await upstream.json();
      res.json(data);
    }
  } catch (err) {
    console.error('OpenAI proxy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Iniciar servidor ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✓ dIAna corriendo en http://localhost:${PORT}\n`);
  if (!process.env.OPENAI_API_KEY) console.warn('  ⚠  OPENAI_API_KEY no definida en .env');
});

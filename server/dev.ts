import express from 'express';
import { readFileSync } from 'node:fs';
import { generateItinerary } from './handler';
import { pickProvider } from './providers';

// Minimal .env loader — one less dependency to explain.
try {
  for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {
  /* no .env — mock mode */
}

const app = express();
app.use(express.json({ limit: '100kb' }));

// Allow requests from the Vercel-deployed frontend (set ALLOWED_ORIGIN env var)
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? '*';
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const provider = pickProvider(process.env);
console.log(`[trip-planner] provider: ${provider.name} (${provider.model})`);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, provider: provider.name });
});

app.post('/api/itinerary', async (req, res) => {
  const result = await generateItinerary(req.body ?? {}, provider);
  // Result codes are semantic, HTTP stays 200 — the discriminated union
  // is the contract. Transport-level failures are what non-200 means.
  res.json(result);
});

const port = Number(process.env.PORT) || 8787;
app.listen(port, () => {
  console.log(`[trip-planner] API listening on http://localhost:${port}`);
});

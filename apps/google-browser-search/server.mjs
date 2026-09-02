import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performSearch, isBrowserReady } from './lib/browser.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', async (_req, res) => {
  const ready = await isBrowserReady();
  res.json({ status: ready ? 'ready' : 'starting', browser: ready });
});

app.post('/api/search', async (req, res) => {
  const query = (req.body?.query || '').toString().trim();
  if (!query) {
    res.status(400).json({ error: 'query is required' });
    return;
  }
  if (query.length > 200) {
    res.status(400).json({ error: 'query too long (max 200 chars) -- this app runs one short human-readable query, not a Boolean expression' });
    return;
  }
  try {
    const result = await performSearch(query);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4173;
app.listen(PORT, () => {
  console.log(`google-browser-search app listening on http://localhost:${PORT}`);
});

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveMovieBoxStream, searchMovieBox, bootstrapToken } from './lib/moviebox.js';
import { fetchFromTmdb } from './lib/tmdb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
  allowedHeaders: ['*'],
  exposedHeaders: ['Content-Length', 'Content-Range', 'Content-Type', 'Accept-Ranges', 'ETag', 'Last-Modified']
}));

app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Zenkai Stream & MovieBox Hub',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test-auth', async (req, res) => {
  try {
    const token = await bootstrapToken();
    res.json({ success: true, token: token ? `${token.slice(0, 10)}...` : null });
  } catch (err) {
    res.json({ success: false, error: err.message, stack: err.stack });
  }
});

// Search: support both MovieBox direct search and TMDB catalogue search
app.get('/api/search', async (req, res) => {
  const q = req.query.q || req.query.keyword || 'Avatar';
  const source = req.query.source || req.query.provider || 'moviebox';
  try {
    if (source === 'tmdb') {
      const type = req.query.type || 'multi';
      const data = await fetchFromTmdb(`search/${type}`, { query: q });
      return res.json(data || { results: [] });
    }
    const list = await searchMovieBox(q);
    res.json({ success: true, count: list.length, list });
  } catch (err) {
    res.json({ success: false, error: err.message, stack: err.stack });
  }
});

// Helper: Embed Servers Generator
function getEmbedServers(tmdbId, type = 'movie', season = 1, episode = 1) {
  const isTv = type.toLowerCase() === 'tv';
  const epPart = isTv ? `/${season}/${episode}` : '';
  const epQuery = isTv ? `&s=${season}&e=${episode}` : '';

  return [
    { id: 'moviebox', label: 'MovieBox (Direct)', tags: '4K • Multi-Audio • Zero Ads', isDirect: true },
    { id: 'vidzee', label: 'Captain America', tags: 'Multi-Audio • Fast', isDirect: false, embedUrl: `https://vidzee.org/embed/${type}/${tmdbId}${epPart}` },
    { id: 'videasy', label: 'Iron Man (4K)', tags: '4K • Multi-Sub', isDirect: false, embedUrl: `https://player.videasy.net/${type}/${tmdbId}${epQuery}` },
    { id: 'vidup', label: 'Thor', tags: 'HD • Smooth', isDirect: false, embedUrl: `https://vidup.me/embed/${type}/${tmdbId}${epPart}` },
    { id: 'vidcore', label: 'Hulk', tags: 'Fast Load', isDirect: false, embedUrl: `https://vidcore.me/embed/${type}/${tmdbId}${epPart}` },
    { id: 'vidsrc-ru', label: 'Black Widow', tags: 'Reliable', isDirect: false, embedUrl: `https://vidsrc.ru/embed/${type}/${tmdbId}${epPart}` },
    { id: 'vidlove', label: 'Hawkeye', tags: 'HD', isDirect: false, embedUrl: `https://vidlove.me/embed/${type}/${tmdbId}${epPart}` },
    { id: '1embed', label: 'Spider-Man', tags: 'Alternative', isDirect: false, embedUrl: `https://1embed.net/embed/${type}/${tmdbId}${epQuery}` },
    { id: 'cinesrc', label: 'Doctor Strange', tags: 'Multi-Lang', isDirect: false, embedUrl: `https://cinesrc.org/embed/${type}/${tmdbId}${epPart}` },
    { id: 'primesrc', label: 'Black Panther', tags: 'High Bitrate', isDirect: false, embedUrl: `https://primesrc.org/embed/${type}/${tmdbId}${epPart}` }
  ];
}

// ── MovieBox Stream Endpoint ──
// GET /api/movies/stream?id=...&type=movie|tv&s=1&e=1&title=...&year=...&dub=...
app.get('/api/movies/stream', async (req, res) => {
  const tmdbId = parseInt(req.query.id || req.query.tmdbId || '0', 10);
  const type = (req.query.type || 'movie').toLowerCase() === 'tv' ? 'tv' : 'movie';
  const season = parseInt(req.query.s || req.query.season || '1', 10) || 1;
  const episode = parseInt(req.query.e || req.query.episode || '1', 10) || 1;
  const title = (req.query.title || '').trim();
  const year = req.query.year || null;
  const dubId = req.query.dub || req.query.dubId || null;
  const imdbId = req.query.imdb || req.query.imdbId || null;

  if (!tmdbId && !title) {
    return res.status(400).json({ error: 'Missing required parameter: tmdbId or title' });
  }

  const proxyBase = req.query.proxyBase || 'https://webpage-launchpad.lovable.app/api/public/proxy';

  try {
    const movieResult = await resolveMovieBoxStream({
      tmdbId,
      type,
      season,
      episode,
      title,
      year,
      dubId,
      proxyBase
    });

    const embedServers = getEmbedServers(tmdbId, type, season, episode);

    return res.json({
      ...movieResult,
      embedServers
    });
  } catch (err) {
    console.error(`MovieBox stream resolve error for "${title}":`, err.message);
    const embedServers = getEmbedServers(tmdbId, type, season, episode);
    return res.status(200).json({
      success: false,
      error: err.message || 'MovieBox stream currently unavailable',
      server: 'MovieBox',
      embedServers
    });
  }
});

// ── TMDB Passthrough Endpoints ──
// GET /api/movies/trending, /api/movies/popular, /api/movies/discover, /api/movies/search/multi, /api/movies/:type/:id
app.get('/api/movies/*', async (req, res) => {
  const sub = req.params[0] || '';
  const params = { ...req.query };
  const data = await fetchFromTmdb(sub, params);
  if (!data) return res.status(200).json({ results: [], error: 'Failed to retrieve data from TMDB' });
  res.json(data);
});

// ── High-Speed Media Stream Range Proxy with 428/429 Protection ──
// GET /proxy?url=...
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: "Missing 'url' query parameter" });

  let urlObj;
  try {
    urlObj = new URL(targetUrl);
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const host = urlObj.hostname.toLowerCase();
  const isDirectAppCdn = host.includes('aoneroom') || host.includes('hakunaymatata');
  const isWebMirrorCdn = host.includes('bcdnxw') || host.includes('123moviesfree') || host.includes('sflix');

  const headers = { 'Accept': '*/*' };

  if (isDirectAppCdn) {
    // CRITICAL: MovieBox hakunaymatata CDN strictly blocks Mobile Chrome UA with HTTP 428 and blocks Referer with HTTP 429!
    // Using ExoPlayer UA with no Referer/Origin guarantees clean HTTP 206 Partial Content.
    headers['User-Agent'] = 'ExoPlayerLib/2.19.1';
  } else if (isWebMirrorCdn) {
    headers['Referer'] = req.query.referer || 'https://123moviesfree.club/';
    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  } else {
    if (req.query.referer) headers['Referer'] = req.query.referer;
    if (req.headers['user-agent']) headers['User-Agent'] = req.headers['user-agent'];
  }

  const range = req.headers.range;
  if (range) headers['Range'] = range;

  try {
    let up = await fetch(targetUrl, { headers });

    // Automatic fallback retry for CDN restrictions
    if ((up.status === 429 || up.status === 428 || up.status === 403) && isDirectAppCdn) {
      const retryHeaders = {
        'Accept': '*/*',
        'User-Agent': 'ExoPlayerLib/2.19.1'
      };
      if (range) retryHeaders['Range'] = range;
      const retryUp = await fetch(targetUrl, { headers: retryHeaders });
      if (retryUp.ok || retryUp.status === 206) {
        up = retryUp;
      }
    }

    const contentType = up.headers.get('content-type') || 'video/mp4';
    const contentLength = up.headers.get('content-length');
    const contentRange = up.headers.get('content-range');
    const acceptRanges = up.headers.get('accept-ranges') || 'bytes';

    const responseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type, Accept-Ranges, ETag, Last-Modified',
      'Accept-Ranges': acceptRanges,
      'Content-Type': contentType,
      'Connection': 'keep-alive'
    };

    if (contentLength) responseHeaders['Content-Length'] = contentLength;
    if (contentRange) responseHeaders['Content-Range'] = contentRange;

    res.writeHead(up.status, responseHeaders);

    const reader = up.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(200).json({ error: `Proxy fetch failed: ${err.message}` });
    }
  }
});

// Serve frontend static build if running standalone
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/proxy')) return;
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) res.status(200).send('Zenkai Movies Backend Service is Running.');
  });
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

// Listen on all interfaces (0.0.0.0) for Railway / Docker / Cloud environments
if (!process.env.VERCEL) {
  app.listen(PORT, HOST, () => {
    console.log(`🎬 Zenkai Movies Server & Proxy listening on http://${HOST}:${PORT}`);
  });
}

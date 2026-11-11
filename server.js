import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import { exec } from 'node:child_process';
import util from 'node:util';
const execPromise = util.promisify(exec);
import { fileURLToPath } from 'url';
import { resolveMovieBoxStream, searchMovieBox, bootstrapToken } from './lib/moviebox.js';
import { fetchFromTmdb } from './lib/tmdb.js';

// Prioritize IPv4 across the process to prevent NAT64 / IPv6 blocks (e.g. Tengine 426)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

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
    version: 'v3-curl',
    service: 'Zenkai Stream & MovieBox Hub',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/test-direct-stream', (req, res) => {
  const url = req.query.url || 'https://bcdnxw.hakunaymatata.com/resource/ede9417949c0c4b9af6d8787769d11ba.mp4?sign=83ba87493e5e80d91e6b57be0bc92ec8&t=1794404210';
  try {
    const u = new URL(url);
    const upstreamReq = https.request(u, {
      method: 'HEAD',
      family: 4,
      headers: {
        'Accept': '*/*',
        'Referer': 'https://123moviesfree.club/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (upstreamRes) => {
      res.json({
        status: upstreamRes.statusCode,
        headers: upstreamRes.headers
      });
    });
    upstreamReq.on('error', (err) => res.json({ error: err.message }));
    upstreamReq.end();
  } catch (err) {
    res.json({ error: err.message });
  }
});

app.get('/api/test-curl', async (req, res) => {
  const url = req.query.url || 'https://bcdnxw.hakunaymatata.com/resource/7d5defb49a8c28939f672dea60dbe0db.mp4?sign=755b40adc0959242e8b27afc89ab794c&t=1794409187';
  const customCmd = req.query.cmd;
  const tests = {};
  
  const cmds = [
    { name: 'ipv4-clean', cmd: `curl -4 -I -s -H "Referer: https://123moviesfree.club/" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${url}"` },
    { name: 'ipv6-clean', cmd: `curl -6 -I -s -H "Referer: https://123moviesfree.club/" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${url}"` },
    { name: 'http2-ipv4', cmd: `curl -4 --http2 -I -s -H "Referer: https://123moviesfree.club/" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${url}"` },
    { name: 'default-curl', cmd: `curl -I -s -H "Referer: https://123moviesfree.club/" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${url}"` },
  ];

  for (const t of cmds) {
    try {
      const { stdout, stderr } = await execPromise(t.cmd);
      tests[t.name] = { stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (err) {
      tests[t.name] = { error: err.message, stdout: err.stdout, stderr: err.stderr };
    }
  }

  res.json({ url, tests });
});

app.get('/api/test-auth', async (req, res) => {
  try {
    const token = await bootstrapToken();
    res.json({ success: true, token: token ? `${token.slice(0, 10)}...` : null });
  } catch (err) {
    res.json({ success: false, error: err.message, stack: err.stack });
  }
});

app.get('/api/test-proxy-cdn', async (req, res) => {
  const targetUrl = req.query.url || 'https://bcdnxw.hakunaymatata.com/resource/ede9417949c0c4b9af6d8787769d11ba.mp4?sign=27029aaf90a2266163016fabdfd369d3&t=1794405444';
  const tests = {};
  
  const headersList = [
    { name: 'no-headers', h: {} },
    { name: 'referer-only', h: { 'Referer': 'https://123moviesfree.club/' } },
    { name: 'referer-and-ua', h: { 'Referer': 'https://123moviesfree.club/', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } },
    { name: 'referer-and-ua-and-range', h: { 'Referer': 'https://123moviesfree.club/', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Range': 'bytes=0-100' } },
    { name: 'exoplayer', h: { 'User-Agent': 'ExoPlayerLib/2.19.1' } }
  ];

  for (const t of headersList) {
    try {
      const resp = await fetch(targetUrl, { headers: t.h });
      tests[t.name] = {
        status: resp.status,
        statusText: resp.statusText,
        headers: Object.fromEntries(resp.headers.entries()),
        body: !resp.ok ? (await resp.text()).slice(0, 200) : null
      };
    } catch (err) {
      tests[t.name] = { error: err.message };
    }
  }

  res.json({ targetUrl, tests });
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
    console.warn(`MovieBox stream local resolve error for "${title}":`, err.message);
    try {
      const qs = new URLSearchParams({
        id: String(tmdbId || 0),
        type,
        s: String(season),
        e: String(episode),
        ...(title ? { title } : {}),
        ...(year ? { year } : {}),
        ...(dubId ? { dub: dubId } : {}),
        ...(imdbId ? { imdb: imdbId } : {}),
        no_midman: '1'
      });
      const cfResp = await fetch(`https://zenkai.cfd/api/movies/stream?${qs.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'X-Zenkai-Barrier': 'zenkai-barrier-apk-2026-v1'
        },
        signal: AbortSignal.timeout(8000)
      });
      if (cfResp.ok) {
        const cfData = await cfResp.json().catch(() => null);
        if (cfData && cfData.success && cfData.streams?.length > 0) {
          const embedServers = getEmbedServers(tmdbId, type, season, episode);
          return res.json({
            ...cfData,
            embedServers
          });
        }
      }
    } catch (cfErr) {
      console.warn(`Zenkai edge fallback failed:`, cfErr.message);
    }
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
  const isWebMirrorCdn = host.includes('bcdnxw') || host.includes('123moviesfree') || host.includes('sflix') || !!req.query.referer;
  const isDirectAppCdn = !isWebMirrorCdn && (host.includes('aoneroom') || host.includes('hakunaymatata'));

  const headers = { 'Accept': '*/*' };

  if (isWebMirrorCdn) {
    // Web mirror CDNs (such as bcdnxw for TV series & specific dubs) require partner Referer
    headers['Referer'] = req.query.referer || 'https://123moviesfree.club/';
    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  } else if (isDirectAppCdn) {
    // CRITICAL: MovieBox direct app CDNs strictly block Mobile Chrome UA with HTTP 428 and block Referer with HTTP 429!
    // Using ExoPlayer UA with no Referer/Origin guarantees clean HTTP 206 Partial Content.
    headers['User-Agent'] = 'ExoPlayerLib/2.19.1';
  } else {
    if (req.query.referer) headers['Referer'] = req.query.referer;
    if (req.headers['user-agent']) headers['User-Agent'] = req.headers['user-agent'];
    else headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  const range = req.headers.range;
  if (range) headers['Range'] = range;

  const client = urlObj.protocol === 'http:' ? http : https;

  const doRequest = (h, isRetry = false) => {
    const reqOptions = {
      method: req.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: h,
      family: 4, // CRITICAL: Force IPv4 to prevent 426 NAT64 blocks on Alibaba/Tengine CDN
      timeout: 15000,
    };

    const upstreamReq = client.request(urlObj, reqOptions, (upstreamRes) => {
      // Retry once if CDN returns restriction (429, 428, 426, 403)
      if (!isRetry && (upstreamRes.statusCode === 429 || upstreamRes.statusCode === 428 || upstreamRes.statusCode === 426 || upstreamRes.statusCode === 403)) {
        upstreamRes.resume();
        const altHeaders = { 'Accept': '*/*' };
        if (range) altHeaders['Range'] = range;
        if (h['Referer']) {
          altHeaders['User-Agent'] = 'ExoPlayerLib/2.19.1';
        } else {
          altHeaders['Referer'] = req.query.referer || 'https://123moviesfree.club/';
          altHeaders['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        }
        return doRequest(altHeaders, true);
      }

      const responseHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type, Accept-Ranges, ETag, Last-Modified',
        'Accept-Ranges': upstreamRes.headers['accept-ranges'] || 'bytes',
        'Content-Type': upstreamRes.headers['content-type'] || 'video/mp4',
        'Connection': 'keep-alive',
      };
      if (upstreamRes.headers['content-length']) responseHeaders['Content-Length'] = upstreamRes.headers['content-length'];
      if (upstreamRes.headers['content-range']) responseHeaders['Content-Range'] = upstreamRes.headers['content-range'];
      if (upstreamRes.headers['etag']) responseHeaders['ETag'] = upstreamRes.headers['etag'];
      if (upstreamRes.headers['last-modified']) responseHeaders['Last-Modified'] = upstreamRes.headers['last-modified'];

      res.writeHead(upstreamRes.statusCode, responseHeaders);
      if (req.method === 'HEAD') {
        upstreamRes.resume();
        return res.end();
      }
      upstreamRes.pipe(res);
    });

    upstreamReq.on('error', (err) => {
      if (!res.headersSent) {
        res.status(502).json({ error: `Proxy connection error: ${err.message}` });
      }
    });

    upstreamReq.on('timeout', () => {
      upstreamReq.destroy();
      if (!res.headersSent) {
        res.status(504).json({ error: 'Proxy upstream timeout' });
      }
    });

    res.on('close', () => {
      upstreamReq.destroy();
    });

    upstreamReq.end();
  };

  doRequest(headers);
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

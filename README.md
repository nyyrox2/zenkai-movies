# 🎬 Zenkai Movies & MovieBox Stream Proxy

A modern full-stack Movie & TV streaming web application with a high-performance MovieBox 4K stream resolver and media proxy with Range request forwarding and HTTP 428/429 bypass protection.

---

## ✨ Features

- **Cinematic Streaming UI**: Dark liquid glass aesthetic matching Zenkai & Netflix.
- **Hero Carousel**: Dynamic featured releases with trailer backdrops, ratings, and genre tags.
- **MovieBox 4K Direct Streaming**: Native cryptographic request signing (RFC 1321 MD5 & HMAC-MD5) to resolve direct CDN MP4 links.
- **Multi-Audio Dubs**: Select between `Original`, `Hindi dub`, `Tamil dub`, `Telugu dub`, `Spanish dub`, and more.
- **Quality Switcher**: Switch between `4K`, `1080p`, `720p`, `480p`, and `360p`.
- **Direct MP4 Downloads**: Download clean MP4 files directly to disk.
- **10 Server Fallbacks**: MovieBox Direct + 9 embed fallbacks (`Iron Man (4K)`, `Captain America`, `Thor`, `Hulk`, `Black Widow`, etc.).
- **Built-in Media Stream Proxy**:
  - Full HTTP 206 Partial Content support with byte-range forwarding.
  - Strips mobile Chrome User-Agent and Referer headers for `bcdn.hakunaymatata.com` to prevent HTTP 428 and 429 blocks.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server (Frontend + Backend on port 5173)
```bash
npm run dev
```

### 3. Production Build
```bash
npm run build
npm start
```

---

## 🌐 Deploy to Vercel (1-Click)

1. Push this repository to your GitHub account (`nyyrox2/zenkai-movies`).
2. Go to [Vercel](https://vercel.com) and import the repository.
3. Vercel will automatically build the Vite frontend and deploy `api/index.js` as the serverless API proxy via the included `vercel.json`!

---

## 📡 API Endpoints

- `GET /api/movies/stream?id=27205&type=movie&title=Inception&year=2010` - Resolves 4K stream URLs and dubs.
- `GET /api/movies/trending/movie/week` - Trending movies catalogue.
- `GET /api/movies/search/multi?query=dune` - Multi-catalogue search.
- `GET /proxy?url=<target_url>` - Media streaming range proxy.
- `GET /api/health` - Service health status.

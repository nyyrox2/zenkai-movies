const TMDB_API_BASE = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY || "c7db6169bfdd3fc9f7dd6c44ea8ad100";
const TMDB_BEARER = process.env.TMDB_BEARER_TOKEN || "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjN2RiNjE2OWJmZGQzZmM5ZjdkZDZjNDRlYThhZDEwMCIsIm5iZiI6MTc1NDM3NjY0MC40MDYwMDAxLCJzdWIiOiI2YWY0MDNjOWI4YTRlMzU1YjYzNGVkOTciLCJzY29wZXMiOlsicXBsX3JlYWQiXSwidmVyc2lvbiI6MX0.ww3C_pAWxT63xXVM9OAkq8aSEyFhmyA5VaobbE-E0y4";
const LOVABLE_PROXY = "https://webpage-launchpad.lovable.app/api/public/proxy";

export async function fetchFromTmdb(endpoint, params = {}) {
  const query = new URLSearchParams({
    language: 'en-US',
    include_adult: 'false',
    api_key: TMDB_API_KEY,
    ...params
  });
  
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const targetUrl = `${TMDB_API_BASE}/${cleanEndpoint}?${query.toString()}`;

  // 1. Direct fetch (Official TMDB API)
  try {
    const res = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${TMDB_BEARER}`,
        'User-Agent': 'Mozilla/5.0'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  // 2. Proxy fallback
  try {
    const proxyUrl = `${LOVABLE_PROXY}?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${TMDB_BEARER}`,
        'User-Agent': 'Mozilla/5.0'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && !data.error) return data;
    }
  } catch (err) {
    console.error(`TMDB error (${cleanEndpoint}):`, err.message);
  }
  return null;
}

export async function getTrending(type = 'movie', timeWindow = 'week') {
  return await fetchFromTmdb(`trending/${type}/${timeWindow}`);
}

export async function getPopularMovies(page = 1) {
  return await fetchFromTmdb('movie/popular', { page });
}

export async function getTopRatedMovies(page = 1) {
  return await fetchFromTmdb('movie/top_rated', { page });
}

export async function getPopularTv(page = 1) {
  return await fetchFromTmdb('tv/popular', { page });
}

export async function getMovieDetails(id, type = 'movie') {
  const details = await fetchFromTmdb(`${type}/${id}`, {
    append_to_response: 'credits,videos,similar,recommendations'
  });
  return details;
}

export async function searchCatalogue(query, type = 'multi', page = 1) {
  if (!query || query.trim().length < 2) return { results: [] };
  return await fetchFromTmdb(`search/${type}`, { query: query.trim(), page });
}

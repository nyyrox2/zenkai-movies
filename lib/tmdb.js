const TMDB_PROXY_BASE = "https://aniversee.vercel.app/api/tmdb";

export async function fetchFromTmdb(endpoint, params = {}) {
  const query = new URLSearchParams({
    language: 'en-US',
    include_adult: 'false',
    ...params
  });
  
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${TMDB_PROXY_BASE}/${cleanEndpoint}?${query.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) throw new Error(`TMDB responded with HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`TMDB error (${cleanEndpoint}):`, err.message);
    return null;
  }
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
  return await fetchFromTmdb(`search/${type}`, {
    query: encodeURIComponent(query.trim()),
    page
  });
}

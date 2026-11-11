const API_BASE = '/api/movies';

export async function fetchTrending(type = 'movie', timeWindow = 'week') {
  try {
    const res = await fetch(`${API_BASE}/trending/${type}/${timeWindow}`);
    if (!res.ok) throw new Error('Failed to fetch trending');
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('fetchTrending error:', e);
    return [];
  }
}

export async function fetchPopular(type = 'movie') {
  try {
    const res = await fetch(`${API_BASE}/${type}/popular`);
    if (!res.ok) throw new Error('Failed to fetch popular');
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('fetchPopular error:', e);
    return [];
  }
}

export async function fetchTopRated(type = 'movie') {
  try {
    const res = await fetch(`${API_BASE}/${type}/top_rated`);
    if (!res.ok) throw new Error('Failed to fetch top rated');
    const data = await res.json();
    return data.results || [];
  } catch (e) {
    console.error('fetchTopRated error:', e);
    return [];
  }
}

export async function searchMovies(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`${API_BASE}/search/multi?query=${encodeURIComponent(query.trim())}`);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    return (data.results || []).filter(item => item.media_type === 'movie' || item.media_type === 'tv' || !item.media_type);
  } catch (e) {
    console.error('searchMovies error:', e);
    return [];
  }
}

export async function fetchMovieStream({ id, type = 'movie', season = 1, episode = 1, title, year, dubId }) {
  const query = new URLSearchParams({
    id: id ? String(id) : '0',
    type,
    s: String(season),
    e: String(episode),
    title: title || '',
    ...(year ? { year: String(year) } : {}),
    ...(dubId ? { dub: dubId } : {})
  });

  const res = await fetch(`${API_BASE}/stream?${query.toString()}`);
  return await res.json();
}

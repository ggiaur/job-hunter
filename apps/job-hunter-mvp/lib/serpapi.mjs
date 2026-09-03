export async function serpapiSearch(apiKey, query, { hl = 'hu', gl = 'hu', num = 10 } = {}) {
  const url = new URL('https://serpapi.com/search');
  url.searchParams.set('engine', 'google');
  url.searchParams.set('q', query);
  url.searchParams.set('hl', hl);
  url.searchParams.set('gl', gl);
  url.searchParams.set('num', String(num));
  url.searchParams.set('api_key', apiKey);

  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`SerpApi HTTP ${res.status} for query "${query}"`);
  }
  const data = await res.json();
  if (data?.search_metadata?.status !== 'Success') {
    throw new Error(`SerpApi non-success status for query "${query}": ${data?.search_metadata?.status}`);
  }
  return (data.organic_results || []).map((r) => ({
    query,
    position: r.position,
    title: r.title,
    link: r.link,
    snippet: r.snippet || '',
  }));
}

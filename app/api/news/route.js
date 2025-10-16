// /app/api/ingest-news/route.js
// NOTE: fill CRUNCHBASE_KEY or NEWSAPI_KEY in your .env; obey API terms. Run nightly via vercel.json cron.


async function fetchLatestNewsForName(name) {
  // Pseudo: use Crunchbase News or NewsAPI. Start simple with NewsAPI query.
  const key = process.env.NEWSAPI_KEY;
  if (!key) return null;
  const url = `https://newsapi.org/v2/everything?language=en&sortBy=publishedAt&pageSize=1&q=${encodeURIComponent('"'+name+'"')}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` }});
  if (!res.ok) return null;
  const j = await res.json();
  const a = j.articles?.[0];
  return a ? { title: a.title, url: a.url, date: a.publishedAt } : null;
  }
  
  
  export async function POST() {
  try {
  // 1) Fetch current startups
  const startups = await fetchStartupsFromAirtable();
  // 2) For each, try to get a recent article (throttle in real use)
  const updates = await Promise.all(startups.map(async s => ({ id: s.id, lastNews: await fetchLatestNewsForName(s.name) })));
  // 3) TODO: Push back into Airtable (PATCH by record id); omitted here to keep keys private.
  return new Response(JSON.stringify({ updated: updates.filter(u=>u.lastNews) }), { status: 200, headers: {"content-type":"application/json"} });
  } catch (e) {
  return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
  }
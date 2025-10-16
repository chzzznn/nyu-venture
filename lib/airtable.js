// --- /lib/airtable.js --- (server-only)
// npm i airtable slugify

// In .env.local set: AIRTABLE_API_KEY=... AIRTABLE_BASE_ID=... AIRTABLE_TABLE_STARTUPS=Startups AIRTABLE_TABLE_PEOPLE=People AIRTABLE_TABLE_FOUNDERS=Founders

// In .env.local set: AIRTABLE_API_KEY= key_from_airtable_account
// AIRTABLE_BASE_ID= appWqBr7BRgqfwL2d
// AIRTABLE_TABLE_STARTUPS=Startups AIRTABLE_TABLE_PEOPLE=People AIRTABLE_TABLE_FOUNDERS=Founders

import 'dotenv/config';


export async function fetchStartupsFromAirtable() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tStartups = process.env.AIRTABLE_TABLE_STARTUPS || "Startups";
  const tPeople = process.env.AIRTABLE_TABLE_PEOPLE || "People";
  const tFounders = process.env.AIRTABLE_TABLE_FOUNDERS || "Founders";
  
  
  if (!apiKey || !baseId) throw new Error("Missing Airtable env vars");
  
  
  const baseUrl = `https://api.airtable.com/v0/${baseId}`;
  const headers = { Authorization: `Bearer ${apiKey}` };
  
  
  // Helper to fetch all pages
  async function fetchAll(table, params = {}) {
  let offset = null; const all = [];
  do {
  const qs = new URLSearchParams({ ...params, ...(offset ? { offset } : {}) });
  const res = await fetch(`${baseUrl}/${encodeURIComponent(table)}?${qs}`,{ headers, cache:"no-store"});
  if (!res.ok) throw new Error(`Airtable ${table} ${res.status}`);
  const json = await res.json();
  all.push(...json.records);
  offset = json.offset;
  } while (offset);
  return all;
  }
  
  
  // Pull tables
  const [startupRecs, peopleRecs, founderRecs] = await Promise.all([
  fetchAll(tStartups, { pageSize: "100" }),
  fetchAll(tPeople, { pageSize: "100" }),
  fetchAll(tFounders, { pageSize: "100" }),
  ]);
  
  
  // Index helpers
  const peopleById = Object.fromEntries(peopleRecs.map(r => [r.id, r.fields]));
  const foundersByStartup = new Map();
  for (const r of founderRecs) {
  const sIds = r.fields.startup || r.fields.Startup || [];
  const pIds = r.fields.person || r.fields.Person || [];
  for (const sId of sIds) {
  const arr = foundersByStartup.get(sId) || [];
  for (const pId of pIds) {
  const pf = peopleById[pId];
  if (pf?.full_name || pf?.Name) arr.push(pf.full_name || pf.Name);
  }
  foundersByStartup.set(sId, arr);
  }
  }
  
  
  // Normalize to Startup[]
const rows = startupRecs.map(r => {
const f = r.fields;
const founders = foundersByStartup.get(r.id) || [];
const tags = Array.isArray(f.tags) ? f.tags : (Array.isArray(f.Tags) ? f.Tags : []);
const year = Number(f.year || f.Year || "");
const program = f.program || f.Program || "Entrepreneur Challenge";
const website = f.website || f.Website || "";
const id = (f.id || f.slug || f.Slug || "").toString() || (f.name || f.Name || "").toLowerCase().replace(/[^a-z0-9]+/g,"-") + (year?`-${year}`:"");
const lastNews = f.lastNewsUrl ? { title: f.lastNewsTitle || "Recent coverage", url: f.lastNewsUrl, date: f.lastNewsDate || "" } : null;
return {
id,
name: f.name || f.Name,
year: Number.isFinite(year) ? year : undefined,
founders,
program,
website,
tags,
lastNews,
};
});


return rows;
}
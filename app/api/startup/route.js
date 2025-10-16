export async function GET() {
  try {
  const rows = await fetchStartupsFromAirtable();
  return new Response(JSON.stringify(rows), { status: 200, headers: {"content-type":"application/json"} });
  } catch (e) {
  return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
  }
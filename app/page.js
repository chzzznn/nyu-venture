"use client";
import { useEffect, useState } from "react";

export default function Page() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/startups")
      .then(r => r.ok ? r.json() : Promise.reject(new Error("Bad response")))
      .then(setRows)
      .catch(e => setErr(e.message || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="p-8">Loading…</main>;
  if (err) return <main className="p-8 text-red-600">Error: {err}</main>;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Startup Directory</h1>

      <table className="border-collapse w-full text-sm">
        <thead>
          <tr>
            <th className="border p-2 text-left">Venture</th>
            <th className="border p-2 text-left">Founders</th>
            <th className="border p-2 text-left">Year</th>
            <th className="border p-2 text-left">Tags</th>
            <th className="border p-2 text-left">News</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(s => (
            <tr key={s.id}>
              <td className="border p-2">
                {s.website
                  ? <a href={s.website} target="_blank" rel="noreferrer" className="underline">{s.name}</a>
                  : s.name}
                <div className="text-xs text-gray-500">{s.program || ""}</div>
              </td>
              <td className="border p-2">{(s.founders || []).join(", ")}</td>
              <td className="border p-2">{s.year ?? "—"}</td>
              <td className="border p-2">{(s.tags || []).join(", ")}</td>
              <td className="border p-2">
                {s.lastNews?.url
                  ? <a href={s.lastNews.url} target="_blank" rel="noreferrer" className="underline">
                      {s.lastNews.title || "Recent coverage"}
                    </a>
                  : <span className="text-gray-400">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

"use client";

import { fetchJson } from "@/lib/fetch-json";

import { useEffect, useState } from "react";

interface FieldItem {
  id: string;
  name: string;
  location: string;
  price: number;
  type: string;
  size: string;
  capacity: number;
  status: string;
  isActive: boolean;
}

export default function StaffFieldViewer({ adminName }: { adminName: string }) {
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");

  const fetchFields = async (pageParam = 1, q = "") => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageParam));
      params.set("limit", String(6));
      if (q) params.set("q", q);
      const { res: response, data: __body } = await fetchJson(`/api/admin/fields?${params.toString()}`, { cache: "no-store" });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to load fields");
      setFields(data.data || []);
      setPage(data.page || pageParam);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields(page, query);
  }, [page, query]);

  const handleSearch = async () => {
    setPage(1);
    await fetchFields(1, query.trim());
  };

  const goToPage = async (p: number) => {
    if (p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setPage(p);
    await fetchFields(p, query);
  };

  return (
    <main className="flex-1 px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="glass-panel rounded-[2rem] p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Staff field viewer</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">Field references</h1>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                Read-only access to field availability and details for staff operations.
              </p>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-[color:var(--muted)]">Signed in as {adminName}</div>
          </div>
        </div>

        <section className="glass-panel rounded-[1.5rem] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Available fields</h2>
            <div className="flex items-center gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or location" className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white" />
              <button onClick={handleSearch} className="btn-secondary px-3 py-1">Search</button>
            </div>
          </div>
          {error ? (
            <div className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
          ) : null}
          <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-[color:var(--background)]">
            <table className="w-full min-w-[720px] divide-y divide-white/10 text-left text-sm">
              <thead className="bg-[color:rgba(255,255,255,0.03)] text-[color:var(--muted)]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Capacity</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {fields.map((field) => (
                  <tr key={field.id} className="bg-[color:rgba(255,255,255,0.02)]">
                    <td className="px-4 py-3 text-white">{field.name}</td>
                    <td className="px-4 py-3">{field.location}</td>
                    <td className="px-4 py-3">{field.type}</td>
                    <td className="px-4 py-3">Rp {Number(field.price).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3">{field.capacity}</td>
                    <td className="px-4 py-3">{field.status}</td>
                    <td className="px-4 py-3">{field.isActive ? "Yes" : "No"}</td>
                  </tr>
                ))}
                {fields.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-[color:var(--muted)]">
                      {loading ? "Loading fields..." : "No fields available."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className="rounded px-3 py-1 bg-white/5">Prev</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => goToPage(p)} className={`rounded px-3 py-1 ${p === page ? 'bg-[color:var(--accent)] text-black' : 'bg-white/5'}`}>{p}</button>
            ))}
            <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="rounded px-3 py-1 bg-white/5">Next</button>
          </div>
        </section>
      </div>
    </main>
  );
}

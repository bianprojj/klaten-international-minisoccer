"use client";

import { fetchJson } from "@/lib/fetch-json";

import { useEffect, useMemo, useState } from "react";

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

interface FieldFormState {
  name: string;
  location: string;
  price: number;
  type: string;
  size: string;
  capacity: number;
  status: string;
  isActive: boolean;
}

export default function FieldManagerClient({ adminName, useMain = true }: { adminName: string; useMain?: boolean }) {
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FieldItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<FieldFormState>({
    name: "",
    location: "",
    price: 0,
    type: "",
    size: "",
    capacity: 0,
    status: "ACTIVE",
    isActive: true,
  });

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

  const resetForm = () => {
    setEditing(null);
    setShowForm(false);
    setFormState({
      name: "",
      location: "",
      price: 0,
      type: "",
      size: "",
      capacity: 0,
      status: "ACTIVE",
      isActive: true,
    });
  };

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

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = editing ? `/api/admin/fields/${editing.id}` : "/api/admin/fields";
      const method = editing ? "PUT" : "POST";
      const { res: response, data: __body } = await fetchJson(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to save field");
      await fetchFields();
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field: FieldItem) => {
    setEditing(field);
    setShowForm(true);
    setFormState({
      name: field.name ?? "",
      location: field.location ?? "",
      price: field.price ?? 0,
      type: field.type ?? "",
      size: field.size ?? "",
      capacity: field.capacity ?? 0,
      status: field.status ?? "ACTIVE",
      isActive: field.isActive ?? true,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this field?")) return;
    setLoading(true);
    setError(null);

    try {
      const { res: response, data: __body } = await fetchJson(`/api/admin/fields/${id}`, { method: "DELETE" });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to delete field");
      await fetchFields();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = useMemo(
    () => ["ACTIVE", "MAINTENANCE", "INACTIVE"],
    [],
  );

  const content = (
    <div className="mx-auto max-w-7xl space-y-8" id="fields">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Field manager</p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Manager CRUD Table</h1>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                Manage field records directly. Create, update, and delete fields for booking operations.
              </p>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-[color:var(--muted)]">Signed in as {adminName}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white sm:text-2xl">Field list</h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">CRUD table untuk semua lapangan.</p>
              </div>
              <div className="flex items-center gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or location" className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white" />
                <button onClick={handleSearch} className="btn-secondary px-4 py-2">Search</button>
                <button onClick={() => setShowForm(true)} className="btn-secondary px-4 py-2">New field</button>
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
                    <th className="px-4 py-3">Actions</th>
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
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => handleEdit(field)} className="rounded-full border border-[color:rgba(56,189,248,0.24)] px-3 py-2 text-sm text-[color:var(--accent)] hover:bg-[color:rgba(56,189,248,0.06)]">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(field.id)} className="rounded-full border border-rose-500/20 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {fields.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-center text-sm text-[color:var(--muted)]">
                        {loading ? "Loading fields..." : "No fields found."}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between px-4">
              <div className="text-sm text-[color:var(--muted)]">Total: {loading ? "..." : `${fields.length} items on this page`}</div>
              <div className="flex gap-2">
                <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className="rounded px-3 py-1 bg-white/5">Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => goToPage(p)} className={`rounded px-3 py-1 ${p === page ? 'bg-[color:var(--accent)] text-black' : 'bg-white/5'}`}>{p}</button>
                ))}
                <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="rounded px-3 py-1 bg-white/5">Next</button>
              </div>
            </div>
          </section>

          {showForm ? <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Create / update field</h2>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-[color:var(--muted)]">Name</label>
                <input value={formState.name} onChange={(e) => handleChange("name", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-sm text-[color:var(--muted)]">Location</label>
                <input value={formState.location} onChange={(e) => handleChange("location", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Type</label>
                  <input value={formState.type} onChange={(e) => handleChange("type", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Size</label>
                  <input value={formState.size} onChange={(e) => handleChange("size", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Price</label>
                  <input type="number" value={formState.price} onChange={(e) => handleChange("price", Number(e.target.value))} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Capacity</label>
                  <input type="number" value={formState.capacity} onChange={(e) => handleChange("capacity", Number(e.target.value))} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Status</label>
                  <select value={formState.status} onChange={(e) => handleChange("status", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none">
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-[color:var(--muted)]">Active</label>
                  <button type="button" onClick={() => handleChange("isActive", !formState.isActive)} className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-left text-sm text-white outline-none">
                    {formState.isActive ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={loading} className="btn-primary px-6 py-3 disabled:opacity-60">
                  {editing ? "Update field" : "Create field"}
                </button>
                <button onClick={resetForm} type="button" className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-6 py-3 text-sm text-white">
                  Reset
                </button>
              </div>
            </div>
          </section> : null}
        </div>
      </div>
    </div>
  );

  return useMain ? <main className="flex-1 px-4 sm:px-6 lg:px-8">{content}</main> : content;
}


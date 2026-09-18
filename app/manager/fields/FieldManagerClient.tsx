"use client";

import { fetchJson } from "@/lib/fetch-json";
import {
  DAY_KEYS,
  DAY_LABELS,
  EVERYDAY_VALUE,
  WEEKDAYS_VALUE,
  WEEKEND_VALUE,
  formatDayOfWeek,
  normalizeDayOfWeek,
} from "@/lib/schedule-days";
import { LoadingOverlay, Spinner } from "@/components/ui/spinner";

import { useEffect, useMemo, useState } from "react";

interface SlotItem {
  id: string;
  startTime: string;
  endTime: string;
  dayOfWeek?: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

interface SlotFormState {
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

export default function FieldManagerClient({ adminName, useMain = true }: { adminName: string; useMain?: boolean }) {
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<SlotItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<SlotFormState>({
    startTime: "07:00",
    endTime: "08:00",
    dayOfWeek: EVERYDAY_VALUE,
    price: 110000,
    isActive: true,
    sortOrder: 0,
  });

  const fetchSlots = async (pageParam = 1, q = "") => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(pageParam));
      params.set("limit", String(20));
      if (q) params.set("q", q);
      const { res: response, data: __body } = await fetchJson(`/api/admin/fields?${params.toString()}`, { cache: "no-store" });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to load schedule slots");
      setSlots(data.data || []);
      setPage(data.page || pageParam);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots(page, query);
  }, [page, query]);

  const resetForm = () => {
    setEditing(null);
    setShowForm(false);
    setFormState({
      startTime: "07:00",
      endTime: "08:00",
      dayOfWeek: EVERYDAY_VALUE,
      price: 110000,
      isActive: true,
      sortOrder: 0,
    });
  };

  const handleSearch = async () => {
    setPage(1);
    await fetchSlots(1, query.trim());
  };

  const goToPage = async (p: number) => {
    if (p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setPage(p);
    await fetchSlots(p, query);
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
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to save schedule slot");
      await fetchSlots();
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (slot: SlotItem) => {
    setEditing(slot);
    setShowForm(true);
    setFormState({
      startTime: slot.startTime ?? "07:00",
      endTime: slot.endTime ?? "08:00",
      dayOfWeek: normalizeDayOfWeek(slot.dayOfWeek) ?? EVERYDAY_VALUE,
      price: slot.price ?? 110000,
      isActive: slot.isActive ?? true,
      sortOrder: slot.sortOrder ?? 0,
    });
  };

  const toggleDay = (day: string) => {
    const current = new Set(formState.dayOfWeek.split(",").filter(Boolean));
    if (current.has(day)) {
      current.delete(day);
    } else {
      current.add(day);
    }
    const ordered = DAY_KEYS.filter((d) => current.has(d));
    setFormState((prev) => ({ ...prev, dayOfWeek: ordered.length > 0 ? ordered.join(",") : EVERYDAY_VALUE }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this schedule slot?")) return;
    setLoading(true);
    setError(null);

    try {
      const { res: response, data: __body } = await fetchJson(`/api/admin/fields/${id}`, { method: "DELETE" });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to delete schedule slot");
      await fetchSlots();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className="mx-auto max-w-7xl space-y-8" id="fields">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Schedule manager</p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Manager CRUD Table</h1>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                Manage schedule slots (time slots & prices) directly. Create, update, and delete slots for booking operations.
              </p>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-[color:var(--muted)]">Signed in as {adminName}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white sm:text-2xl">Schedule slots</h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">CRUD table untuk semua jadwal jam & harga.</p>
              </div>
              <div className="flex items-center gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search time or price" className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white" />
                <button onClick={handleSearch} className="btn-secondary px-4 py-2">Search</button>
                <button onClick={() => setShowForm(true)} className="btn-secondary px-4 py-2">New slot</button>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
            ) : null}

            <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-[color:var(--background)]">
              <table className="w-full min-w-[720px] divide-y divide-white/10 text-left text-sm">
                <thead className="bg-[color:rgba(255,255,255,0.03)] text-[color:var(--muted)]">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3">Sort Order</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {slots.map((slot) => (
                    <tr key={slot.id} className="bg-[color:rgba(255,255,255,0.02)]">
                      <td className="px-4 py-3 text-white">{slot.startTime} - {slot.endTime}</td>
                      <td className="px-4 py-3 text-white">{formatDayOfWeek(slot.dayOfWeek)}</td>
                      <td className="px-4 py-3">Rp {Number(slot.price).toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3">{slot.isActive ? "Yes" : "No"}</td>
                      <td className="px-4 py-3">{slot.sortOrder}</td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => handleEdit(slot)} className="rounded-full border border-[color:rgba(56,189,248,0.24)] px-3 py-2 text-sm text-[color:var(--accent)] hover:bg-[color:rgba(56,189,248,0.06)]">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(slot.id)} className="rounded-full border border-rose-500/20 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {slots.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-[color:var(--muted)]">
                        {loading ? "Loading schedule slots..." : "No schedule slots found."}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between px-4">
              <div className="text-sm text-[color:var(--muted)]">Total: {loading ? "..." : `${slots.length} items on this page`}</div>
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
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Create / update schedule slot</h2>
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Start Time</label>
                  <input type="time" value={formState.startTime} onChange={(e) => handleChange("startTime", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">End Time</label>
                  <input type="time" value={formState.endTime} onChange={(e) => handleChange("endTime", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm text-[color:var(--muted)]">Active days</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DAY_KEYS.map((day) => {
                    const active = formState.dayOfWeek.split(",").includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`rounded-full border px-3 py-2 text-xs font-medium transition ${
                          active
                            ? "border-[color:var(--accent)] bg-[color:rgba(56,189,248,0.12)] text-white"
                            : "border-white/10 bg-[color:var(--background)] text-[color:var(--muted)]"
                        }`}
                      >
                        {DAY_LABELS[day]}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleChange("dayOfWeek", EVERYDAY_VALUE)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-[color:var(--muted)]">Setiap hari</button>
                  <button type="button" onClick={() => handleChange("dayOfWeek", WEEKDAYS_VALUE)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-[color:var(--muted)]">Senin–Jumat</button>
                  <button type="button" onClick={() => handleChange("dayOfWeek", WEEKEND_VALUE)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-[color:var(--muted)]">Sabtu–Minggu</button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Price (IDR)</label>
                  <input type="number" value={formState.price} onChange={(e) => handleChange("price", Number(e.target.value))} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Sort Order</label>
                  <input type="number" value={formState.sortOrder} onChange={(e) => handleChange("sortOrder", Number(e.target.value))} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-[color:var(--muted)]">Active</label>
                <button type="button" onClick={() => handleChange("isActive", !formState.isActive)} className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-left text-sm text-white outline-none">
                  {formState.isActive ? "Active" : "Inactive"}
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2 px-6 py-3 disabled:opacity-60">
                  {loading ? <Spinner size={18} /> : null}
                  {editing ? "Update slot" : "Create slot"}
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

  const wrapped = (
    <>
      {content}
      <LoadingOverlay show={loading} label={editing || showForm ? "Menyimpan slot..." : "Memuat jadwal..."} />
    </>
  );

  return useMain ? <main className="flex-1 px-4 sm:px-6 lg:px-8">{wrapped}</main> : wrapped;
}
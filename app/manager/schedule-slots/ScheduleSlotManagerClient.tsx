"use client";

import { fetchJson } from "@/lib/fetch-json";

import { useEffect, useState } from "react";

type ScheduleSlotItem = {
  id: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  sortOrder: number;
};

interface ScheduleSlotFormState {
  startTime: string;
  endTime: string;
  isActive: boolean;
  sortOrder: number;
}

export default function ScheduleSlotManagerClient({ adminName }: { adminName: string }) {
  const [slots, setSlots] = useState<ScheduleSlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ScheduleSlotItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<ScheduleSlotFormState>({
    startTime: "",
    endTime: "",
    isActive: true,
    sortOrder: 0,
  });

  const loadSlots = async () => {
    setLoading(true);
    setError(null);

    try {
      const { res: response, data: __body } = await fetchJson("/api/admin/schedule-slots", { cache: "no-store" });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to load schedule slots.");
      setSlots(data.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadSlots(); }, []);

  const resetForm = () => {
    setEditing(null);
    setShowForm(false);
    setFormState({ startTime: "", endTime: "", isActive: true, sortOrder: 0 });
  };

  const handleChange = (field: keyof ScheduleSlotFormState, value: string | boolean | number) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = editing ? `/api/admin/schedule-slots/${editing.id}` : "/api/admin/schedule-slots";
      const method = editing ? "PUT" : "POST";
      const { res: response, data: __body } = await fetchJson(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to save schedule slot.");
      await loadSlots();
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (slot: ScheduleSlotItem) => {
    setEditing(slot);
    setShowForm(true);
    setFormState({
      startTime: slot.startTime,
      endTime: slot.endTime,
      isActive: slot.isActive,
      sortOrder: slot.sortOrder,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this schedule slot?")) return;
    setLoading(true);
    setError(null);

    try {
      const { res: response, data: __body } = await fetchJson(`/api/admin/schedule-slots/${id}`, { method: "DELETE" });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to delete schedule slot.");
      await loadSlots();
      if (editing?.id === id) resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8" id="schedule-slots">
      <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Schedule manager</p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Booking schedule slots</h1>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              Manage schedule slots that control availability for the booking engine.
            </p>
          </div>
          <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-[color:var(--muted)]">Signed in as {adminName}</div>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white sm:text-2xl">Schedule slots</h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">Slots are rendered in booking availability and validated on checkout.</p>
              </div>
              <div className="flex gap-2"><button onClick={() => void loadSlots()} className="btn-secondary px-4 py-2">Refresh</button><button onClick={() => setShowForm(true)} className="btn-secondary px-4 py-2">New slot</button></div>
            </div>

            <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-[color:var(--background)]">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-[color:rgba(255,255,255,0.03)] text-[color:var(--muted)]">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Start</th>
                    <th className="px-4 py-3">End</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {slots.map((slot) => (
                    <tr key={slot.id} className="bg-[color:rgba(255,255,255,0.02)]">
                      <td className="px-4 py-3 text-white">{slot.sortOrder}</td>
                      <td className="px-4 py-3">{slot.startTime}</td>
                      <td className="px-4 py-3">{slot.endTime}</td>
                      <td className="px-4 py-3">{slot.isActive ? "Yes" : "No"}</td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => handleEdit(slot)} className="rounded-full border border-[color:rgba(56,189,248,0.24)] px-3 py-2 text-sm text-[color:var(--accent)] hover:bg-[color:rgba(56,189,248,0.06)]">Edit</button>
                        <button onClick={() => void handleDelete(slot.id)} className="rounded-full border border-rose-500/20 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10">Delete</button>
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
          </section>

          {showForm ? <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Create / update slot</h2>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-[color:var(--muted)]">Start time</label>
                <input value={formState.startTime} onChange={(e) => handleChange("startTime", e.target.value)} placeholder="HH:MM" className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-sm text-[color:var(--muted)]">End time</label>
                <input value={formState.endTime} onChange={(e) => handleChange("endTime", e.target.value)} placeholder="HH:MM" className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Sort order</label>
                  <input type="number" value={formState.sortOrder} onChange={(e) => handleChange("sortOrder", Number(e.target.value))} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
                <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3">
                  <label className="text-sm text-[color:var(--muted)]">Active</label>
                  <input type="checkbox" checked={formState.isActive} onChange={(e) => handleChange("isActive", e.target.checked)} className="h-5 w-5 rounded border-white/10 bg-white/5 text-[color:var(--accent)]" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={loading} className="btn-primary px-6 py-3 disabled:opacity-60">
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
  );
}

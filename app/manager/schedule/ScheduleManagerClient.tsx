"use client";

import { fetchJson } from "@/lib/fetch-json";
import { Switch } from "@/components/ui/switch";

import { useEffect, useState } from "react";

import { formatDayOfWeek, normalizeDayOfWeek, EVERYDAY_VALUE, WEEKDAYS_VALUE, WEEKEND_VALUE } from "@/lib/schedule-days";

import { LoadingOverlay, Spinner } from "@/components/ui/spinner";

type ScheduleSlotItem = {
  id: string;
  startTime: string;
  endTime: string;
  dayOfWeek?: string;
  price?: number;
  isActive: boolean;
  sortOrder: number;
};

interface ScheduleSlotFormState {
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
}

export default function ScheduleManagerClient({ adminName }: { adminName: string }) {
  const [slots, setSlots] = useState<ScheduleSlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ScheduleSlotItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<ScheduleSlotFormState>({
    startTime: "",
    endTime: "",
    dayOfWeek: EVERYDAY_VALUE,
    price: 0,
    isActive: true,
    sortOrder: 0,
  });

  const loadSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const { res: response, data: __body } = await fetchJson("/api/admin/schedule-slots", { cache: "no-store" });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to load schedule slots");
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
    setFormState({ startTime: "", endTime: "", dayOfWeek: EVERYDAY_VALUE, price: 0, isActive: true, sortOrder: 0 });
  };

  const handleChange = (field: string, value: string | boolean | number) => {
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
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to save schedule slot");
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
      dayOfWeek: normalizeDayOfWeek(slot.dayOfWeek) ?? EVERYDAY_VALUE,
      price: slot.price ?? 0,
      isActive: slot.isActive,
      sortOrder: slot.sortOrder,
    });
  };

  const handleToggleActive = async (slot: ScheduleSlotItem) => {
    setError(null);
    try {
      const { res: response, data: __body } = await fetchJson(`/api/admin/schedule-slots/${slot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: slot.startTime,
          endTime: slot.endTime,
          price: slot.price ?? 0,
          dayOfWeek: slot.dayOfWeek ?? EVERYDAY_VALUE,
          isActive: !slot.isActive,
          sortOrder: slot.sortOrder,
        }),
      });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to update slot status");
      await loadSlots();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this schedule slot?")) return;
    setLoading(true);
    setError(null);
    try {
      const { res: response, data: __body } = await fetchJson(`/api/admin/schedule-slots/${id}`, { method: "DELETE" });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to delete schedule slot");
      await loadSlots();
      if (editing?.id === id) resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    const current = new Set(formState.dayOfWeek.split(",").filter(Boolean));
    if (current.has(day)) {
      current.delete(day);
    } else {
      current.add(day);
    }
    const ordered = [WEEKDAYS_VALUE, WEEKEND_VALUE, EVERYDAY_VALUE].includes(formState.dayOfWeek as string)
      ? [day]
      : formState.dayOfWeek.split(",").filter(Boolean);
    if (!ordered.includes(day)) ordered.push(day);
    setFormState((prev) => ({ ...prev, dayOfWeek: ordered.length > 0 ? ordered.join(",") : EVERYDAY_VALUE }));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 overflow-x-clip px-4 sm:px-6 lg:px-8" id="schedule-slots">
      <LoadingOverlay show={loading} label={editing || showForm ? "Menyimpan slot..." : "Memuat jadwal..."} />
      <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Schedule manager</p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Booking schedule slots</h1>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              Manage schedule slots that control availability for the booking engine.
            </p>
          </div>
          
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white sm:text-2xl">Schedule slots</h2>
              <p className="mt-2 text-sm text-[color:var(--muted)]">Slots are rendered in booking availability and validated on checkout.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => void loadSlots()} className="btn-secondary px-4 py-2">Refresh</button>
              <button onClick={() => setShowForm(true)} className="btn-secondary px-4 py-2">New slot</button>
            </div>
          </div>

          <div className="table-scroll mt-6 touch-pan-x touch-pan-y overflow-x-auto rounded-3xl border border-white/10 bg-[color:var(--background)] [-webkit-overflow-scrolling:touch]">
            <table className="hidden md:table w-full min-w-[680px] text-left text-sm">
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
                    <td className="px-4 py-3">{formatDayOfWeek(slot.dayOfWeek)}</td>
                    <td className="px-4 py-3">Rp {Number(slot.price ?? 0).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3">
                      <Switch small checked={slot.isActive} onChange={() => void handleToggleActive(slot)} label="Active" />
                    </td>
                    <td className="px-4 py-3">{slot.sortOrder}</td>
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

            <div className="md:hidden space-y-3 p-3">
              {slots.map((slot) => (
                <div key={slot.id} className="rounded-2xl border border-white/10 bg-[color:rgba(255,255,255,0.02)] p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium text-white mb-1">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      <div className="text-xs text-[color:var(--muted)]">
                        {formatDayOfWeek(slot.dayOfWeek)}
                      </div>
                    </div>
                    <Switch
                      small
                      checked={slot.isActive}
                      onChange={() => void handleToggleActive(slot)}
                      label="Active"
                    />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[color:var(--muted)]">Price</span>
                      <span className="text-white">Rp {Number(slot.price ?? 0).toLocaleString("id-ID")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[color:var(--muted)]">Sort Order</span>
                      <span className="text-white">{slot.sortOrder}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(slot)}
                      className="flex-1 rounded-full border border-[color:rgba(56,189,248,0.24)] px-3 py-2 text-xs text-[color:var(--accent)] hover:bg-[color:rgba(56,189,248,0.06)]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void handleDelete(slot.id)}
                      className="flex-1 rounded-full border border-rose-500/20 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {slots.length === 0 && !loading && (
                <div className="py-8 text-center text-sm text-[color:var(--muted)]">
                  No schedule slots found.
                </div>
              )}
            </div>
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
            <div>
              <label className="text-sm text-[color:var(--muted)]">Active days</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[WEEKDAYS_VALUE, WEEKEND_VALUE, EVERYDAY_VALUE].map((preset) => (
                  <button key={preset} type="button" onClick={() => handleChange("dayOfWeek", preset)} className={`rounded-full border px-3 py-1 text-xs ${formState.dayOfWeek === preset ? "border-[color:var(--accent)] bg-[color:rgba(56,189,248,0.12)] text-white" : "border-white/10 bg-[color:var(--background)] text-[color:var(--muted)]"}`}>{preset}</button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu","Minggu"].map((day, i) => {
                  const key = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"][i];
                  const active = formState.dayOfWeek.split(",").includes(key);
                  return (
                    <button key={day} type="button" onClick={() => toggleDay(key)} className={`rounded-full border px-3 py-1 text-xs ${active ? "border-[color:var(--accent)] bg-[color:rgba(56,189,248,0.12)] text-white" : "border-white/10 bg-[color:var(--background)] text-[color:var(--muted)]"}`}>{day}</button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-sm text-[color:var(--muted)]">Price (IDR)</label>
              <input type="number" value={formState.price} onChange={(e) => handleChange("price", Number(e.target.value))} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm text-[color:var(--muted)]">Sort order</label>
                <input type="number" value={formState.sortOrder} onChange={(e) => handleChange("sortOrder", Number(e.target.value))} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3">
                <span className="text-sm text-[color:var(--muted)]">Active</span>
                <Switch checked={formState.isActive} onChange={(v) => handleChange("isActive", v)} label="Active" />
              </div>
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
  );
}
"use client";

import { fetchJson } from "@/lib/fetch-json";
import { Switch } from "@/components/ui/switch";

import { useEffect, useState } from "react";

type ScheduleSlotItem = {
  id: string;
  startTime: string;
  endTime: string;
  dayOfWeek?: string;
  price?: number;
  isActive: boolean;
  sortOrder: number;
};

export default function StaffFieldViewer({ adminName }: { adminName: string }) {
  const [slots, setSlots] = useState<ScheduleSlotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const { res: response, data: __body } = await fetchJson("/api/admin/schedule-slots", { cache: "no-store" });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to load fields");
      setSlots(data.data || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchSlots(); }, []);

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
              <button onClick={() => void fetchSlots()} className="btn-secondary px-3 py-1">Refresh</button>
            </div>
          </div>
          {error ? (
            <div className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
          ) : null}
          <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-[color:var(--background)]">
            <table className="w-full min-w-[680px] divide-y divide-white/10 text-left text-sm">
              <thead className="bg-[color:rgba(255,255,255,0.03)] text-[color:var(--muted)]">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {slots.map((slot) => (
                  <tr key={slot.id} className="bg-[color:rgba(255,255,255,0.02)]">
                    <td className="px-4 py-3 text-white">{slot.startTime} - {slot.endTime}</td>
                    <td className="px-4 py-3">{slot.dayOfWeek}</td>
                    <td className="px-4 py-3">Rp {Number(slot.price ?? 0).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3">
                      <Switch small checked={Boolean(slot.isActive)} disabled label="Active" />
                    </td>
                  </tr>
                ))}
                {slots.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-sm text-[color:var(--muted)]">
                      {loading ? "Loading fields..." : "No fields available."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
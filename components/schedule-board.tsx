"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/fetch-json";
import { Skeleton } from "@/components/ui/skeleton";
import { DAY_KEYS, DAY_SHORT, slotAppliesOnDate } from "@/lib/schedule-days";

type BoardSlot = {
  id: string;
  startTime: string;
  endTime: string;
  dayOfWeek?: string | null;
  price?: number | null;
};

type BoardBooking = {
  id: string;
  customerName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
  totalPrice: number;
};

function mondayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && aEnd > bStart;
}

function blockStyle(status: string): string {
  switch (status) {
    case "confirmed":
      return "border-rose-400/40 bg-rose-500/85 text-white";
    case "pending":
      return "border-amber-400/40 bg-amber-500/85 text-white";
    case "completed":
      return "border-sky-400/40 bg-sky-500/85 text-white";
    default:
      return "border-white/10 bg-white/5 text-[color:var(--muted)] line-through";
  }
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Terisi",
  completed: "Selesai",
  cancelled: "Batal",
  expired: "Kadaluarsa",
  refunded: "Refund",
};

function formatWeekLabel(monday: string): string {
  const start = new Date(`${monday}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmtDay = new Intl.DateTimeFormat("id-ID", { day: "numeric", timeZone: "UTC" });
  const fmtMonth = new Intl.DateTimeFormat("id-ID", { month: "short", timeZone: "UTC" });
  const fmtYear = new Intl.DateTimeFormat("id-ID", { year: "numeric", timeZone: "UTC" });
  const sameMonth = start.getUTCMonth() === end.getUTCMonth();
  const left = sameMonth ? fmtDay.format(start) : `${fmtDay.format(start)} ${fmtMonth.format(start)}`;
  return `${left} – ${fmtDay.format(end)} ${fmtMonth.format(end)} ${fmtYear.format(end)}`;
}

export default function ScheduleBoard() {
  const [monday, setMonday] = useState(() => mondayOf(todayStr()));
  const [slots, setSlots] = useState<BoardSlot[]>([]);
  const [bookings, setBookings] = useState<BoardBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const today = useMemo(() => todayStr(), []);
  const days = useMemo(() => DAY_KEYS.map((_, i) => addDaysStr(monday, i)), [monday]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setSelectedId(null);
    fetchJson(`/api/admin/schedule-board?start=${monday}&days=7`, { cache: "no-store", signal: controller.signal })
      .then(({ res, data }) => {
        if (!res.ok) throw new Error(String(data?.message ?? "") || "Unable to load schedule board.");
        setSlots(Array.isArray(data?.slots) ? data.slots : []);
        setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [monday]);

  const selected = useMemo(
    () => bookings.find((b) => b.id === selectedId) ?? null,
    [bookings, selectedId]
  );

  return (
    <section id="schedule-board" className="mx-auto max-w-7xl space-y-6 overflow-x-clip px-4 sm:px-6 lg:px-8">
      <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Papan jadwal</p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Jadwal mingguan lapangan</h1>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              Lihat keterisian slot per jam setiap hari. Klik blok berwarna untuk detail booking.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMonday((m) => addDaysStr(m, -7))} className="btn-secondary px-4 py-2">‹ Minggu lalu</button>
            <button onClick={() => setMonday(mondayOf(todayStr()))} className="btn-secondary px-4 py-2">Hari ini</button>
            <button onClick={() => setMonday((m) => addDaysStr(m, 7))} className="btn-secondary px-4 py-2">Minggu depan ›</button>
          </div>
        </div>
        <p className="mt-4 text-sm font-semibold text-white">{formatWeekLabel(monday)}</p>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
      ) : null}

      <div className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4 text-xs text-[color:var(--muted)]">
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-500/85" /> Terisi</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-500/85" /> Pending</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-sky-500/85" /> Selesai</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-white/10" /> Kosong / tutup</span>
        </div>

        {loading && bookings.length === 0 && slots.length === 0 ? (
          <div className="mt-6 space-y-3" aria-busy="true">
            <span className="sr-only" role="status">Memuat papan jadwal…</span>
            <div aria-hidden="true" className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="block h-12 w-full" />
              ))}
            </div>
          </div>
        ) : slots.length === 0 ? (
          <p className="mt-6 rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-6 text-center text-sm text-[color:var(--muted)]">
            Belum ada slot jadwal aktif. Tambahkan dulu di tabel schedule slots.
          </p>
        ) : (
          <div data-drag-scroll className="table-scroll mt-6 max-w-full touch-pan-y overflow-x-auto rounded-3xl border border-white/10 bg-[color:var(--background)] [-webkit-overflow-scrolling:touch]">
            <table aria-busy={loading} className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-28 bg-[color:var(--background)] px-4 py-3 text-[color:var(--muted)] border-r border-white/10">Jam</th>
                  {days.map((day, i) => {
                    const isToday = day === today;
                    return (
                      <th
                        key={day}
                        className={`px-2 py-3 text-center border-r border-white/10 last:border-r-0 ${isToday ? "text-white" : "text-[color:var(--muted)]"}`}
                      >
                        <span className={`inline-block rounded-2xl px-3 py-1 ${isToday ? "bg-[color:var(--accent)] font-semibold text-black" : ""}`}>
                          {DAY_SHORT[DAY_KEYS[i]]} {Number(day.slice(8, 10))}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id} className="border-b border-white/10 last:border-b-0">
                    <td className="sticky left-0 z-10 bg-[color:var(--background)] px-4 py-2 text-xs font-semibold whitespace-nowrap text-white border-r border-white/10">
                      {slot.startTime} - {slot.endTime}
                    </td>
                    {days.map((day, i) => {
                      const open = slotAppliesOnDate(slot.dayOfWeek, day);
                      const fills = open
                        ? bookings.filter(
                            (b) =>
                              b.bookingDate.slice(0, 10) === day &&
                              overlaps(b.startTime, b.endTime, slot.startTime, slot.endTime)
                          )
                        : [];
                      return (
                        <td
                          key={day}
                          className={`px-1.5 py-1.5 align-top border-r border-white/10 last:border-r-0 ${i === days.length - 1 ? "pr-2" : ""}`}
                        >
                          {fills.length > 0 ? (
                            <div className="space-y-1">
                              {fills.map((b) => (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => setSelectedId((current) => (current === b.id ? null : b.id))}
                                  title={`${b.customerName} (${b.status})`}
                                  className={`block w-full min-w-0 truncate rounded-xl border px-1.5 py-1.5 text-center text-xs font-semibold transition hover:brightness-110 ${blockStyle(b.status)} ${selectedId === b.id ? "ring-2 ring-white" : ""}`}
                                >
                                  {b.customerName}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className={`rounded-xl px-1.5 py-1.5 text-center text-xs ${open ? "text-[color:var(--muted)]/40" : "bg-white/5 text-[color:var(--muted)]/50"}`}>
                              {open ? "·" : "–"}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selected ? (
          <div className="mt-6 rounded-3xl border border-white/10 bg-[color:var(--background)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">
                  {STATUS_LABEL[selected.status] ?? selected.status}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">{selected.customerName}</h3>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  {selected.bookingDate.slice(0, 10)} • {selected.startTime}–{selected.endTime} WIB • Rp {Number(selected.totalPrice).toLocaleString("id-ID")}
                </p>
                <p className="mt-1 font-mono text-xs text-[color:var(--muted)]">{selected.id}</p>
              </div>
              <button onClick={() => setSelectedId(null)} className="btn-secondary px-4 py-2">Tutup</button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

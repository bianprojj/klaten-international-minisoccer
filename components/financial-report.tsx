"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetch-json";

interface RevenueBucket {
  label: string;
  revenue: number;
  bookings: number;
  payments: number;
}

interface ReportData {
  buckets: RevenueBucket[];
  totalRevenue: number;
  totalBookings: number;
  totalPayments: number;
  avgPerBooking: number;
}

type Period = "daily" | "weekly" | "monthly";

export default function FinancialReport({ adminName }: { adminName: string }) {
  const [period, setPeriod] = useState<Period>("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("period", period);
      if (startDate && endDate) {
        params.set("startDate", startDate);
        params.set("endDate", endDate);
      }
      const { res: response, data: body } = await fetchJson(`/api/admin/reports/revenue?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(String(body.message ?? "") || `Unable to load report (${response.status}).`);
      setData((body.data as ReportData | null) ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxRevenue = data?.buckets.reduce((max, b) => Math.max(max, b.revenue), 0) ?? 0;

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8" id="financial-report">
      <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Financial report</p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Laporan Keuangan</h1>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
              Revenue harian, mingguan, bulanan, atau rentang tanggal tertentu. Signed in as {adminName}
            </p>
          </div>
          <button onClick={() => void load()} className="btn-secondary px-4 py-2">
            Refresh
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                period === p ? "bg-[color:var(--accent)] text-black" : "bg-white/5 text-white hover:bg-white/10"
              }`}
            >
              {p === "daily" ? "Harian" : p === "weekly" ? "Mingguan" : "Bulanan"}
            </button>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white"
            />
            <span className="text-sm text-[color:var(--muted)]">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="rounded-full bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
      ) : null}

      {loading ? (
        <div className="glass-panel rounded-[1.5rem] p-6 text-sm text-[color:var(--muted)]">
          Loading report...
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
              <p className="text-sm text-[color:var(--muted)]">Total revenue</p>
              <p className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Rp {data.totalRevenue.toLocaleString("id-ID")}</p>
            </div>
            <div className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
              <p className="text-sm text-[color:var(--muted)]">Total bookings</p>
              <p className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{data.totalBookings}</p>
            </div>
            <div className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
              <p className="text-sm text-[color:var(--muted)]">Successful payments</p>
              <p className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{data.totalPayments}</p>
            </div>
            <div className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
              <p className="text-sm text-[color:var(--muted)]">Avg per booking</p>
              <p className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Rp {data.avgPerBooking.toLocaleString("id-ID")}</p>
            </div>
          </div>

          <div className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white">
              Grafik Revenue {period === "daily" ? "Harian" : period === "weekly" ? "Mingguan" : "Bulanan"}
            </h2>
            <div className="mt-6 space-y-3">
              {data.buckets.length > 0 ? (
                data.buckets.map((bucket) => (
                  <div key={bucket.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[color:var(--muted)]">{bucket.label}</span>
                      <span className="text-white">
                        Rp {bucket.revenue.toLocaleString("id-ID")} · {bucket.bookings} bookings
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-[color:var(--accent)]"
                        style={{ width: maxRevenue > 0 ? `${Math.max((bucket.revenue / maxRevenue) * 100, 2)}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-[color:var(--muted)]">
                  Belum ada data revenue untuk periode ini.
                </p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

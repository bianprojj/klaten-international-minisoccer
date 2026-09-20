"use client";

import { fetchJson } from "@/lib/fetch-json";
import { LoadingOverlay, Spinner } from "@/components/ui/spinner";
import { TableResponsive } from "@/components/ui/table-responsive";
import { EditableBadge } from "@/components/ui/inline-edit";
import { Switch } from "@/components/ui/switch";

import { useEffect, useState } from "react";

interface StaffBookingItem {
  id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  fieldName: string;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", variant: "warning" as const },
  { value: "confirmed", label: "Confirmed", variant: "success" as const },
  { value: "cancelled", label: "Cancelled", variant: "danger" as const },
  { value: "completed", label: "Completed", variant: "info" as const },
];

export default function StaffBookingViewer({ adminName, useMain = true }: { adminName: string; useMain?: boolean }) {
  const [bookings, setBookings] = useState<StaffBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ customerName: "", customerPhone: "", customerEmail: "", bookingDate: "", startTime: "", endTime: "", paymentMethod: "Offline" });
  const [walkInError, setWalkInError] = useState<string | null>(null);
  const [walkInSuccess, setWalkInSuccess] = useState<string | null>(null);
  const [walkInLoading, setWalkInLoading] = useState(false);

  const fetchBookings = async (pageParam = 1, q = "", date = "") => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageParam));
      params.set("limit", String(25));
      if (q) params.set("q", q);
      if (date) params.set("date", date);
      const { res: response, data: __body } = await fetchJson(`/api/admin/bookings?${params.toString()}`, { cache: "no-store" });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to load bookings");
      setBookings(data.data || []);
      setPage(data.page || pageParam);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(page, query, filterDate);
  }, [page, query, filterDate]);

  const handleSearch = async () => {
    setPage(1);
    await fetchBookings(1, query.trim(), filterDate);
  };

  const goToPage = async (p: number) => {
    if (p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setPage(p);
    await fetchBookings(p, query, filterDate);
  };

  const handleWalkIn = async () => {
    setWalkInError(null);
    setWalkInSuccess(null);
    if (!walkInForm.customerName || !walkInForm.customerPhone || !walkInForm.bookingDate || !walkInForm.startTime || !walkInForm.endTime) {
      setWalkInError("Nama, no HP, tanggal, dan waktu wajib diisi.");
      return;
    }
    setWalkInLoading(true);
    try {
      const { res, data: __body } = await fetchJson("/api/staff/walk-in", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(walkInForm) });
      const data = __body;
      if (!res.ok) throw new Error(String(data.message ?? "") || "Gagal membuat booking");
      setWalkInSuccess(`Booking berhasil! Invoice: ${data.data.invoice.invoiceNumber}`);
      setWalkInForm({ customerName: "", customerPhone: "", customerEmail: "", bookingDate: "", startTime: "", endTime: "", paymentMethod: "Offline" });
      setShowWalkIn(false);
      await fetchBookings(1, query, filterDate);
    } catch (e) {
      setWalkInError((e as Error).message);
    } finally {
      setWalkInLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { res, data: __body } = await fetchJson(`/api/admin/bookings/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      const data = __body;
      if (!res.ok) throw new Error(String(data.message ?? "") || "Gagal update");
      await fetchBookings(page, query, filterDate);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus booking ini?")) return;
    try {
      const { res, data: __body } = await fetchJson(`/api/admin/bookings/${id}`, { method: "DELETE" });
      const data = __body;
      if (!res.ok) throw new Error(String(data.message ?? "") || "Gagal hapus");
      await fetchBookings(page, query, filterDate);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (b: StaffBookingItem) => <span className="font-mono text-xs text-muted">{b.id.slice(0, 8)}</span>,
      className: "w-24",
    },
    {
      key: "customer",
      header: "Pelanggan",
      render: (b: StaffBookingItem) => (
        <div className="flex flex-col">
          <span className="font-medium">{b.customerName}</span>
          <span className="text-xs text-muted">{b.customerPhone}</span>
        </div>
      ),
    },
    {
      key: "datetime",
      header: "Tanggal / Waktu",
      render: (b: StaffBookingItem) => (
        <div className="flex flex-col">
          <span>{b.bookingDate.split("T")[0]}</span>
          <span className="text-xs text-muted">{b.startTime}–{b.endTime}</span>
        </div>
      ),
    },
    {
      key: "price",
      header: "Total",
      render: (b: StaffBookingItem) => <span className="font-semibold">Rp {Number(b.totalPrice).toLocaleString("id-ID")}</span>,
      className: "text-right w-36",
    },
    {
      key: "status",
      header: "Status",
      render: (b: StaffBookingItem) => (
        <EditableBadge
          value={b.status}
          options={STATUS_OPTIONS}
          onSave={(newStatus) => handleUpdateStatus(b.id, newStatus)}
          className="w-auto"
        />
      ),
      className: "w-32",
    },
    {
      key: "actions",
      header: "Aksi",
      render: (b: StaffBookingItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDelete(b.id)}
            className="rounded p-1.5 text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Hapus"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v12m-6 0h12m-6 0h.01M6 7H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v2m-4 0h.01M8 7h8" /></svg>
          </button>
        </div>
      ),
      className: "w-16 text-center",
      hideOnMobile: true,
    },
  ];

  const cardRender = (b: StaffBookingItem) => (
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-medium">{b.customerName}</span>
          <span className="ml-2 text-xs text-muted">{b.customerPhone}</span>
        </div>
        <EditableBadge value={b.status} options={STATUS_OPTIONS} onSave={(s) => handleUpdateStatus(b.id, s)} />
      </div>
      <div className="text-sm text-muted">
        <span>{b.bookingDate.split("T")[0]}</span>
        <span className="mx-2">•</span>
        <span>{b.startTime}–{b.endTime}</span>
      </div>
      <div className="flex justify-between items-center border-t border-border pt-2">
        <span className="font-semibold">Rp {Number(b.totalPrice).toLocaleString("id-ID")}</span>
        <button
          onClick={() => handleDelete(b.id)}
          className="text-xs text-muted hover:text-red-400"
        >
          Hapus
        </button>
      </div>
    </div>
  );

  const content = (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8" id="staff-bookings">
      <div className="space-y-6">
        <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Staff booking viewer</p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Booking history</h1>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                Read-only booking details for staff operations.
              </p>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-[color:var(--muted)]">Signed in as {adminName}</div>
          </div>
        </div>

        <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Bookings</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customer or phone"
                className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white"
              />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white"
              />
              <button onClick={handleSearch} className="btn-secondary px-3 py-1">Filter</button>
            </div>
          </div>
          {error ? (
            <div className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
          ) : null}

          <TableResponsive
            data={bookings}
            columns={columns}
            keyExtractor={(b) => b.id}
            cardRender={cardRender}
            emptyMessage={loading ? "Loading bookings..." : "No bookings found."}
          />

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <select
              value={String(25)}
              onChange={(e) => { setPage(1); fetchBookings(1, query, filterDate); }}
              className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white w-auto"
            >
              <option value="10">10 per halaman</option>
              <option value="25" selected>25 per halaman</option>
              <option value="50">50 per halaman</option>
              <option value="100">100 per halaman</option>
            </select>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className="rounded px-3 py-1 bg-white/5">Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5) {
                  if (page <= 3) p = i + 1;
                  else if (page >= totalPages - 2) p = totalPages - 4 + i;
                  else p = page - 2 + i;
                }
                return (
                  <button key={p} onClick={() => goToPage(p)} className={`rounded px-3 py-1 ${p === page ? 'bg-[color:var(--accent)] text-black' : 'bg-white/5'}`}>{p}</button>
                );
              })}
              <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="rounded px-3 py-1 bg-white/5">Next</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  const wrapped = (
    <>
      {content}
      <LoadingOverlay show={loading} label="Memuat booking..." />
    </>
  );

  return useMain ? <main className="flex-1 px-6 py-16 lg:px-8">{wrapped}</main> : wrapped;
}
"use client";

import { fetchJson } from "@/lib/fetch-json";
import { LoadingOverlay, Spinner } from "@/components/ui/spinner";

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
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: "border-amber-500/20 bg-amber-500/15 text-amber-200",
    confirmed: "border-emerald-500/20 bg-emerald-500/15 text-emerald-200",
    completed: "border-sky-500/20 bg-sky-500/15 text-sky-200",
    cancelled: "border-rose-500/20 bg-rose-500/15 text-rose-200",
  };
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[status] ?? "border-white/10 bg-white/10 text-white"}`}>
      {status}
    </span>
  );
}

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");

  const fetchBookings = async (pageParam = 1, q = "", date = "") => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(pageParam));
      params.set("limit", String(6));
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

  const handleUpdateStatus = async (id: string) => {
    try {
      const { res, data: __body } = await fetchJson(`/api/admin/bookings/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: editStatus }) });
      const data = __body;
      if (!res.ok) throw new Error(String(data.message ?? "") || "Gagal update");
      setEditingId(null);
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

  const content = (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8" id="staff-bookings">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Staff booking viewer</p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Booking history</h1>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                Read-only booking details for staff operations.
              </p>
            </div>
            
          </div>
        </div>

        <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Bookings</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer or phone" className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white" />
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white" />
              <button onClick={handleSearch} className="btn-secondary px-3 py-1">Filter</button>
              <button onClick={() => setShowWalkIn(true)} className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-black">+ Walk-in</button>
            </div>
          </div>
          {error ? (
            <div className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
          ) : null}

          {showWalkIn && (
            <div className="mt-6 glass-panel rounded-3xl p-6">
              <h3 className="text-xl font-semibold text-white">Walk-in Booking</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <input placeholder="Nama" value={walkInForm.customerName} onChange={(e) => setWalkInForm(f => ({ ...f, customerName: e.target.value }))} className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white" />
                <input placeholder="No HP" value={walkInForm.customerPhone} onChange={(e) => setWalkInForm(f => ({ ...f, customerPhone: e.target.value }))} className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white" />
                <input type="email" placeholder="Email" value={walkInForm.customerEmail} onChange={(e) => setWalkInForm(f => ({ ...f, customerEmail: e.target.value }))} className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white" />
                <input type="date" placeholder="Tanggal" value={walkInForm.bookingDate} onChange={(e) => setWalkInForm(f => ({ ...f, bookingDate: e.target.value }))} className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white" />
                <input type="time" placeholder="Mulai" value={walkInForm.startTime} onChange={(e) => setWalkInForm(f => ({ ...f, startTime: e.target.value }))} className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white" />
                <input type="time" placeholder="Selesai" value={walkInForm.endTime} onChange={(e) => setWalkInForm(f => ({ ...f, endTime: e.target.value }))} className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white" />
                <select value={walkInForm.paymentMethod} onChange={(e) => setWalkInForm(f => ({ ...f, paymentMethod: e.target.value }))} className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white">
                  <option value="Offline">Cash</option>
                  <option value="Midtrans">Midtrans</option>
                </select>
              </div>
              {walkInError ? <div className="mt-4 text-sm text-rose-200">{walkInError}</div> : null}
              {walkInSuccess ? <div className="mt-4 text-sm text-emerald-200">{walkInSuccess}</div> : null}
              <div className="mt-6 flex gap-3">
                <button onClick={handleWalkIn} disabled={walkInLoading} className="flex items-center gap-2 rounded-full bg-[color:var(--accent)] px-6 py-3 font-semibold text-black disabled:opacity-60">{walkInLoading ? <Spinner size={18} /> : null}{walkInLoading ? "Memproses..." : "Buat Booking"}</button>
                <button onClick={() => setShowWalkIn(false)} className="rounded-full border border-white/10 px-6 py-3 font-semibold text-white">Batal</button>
              </div>
            </div>
          )}

          <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-[color:var(--background)]">
            <table className="w-full min-w-[860px] divide-y divide-white/10 text-left text-sm">
              <thead className="bg-[color:rgba(255,255,255,0.03)] text-[color:var(--muted)]">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Date / Time</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="bg-[color:rgba(255,255,255,0.02)]">
                    <td className="px-4 py-3">{booking.customerName}</td>
                    <td className="px-4 py-3">{booking.bookingDate.split("T")[0]} {booking.startTime}–{booking.endTime}</td>
                    <td className="px-4 py-3">Rp {Number(booking.totalPrice).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3">
                      {editingId === booking.id ? (
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="rounded border border-white/10 bg-[color:var(--background)] px-2 py-1 text-sm text-white">
                          <option value="pending">pending</option>
                          <option value="confirmed">confirmed</option>
                          <option value="cancelled">cancelled</option>
                          <option value="completed">completed</option>
                        </select>
                      ) : (
                        statusBadge(booking.status)
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === booking.id ? (
                        <>
                          <button onClick={() => handleUpdateStatus(booking.id)} className="rounded bg-emerald-600 px-3 py-1 text-sm text-white">Simpan</button>
                          <button onClick={() => setEditingId(null)} className="ml-2 rounded bg-gray-600 px-3 py-1 text-sm text-white">Batal</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(booking.id); setEditStatus(booking.status); }} className="rounded bg-blue-600 px-3 py-1 text-sm text-white">Edit</button>
                          <button onClick={() => handleDelete(booking.id)} className="ml-2 rounded bg-rose-600 px-3 py-1 text-sm text-white">Hapus</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-[color:var(--muted)]">
                    {loading ? "Loading bookings..." : "No bookings found."}
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
    </div>
  );

  const wrapped = (
    <>
      {content}
      <LoadingOverlay show={loading || walkInLoading} label={walkInLoading ? "Membuat booking + payment + invoice..." : "Memuat booking..."} />
    </>
  );

  return useMain ? <main className="flex-1 px-6 py-16 lg:px-8">{wrapped}</main> : wrapped;
}

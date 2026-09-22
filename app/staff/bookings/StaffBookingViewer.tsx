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
  notes: string | null;
}

interface StaffBookingFormState {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  notes: string;
  status: string;
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

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"];

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
  const [editing, setEditing] = useState<StaffBookingItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<StaffBookingFormState>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    bookingDate: "",
    startTime: "",
    endTime: "",
    notes: "",
    status: "pending",
  });

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

  const resetForm = () => {
    setEditing(null);
    setShowForm(false);
    setFormState({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      bookingDate: "",
      startTime: "",
      endTime: "",
      notes: "",
      status: "pending",
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = editing ? `/api/admin/bookings/${editing.id}` : "/api/admin/bookings";
      const method = editing ? "PUT" : "POST";
      const payload = editing
        ? { ...formState }
        : {
            customerName: formState.customerName,
            customerPhone: formState.customerPhone,
            customerEmail: formState.customerEmail,
            bookingDate: formState.bookingDate,
            startTime: formState.startTime,
            endTime: formState.endTime,
            notes: formState.notes,
          };
      const { res: response, data: __body } = await fetchJson(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to save booking");
      await fetchBookings();
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (booking: StaffBookingItem) => {
    setEditing(booking);
    setShowForm(true);
    setFormState({
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail ?? "",
      bookingDate: booking.bookingDate.split("T")[0],
      startTime: booking.startTime,
      endTime: booking.endTime,
      notes: booking.notes ?? "",
      status: booking.status,
    });
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
                Create, update, and delete bookings with staff-grade operational controls.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white sm:text-2xl">Bookings</h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">Operational booking table with quick edit and delete actions.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer or phone" className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white" />
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white" />
                <button onClick={handleSearch} className="btn-secondary px-4 py-2">Filter</button>
                <button onClick={() => setShowForm(true)} className="btn-secondary px-4 py-2">New booking</button>
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
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="bg-[color:rgba(255,255,255,0.02)]">
                      <td className="px-4 py-3">{booking.customerName}</td>
                      <td className="px-4 py-3">{booking.bookingDate.split("T")[0]} {booking.startTime}–{booking.endTime}</td>
                      <td className="px-4 py-3">Rp {Number(booking.totalPrice).toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3">{statusBadge(booking.status)}</td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => handleEdit(booking)} className="rounded-full border border-[color:rgba(56,189,248,0.24)] px-3 py-2 text-sm text-[color:var(--accent)] hover:bg-[color:rgba(56,189,248,0.06)]">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(booking.id)} className="rounded-full border border-rose-500/20 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10">
                          Delete
                        </button>
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
            <div className="mt-4 flex items-center justify-between px-4">
              <div className="text-sm text-[color:var(--muted)]">Total: {loading ? "..." : `${bookings.length} items on this page`}</div>
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
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Create / update booking</h2>
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Booking date</label>
                  <input type="date" value={formState.bookingDate} onChange={(e) => handleChange("bookingDate", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Start time</label>
                  <input type="time" value={formState.startTime} onChange={(e) => handleChange("startTime", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">End time</label>
                  <input type="time" value={formState.endTime} onChange={(e) => handleChange("endTime", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Customer email</label>
                  <input value={formState.customerEmail} onChange={(e) => handleChange("customerEmail", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm text-[color:var(--muted)]">Customer name</label>
                <input value={formState.customerName} onChange={(e) => handleChange("customerName", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-sm text-[color:var(--muted)]">Customer phone</label>
                <input value={formState.customerPhone} onChange={(e) => handleChange("customerPhone", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-sm text-[color:var(--muted)]">Notes</label>
                <textarea value={formState.notes} onChange={(e) => handleChange("notes", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" rows={4} />
              </div>
              <div>
                <label className="text-sm text-[color:var(--muted)]">Status</label>
                <select value={formState.status} onChange={(e) => handleChange("status", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none">
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {!editing ? (
                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-6 text-[color:var(--muted)]">
                  Payment & invoice dibuat otomatis: Cash (Offline) — status sukses & lunas, tanpa Midtrans.
                </p>
              ) : null}
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2 px-6 py-3 disabled:opacity-60">
                  {loading ? <Spinner size={18} /> : null}
                  {editing ? "Update booking" : "Create booking"}
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
      <LoadingOverlay show={loading || walkInLoading} label={walkInLoading ? "Membuat booking + payment + invoice..." : editing || showForm ? "Menyimpan booking..." : "Memuat booking..."} />
    </>
  );

  return useMain ? <main className="flex-1 px-6 py-16 lg:px-8">{wrapped}</main> : wrapped;
}

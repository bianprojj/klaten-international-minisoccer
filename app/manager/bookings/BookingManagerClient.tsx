"use client";

import { fetchJson } from "@/lib/fetch-json";
import { LoadingOverlay, Spinner } from "@/components/ui/spinner";
import { TableResponsive } from "@/components/ui/table-responsive";
import { EditableBadge, InlineEditCell } from "@/components/ui/inline-edit";

import { useEffect, useState } from "react";

interface BookingItem {
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
  fieldName: string;
  payments: Array<{ id: string; status: string; amount: number; transactionId: string }>;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", variant: "warning" as const },
  { value: "confirmed", label: "Confirmed", variant: "success" as const },
  { value: "cancelled", label: "Cancelled", variant: "danger" as const },
  { value: "completed", label: "Completed", variant: "info" as const },
];

export default function BookingManagerClient({ adminName, useMain = true }: { adminName: string; useMain?: boolean }) {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    bookingDate: "",
    startTime: "",
    endTime: "",
    notes: "",
  });

  const fetchData = async (pageParam = 1, q = "", date = "", status = "") => {
    setLoading(true);
    setError(null);

    try {
      const bookingParams = new URLSearchParams();
      bookingParams.set("page", String(pageParam));
      bookingParams.set("limit", String(25));
      if (q) bookingParams.set("q", q);
      if (date) bookingParams.set("date", date);
      if (status) bookingParams.set("status", status);

      const { res: bookingsRes, data: __bookingsBody } = await fetchJson(`/api/admin/bookings?${bookingParams.toString()}`, { cache: "no-store" });
      const bookingsJson: { data?: BookingItem[]; page?: number; totalPages?: number; message?: unknown } = __bookingsBody;

      if (!bookingsRes.ok) throw new Error(String(bookingsJson.message ?? "") || "Unable to load bookings");

      setBookings(bookingsJson.data || []);
      setPage(bookingsJson.page || pageParam);
      setTotalPages(bookingsJson.totalPages || 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page, query, filterDate, filterStatus);
  }, [page, query, filterDate, filterStatus]);

  const handleSearch = async () => {
    setPage(1);
    await fetchData(1, query.trim(), filterDate, filterStatus);
  };

  const goToPage = async (p: number) => {
    if (p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setPage(p);
    await fetchData(p, query, filterDate, filterStatus);
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormState({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      bookingDate: "",
      startTime: "",
      endTime: "",
      notes: "",
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = editingId ? `/api/admin/bookings/${editingId}` : "/api/admin/bookings";
      const method = editingId ? "PUT" : "POST";
      const { res: response, data: __body } = await fetchJson(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
        }),
      });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to save booking");
      await fetchData(page, query, filterDate, filterStatus);
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (booking: BookingItem) => {
    setEditingId(booking.id);
    setShowForm(true);
    setFormState({
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail ?? "",
      bookingDate: booking.bookingDate.split("T")[0],
      startTime: booking.startTime,
      endTime: booking.endTime,
      notes: booking.notes ?? "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this booking?")) return;
    setLoading(true);
    setError(null);

    try {
      const { res: response, data: __body } = await fetchJson(`/api/admin/bookings/${id}`, { method: "DELETE" });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to delete booking");
      await fetchData(page, query, filterDate, filterStatus);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { res: response, data: __body } = await fetchJson(`/api/admin/bookings/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Gagal update");
      await fetchData(page, query, filterDate, filterStatus);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const columns = [
    {
      key: "id",
      header: "ID",
      render: (b: BookingItem) => <span className="font-mono text-xs text-muted" title={b.id}>{b.id.slice(0, 8)}</span>,
      className: "w-24",
    },
    {
      key: "customer",
      header: "Pelanggan",
      render: (b: BookingItem) => (
        <div className="flex flex-col">
          <span className="font-medium">{b.customerName}</span>
          <span className="text-xs text-muted">{b.customerPhone}</span>
        </div>
      ),
    },
    {
      key: "datetime",
      header: "Tanggal / Waktu",
      render: (b: BookingItem) => (
        <div className="flex flex-col">
          <span>{b.bookingDate.split("T")[0]}</span>
          <span className="text-xs text-muted">{b.startTime}–{b.endTime}</span>
        </div>
      ),
    },
    {
      key: "price",
      header: "Total",
      render: (b: BookingItem) => <span className="font-semibold">Rp {Number(b.totalPrice).toLocaleString("id-ID")}</span>,
      className: "text-right w-36",
    },
    {
      key: "status",
      header: "Status",
      render: (b: BookingItem) => (
        <EditableBadge
          value={b.status}
          options={[
            { value: "pending", label: "Pending", variant: "warning" },
            { value: "confirmed", label: "Confirmed", variant: "success" },
            { value: "cancelled", label: "Cancelled", variant: "danger" },
            { value: "completed", label: "Completed", variant: "info" },
          ]}
          onSave={(newStatus) => handleUpdateStatus(b.id, newStatus)}
          className="w-auto"
        />
      ),
      className: "w-32",
    },
    {
      key: "actions",
      header: "Aksi",
      render: (b: BookingItem) => (
        <div className="flex items-center gap-2">
          <button onClick={() => handleEdit(b)} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit</button>
          <button onClick={() => handleDelete(b.id)} className="ml-1 rounded bg-rose-600 px-2 py-1 text-xs text-white">Hapus</button>
        </div>
      ),
      className: "w-28 text-center",
      hideOnMobile: true,
    },
  ];

  const cardRender = (b: BookingItem) => (
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-medium">{b.customerName}</span>
          <span className="ml-2 text-xs text-muted">{b.customerPhone}</span>
        </div>
        <EditableBadge
          value={b.status}
          options={[
            { value: "pending", label: "Pending", variant: "warning" },
            { value: "confirmed", label: "Confirmed", variant: "success" },
            { value: "cancelled", label: "Cancelled", variant: "danger" },
            { value: "completed", label: "Completed", variant: "info" },
          ]}
          onSave={(s) => handleUpdateStatus(b.id, s)}
        />
      </div>
      <div className="text-sm text-muted">
        <span>{b.bookingDate.split("T")[0]}</span>
        <span className="mx-2">•</span>
        <span>{b.startTime}–{b.endTime}</span>
      </div>
      <div className="flex justify-between items-center border-t border-border pt-2">
        <span className="font-semibold">Rp {Number(b.totalPrice).toLocaleString("id-ID")}</span>
        <div className="flex gap-2">
          <button onClick={() => handleEdit(b)} className="text-xs text-blue-400 hover:underline">Edit</button>
          <button onClick={() => handleDelete(b.id)} className="text-xs text-rose-400 hover:underline">Hapus</button>
        </div>
      </div>
    </div>
  );

  const content = (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8" id="bookings">
      <div className="space-y-6">
        <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Booking manager</p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Booking CRUD table</h1>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                Create, update, and delete bookings with staff-grade operational controls.
              </p>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-[color:var(--muted)]">Signed in as {adminName}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.6fr]">
          <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6 lg:col-span-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white sm:text-2xl">Booking list</h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">Operational booking table with quick edit and delete actions.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer or phone" className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white" />
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
                <button onClick={handleSearch} className="btn-secondary px-3 py-1">Filter</button>
                <button onClick={() => { setShowForm(true); resetForm(); }} className="btn-primary px-3 py-1">New booking</button>
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
                onChange={(e) => { setPage(1); fetchData(1, query, filterDate, filterStatus); }}
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

          {showForm && (
            <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6 lg:col-span-1">
              <h2 className="text-xl font-semibold text-white sm:text-2xl">{editingId ? "Update booking" : "Create booking"}</h2>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Field</label>
                  <div className="mt-2 rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white">
                    Lapangan Klaten International
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-[color:var(--muted)]">Booking date</label>
                    <input type="date" value={formState.bookingDate} onChange={(e) => handleChange("bookingDate", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" required />
                  </div>
                  <div>
                    <label className="text-sm text-[color:var(--muted)]">Start time</label>
                    <input type="time" value={formState.startTime} onChange={(e) => handleChange("startTime", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" required />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-[color:var(--muted)]">End time</label>
                    <input type="time" value={formState.endTime} onChange={(e) => handleChange("endTime", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" required />
                  </div>
                  <div>
                    <label className="text-sm text-[color:var(--muted)]">Customer email</label>
                    <input value={formState.customerEmail} onChange={(e) => handleChange("customerEmail", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Customer name</label>
                  <input value={formState.customerName} onChange={(e) => handleChange("customerName", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" required />
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Customer phone</label>
                  <input value={formState.customerPhone} onChange={(e) => handleChange("customerPhone", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" required />
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Notes</label>
                  <textarea value={formState.notes} onChange={(e) => handleChange("notes", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" rows={4} />
                </div>
                {!editingId ? (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-6 text-[color:var(--muted)]">
                    Payment & invoice dibuat otomatis: Cash (Offline) — status sukses & lunas, tanpa Midtrans.
                  </p>
                ) : null}
                <div className="flex gap-3">
                  <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2 px-6 py-3 disabled:opacity-60">
                    {loading ? <Spinner size={18} /> : null}
                    {editingId ? "Update booking" : "Create booking"}
                  </button>
                  <button onClick={resetForm} type="button" className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-6 py-3 text-sm text-white">
                    Reset
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );

  const wrapped = (
    <>
      {content}
      <LoadingOverlay show={loading} label={editingId || showForm ? "Menyimpan booking..." : "Memuat booking..."} />
    </>
  );

  return useMain ? <main className="flex-1 px-6 py-16 lg:px-8">{wrapped}</main> : wrapped;
}
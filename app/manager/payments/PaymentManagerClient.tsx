"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/fetch-json";
import { LoadingOverlay, Spinner } from "@/components/ui/spinner";

interface PaymentItem {
  id: string;
  transactionId: string;
  amount: number;
  paymentMethod: string;
  provider: string;
  status: string;
  paidAt: string | null;
  expiredAt: string | null;
  booking: {
    id: string;
    customerName: string;
    customerPhone: string;
    bookingDate: string;
  };
}

interface PaymentFormState {
  bookingId: string;
  transactionId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  provider: string;
  paidAt: string;
  expiredAt: string;
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: "border-amber-500/20 bg-amber-500/15 text-amber-200",
    success: "border-emerald-500/20 bg-emerald-500/15 text-emerald-200",
    failed: "border-rose-500/20 bg-rose-500/15 text-rose-200",
    refunded: "border-sky-500/20 bg-sky-500/15 text-sky-200",
    expired: "border-white/10 bg-white/10 text-white",
    cancelled: "border-rose-500/20 bg-rose-500/15 text-rose-200",
  };
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[status] ?? "border-white/10 bg-white/10 text-white"}`}>
      {status}
    </span>
  );
}

export default function PaymentManagerClient({ adminName, useMain = true }: { adminName: string; useMain?: boolean }) {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editing, setEditing] = useState<PaymentItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<PaymentFormState>({
    bookingId: "",
    transactionId: "",
    amount: 0,
    status: "pending",
    paymentMethod: "Midtrans",
    provider: "Midtrans",
    paidAt: "",
    expiredAt: "",
  });

  const fetchPayments = async (pageParam = 1, q = "", status = "") => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(pageParam));
      params.set("limit", String(6));
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const { res: response, data: raw } = await fetchJson(`/api/admin/payments?${params.toString()}`, { cache: "no-store" });
      const data: { data?: PaymentItem[]; page?: number; totalPages?: number; message?: unknown } = raw;
      if (!response.ok) throw new Error(String(data.message ?? "") === "" ? `Unable to load payments (${response.status}).` : String(data.message));
      setPayments(data.data || []);
      setPage(data.page || pageParam);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments(page, query, filterStatus);
  }, [page, query, filterStatus]);

  const handleSearch = async () => {
    setPage(1);
    await fetchPayments(1, query.trim(), filterStatus);
  };

  const goToPage = async (p: number) => {
    if (p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    setPage(p);
    await fetchPayments(p, query, filterStatus);
  };

  const resetForm = () => {
    setEditing(null);
    setShowForm(false);
    setFormState({
      bookingId: "",
      transactionId: "",
      amount: 0,
      status: "pending",
      paymentMethod: "Midtrans",
      provider: "Midtrans",
      paidAt: "",
      expiredAt: "",
    });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormState((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = editing ? `/api/admin/payments/${editing.id}` : "/api/admin/payments";
      const method = editing ? "PUT" : "POST";
      const { res: response, data } = await fetchJson(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          amount: Number(formState.amount),
          paidAt: formState.paidAt || null,
          expiredAt: formState.expiredAt || null,
        }),
      });
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to save payment");
      await fetchPayments();
      resetForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payment: PaymentItem) => {
    setEditing(payment);
    setShowForm(true);
    setFormState({
      bookingId: payment.booking.id,
      transactionId: payment.transactionId,
      amount: payment.amount,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      provider: payment.provider,
      paidAt: payment.paidAt ? payment.paidAt.split("T")[0] : "",
      expiredAt: payment.expiredAt ? payment.expiredAt.split("T")[0] : "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this payment?")) return;
    setLoading(true);
    setError(null);

    try {
      const { res: response, data: __body } = await fetchJson(`/api/admin/payments/${id}`, { method: "DELETE" });
      const data = __body;
      if (!response.ok) throw new Error(String(data.message ?? "") || "Unable to delete payment");
      await fetchPayments();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = useMemo(() => ["pending", "success", "failed", "refunded", "expired", "cancelled"], []);
  const paymentMethods = useMemo(() => ["Midtrans", "QRIS", "GoPay", "Dana", "ShopeePay", "OVO", "BCA", "BNI", "Mandiri", "Offline"], []);
  const providers = useMemo(() => ["Midtrans", "QRIS", "GoPay", "Dana", "ShopeePay", "OVO", "BCA", "BNI", "Mandiri", "Offline"], []);

  const content = (
    <div className="mx-auto max-w-7xl space-y-8 overflow-x-clip" id="payments">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Payment manager</p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Payment CRUD table</h1>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                Manage payment records for bookings in one operational interface.
              </p>
            </div>
            
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white sm:text-2xl">Payment records</h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">Create, edit, and delete payment entries.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transaction" className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white">
                  <option value="">All</option>
                  {statusOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
                <button onClick={handleSearch} className="btn-secondary px-4 py-2">Filter</button>
                <button onClick={() => setShowForm(true)} className="btn-secondary px-4 py-2">New payment</button>
              </div>
            </div>
            {error ? (
              <div className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
            ) : null}
            <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-[color:var(--background)]">
              <table className="w-full min-w-[860px] divide-y divide-white/10 text-left text-sm">
                <thead className="bg-[color:rgba(255,255,255,0.03)] text-[color:var(--muted)]">
                  <tr>
                    <th className="px-4 py-3">Booking</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="bg-[color:rgba(255,255,255,0.02)]">
                      <td className="px-4 py-3">{payment.booking.customerName}</td>
                      <td className="px-4 py-3">Rp {payment.amount.toLocaleString("id-ID")}</td>
                      <td className="px-4 py-3">{statusBadge(payment.status)}</td>
                      <td className="px-4 py-3">{payment.paymentMethod}</td>
                      <td className="px-4 py-3">{payment.provider}</td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => handleEdit(payment)} className="rounded-full border border-[color:rgba(56,189,248,0.24)] px-3 py-2 text-sm text-[color:var(--accent)] hover:bg-[color:rgba(56,189,248,0.06)]">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(payment.id)} className="rounded-full border border-rose-500/20 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-[color:var(--muted)]">
                        {loading ? "Loading payments..." : "No payment records found."}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[color:var(--muted)]">Total: {loading ? "..." : `${payments.length} items on this page`}</div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className="rounded px-3 py-1 bg-white/5">Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => goToPage(p)} className={`rounded px-3 py-1 ${p === page ? 'bg-[color:var(--accent)] text-black' : 'bg-white/5'}`}>{p}</button>
                ))}
                <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="rounded px-3 py-1 bg-white/5">Next</button>
              </div>
            </div>
          </section>

          {showForm ? <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Create / update payment</h2>
            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-[color:var(--muted)]">Booking ID</label>
                <input value={formState.bookingId} onChange={(e) => handleChange("bookingId", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div>
                <label className="text-sm text-[color:var(--muted)]">Transaction ID (kosongkan = otomatis)</label>
                <input value={formState.transactionId} onChange={(e) => handleChange("transactionId", e.target.value)} placeholder="Auto: CASH-..." className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Amount</label>
                  <input type="number" value={formState.amount} onChange={(e) => handleChange("amount", Number(e.target.value))} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Status</label>
                  <select value={formState.status} onChange={(e) => handleChange("status", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none">
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Payment method</label>
                  <select value={formState.paymentMethod} onChange={(e) => handleChange("paymentMethod", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none">
                    {paymentMethods.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Provider</label>
                  <select value={formState.provider} onChange={(e) => handleChange("provider", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none">
                    {providers.map((provider) => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Paid at</label>
                  <input type="date" value={formState.paidAt} onChange={(e) => handleChange("paidAt", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-sm text-[color:var(--muted)]">Expired at</label>
                  <input type="date" value={formState.expiredAt} onChange={(e) => handleChange("expiredAt", e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2 px-6 py-3 disabled:opacity-60">
                  {loading ? <Spinner size={18} /> : null}
                  {editing ? "Update payment" : "Create payment"}
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
      <LoadingOverlay show={loading} label={editing ? "Menyimpan payment..." : "Memuat payment..."} />
    </>
  );

  return useMain ? <main className="flex-1 px-6 py-16 lg:px-8">{wrapped}</main> : wrapped;
}

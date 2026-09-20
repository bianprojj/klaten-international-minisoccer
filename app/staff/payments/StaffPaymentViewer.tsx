"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetch-json";

interface StaffPaymentItem {
  id: string;
  transactionId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  provider: string;
  booking: {
    id: string;
    customerName: string;
    bookingDate: string;
  };
}

export default function StaffPaymentViewer({ adminName, useMain = true }: { adminName: string; useMain?: boolean }) {
  const [payments, setPayments] = useState<StaffPaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editAmount, setEditAmount] = useState<number>(0);

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
      const data: { data?: StaffPaymentItem[]; page?: number; totalPages?: number; message?: unknown } = raw;
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

  const handleUpdatePayment = async (id: string) => {
    try {
      const { res, data: __body } = await fetchJson(`/api/admin/payments/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: editStatus, amount: editAmount }) });
      const data = __body;
      if (!res.ok) throw new Error(String(data.message ?? "") || "Gagal update");
      setEditingId(null);
      await fetchPayments(page, query, filterStatus);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm("Hapus pembayaran ini?")) return;
    try {
      const { res, data: __body } = await fetchJson(`/api/admin/payments/${id}`, { method: "DELETE" });
      const data = __body;
      if (!res.ok) throw new Error(String(data.message ?? "") || "Gagal hapus");
      await fetchPayments(page, query, filterStatus);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const content = (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8" id="staff-payments">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--accent-strong)]">Staff payment viewer</p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Payments</h1>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                Read-only payment history for staff review.
              </p>
            </div>
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-[color:var(--muted)]">Signed in as {adminName}</div>
          </div>
        </div>

        <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-white sm:text-2xl">Payment records</h2>
            <div className="flex items-center gap-2">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search transaction" className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white">
                <option value="">All</option>
                <option value="pending">pending</option>
                <option value="success">success</option>
                <option value="failed">failed</option>
              </select>
              <button onClick={handleSearch} className="btn-secondary px-3 py-1">Filter</button>
            </div>
          </div>
          {error ? (
            <div className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
          ) : null}
          <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-[color:var(--background)]">
            <table className="w-full min-w-[860px] divide-y divide-white/10 text-left text-sm">
              <thead className="bg-[color:rgba(255,255,255,0.03)] text-[color:var(--muted)]">
                <tr>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {payments.map((payment) => (
                  <tr key={payment.id} className="bg-[color:rgba(255,255,255,0.02)]">
                    <td className="px-4 py-3 text-white">{payment.transactionId}</td>
                    <td className="px-4 py-3">{payment.booking.customerName}</td>
                    <td className="px-4 py-3">Rp {Number(payment.amount).toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3">
                      {editingId === payment.id ? (
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="rounded border border-white/10 bg-[color:var(--background)] px-2 py-1 text-sm text-white">
                          <option value="pending">pending</option>
                          <option value="success">success</option>
                          <option value="failed">failed</option>
                          <option value="refunded">refunded</option>
                        </select>
                      ) : (
                        payment.status
                      )}
                    </td>
                    <td className="px-4 py-3">{payment.paymentMethod}</td>
                    <td className="px-4 py-3">{payment.provider}</td>
                    <td className="px-4 py-3">
                      {editingId === payment.id ? (
                        <>
                          <button onClick={() => handleUpdatePayment(payment.id)} className="rounded bg-emerald-600 px-3 py-1 text-sm text-white">Simpan</button>
                          <button onClick={() => setEditingId(null)} className="ml-2 rounded bg-gray-600 px-3 py-1 text-sm text-white">Batal</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(payment.id); setEditStatus(payment.status); setEditAmount(payment.amount); }} className="rounded bg-blue-600 px-3 py-1 text-sm text-white">Edit</button>
                          <button onClick={() => handleDeletePayment(payment.id)} className="ml-2 rounded bg-rose-600 px-3 py-1 text-sm text-white">Hapus</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-sm text-[color:var(--muted)]">
                      {loading ? "Loading payments..." : "No payments found."}
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

  return useMain ? <main className="flex-1 px-6 py-16 lg:px-8">{content}</main> : content;
}

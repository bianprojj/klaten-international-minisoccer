"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetch-json";
import { TableResponsive } from "@/components/ui/table-responsive";
import { EditableBadge, InlineEditCell } from "@/components/ui/inline-edit";

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

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", variant: "warning" as const },
  { value: "success", label: "Success", variant: "success" as const },
  { value: "failed", label: "Failed", variant: "danger" as const },
  { value: "refunded", label: "Refunded", variant: "info" as const },
];

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
      params.set("limit", String(25));
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

  const columns = [
    {
      key: "transactionId",
      header: "Transaksi",
      render: (p: StaffPaymentItem) => (
        <span className="font-mono text-xs text-muted" title={p.transactionId}>
          {p.transactionId.slice(0, 12)}...
        </span>
      ),
      className: "w-36",
    },
    {
      key: "customer",
      header: "Pelanggan",
      render: (p: StaffPaymentItem) => (
        <div className="flex flex-col">
          <span className="font-medium">{p.booking.customerName}</span>
          <span className="text-xs text-muted">{p.booking.bookingDate.split("T")[0]}</span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Jumlah",
      render: (p: StaffPaymentItem) => (
        editingId === p.id ? (
          <InlineEditCell
            value={String(editAmount)}
            type="number"
            onSave={(v) => setEditAmount(Number(v))}
            onCancel={() => { setEditAmount(p.amount); setEditingId(null); }}
            className="w-28"
          />
        ) : (
          <span className="font-semibold">Rp {Number(p.amount).toLocaleString("id-ID")}</span>
        )
      ),
      className: "text-right w-36",
    },
    {
      key: "status",
      header: "Status",
      render: (p: StaffPaymentItem) => (
        editingId === p.id ? (
          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            onBlur={() => handleUpdatePayment(p.id)}
            className="rounded border border-white/10 bg-[color:var(--background)] px-2 py-1 text-sm text-white w-28"
          >
            <option value="pending">pending</option>
            <option value="success">success</option>
            <option value="failed">failed</option>
            <option value="refunded">refunded</option>
          </select>
        ) : (
          <EditableBadge
            value={p.status}
            options={[
              { value: "pending", label: "Pending", variant: "warning" },
              { value: "success", label: "Success", variant: "success" },
              { value: "failed", label: "Failed", variant: "danger" },
              { value: "refunded", label: "Refunded", variant: "info" },
            ]}
            onSave={(newStatus) => { setEditStatus(newStatus); setEditingId(p.id); handleUpdatePayment(p.id); }}
            className="w-auto"
          />
        )
      ),
      className: "w-32",
    },
    {
      key: "method",
      header: "Metode",
      render: (p: StaffPaymentItem) => <span>{p.paymentMethod}</span>,
      className: "w-24",
    },
    {
      key: "provider",
      header: "Provider",
      render: (p: StaffPaymentItem) => <span className="text-muted text-sm">{p.provider}</span>,
      className: "w-24",
      hideOnMobile: true,
    },
    {
      key: "actions",
      header: "Aksi",
      render: (p: StaffPaymentItem) => (
        editingId === p.id ? (
          <div className="flex items-center gap-2">
            <button onClick={() => handleUpdatePayment(p.id)} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Simpan</button>
            <button onClick={() => setEditingId(null)} className="ml-1 rounded bg-gray-600 px-2 py-1 text-xs text-white">Batal</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditingId(p.id); setEditStatus(p.status); setEditAmount(p.amount); }} className="rounded bg-blue-600 px-2 py-1 text-xs text-white">Edit</button>
            <button onClick={() => handleDeletePayment(p.id)} className="ml-1 rounded bg-rose-600 px-2 py-1 text-xs text-white">Hapus</button>
          </div>
        )
      ),
      className: "w-28 text-center",
      hideOnMobile: true,
    },
  ];

  const cardRender = (p: StaffPaymentItem) => (
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-medium">{p.booking.customerName}</span>
          <span className="ml-2 text-xs text-muted">{p.booking.bookingDate.split("T")[0]}</span>
        </div>
        <EditableBadge
          value={p.status}
          options={[
            { value: "pending", label: "Pending", variant: "warning" },
            { value: "success", label: "Success", variant: "success" },
            { value: "failed", label: "Failed", variant: "danger" },
            { value: "refunded", label: "Refunded", variant: "info" },
          ]}
          onSave={(s) => { setEditingId(p.id); setEditStatus(s); handleUpdatePayment(p.id); }}
        />
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted">Transaksi: {p.transactionId.slice(0, 12)}...</span>
        <span className="font-semibold">Rp {Number(p.amount).toLocaleString("id-ID")}</span>
      </div>
      <div className="flex justify-between text-sm text-muted">
        <span>{p.paymentMethod}</span>
        <span>{p.provider}</span>
      </div>
      <div className="pt-2 border-t border-border flex justify-between">
        <button onClick={() => { setEditingId(p.id); setEditStatus(p.status); setEditAmount(p.amount); }} className="text-xs text-blue-400 hover:underline">Edit</button>
        <button onClick={() => handleDeletePayment(p.id)} className="text-xs text-rose-400 hover:underline">Hapus</button>
      </div>
    </div>
  );

  const content = (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8" id="staff-payments">
      <div className="space-y-6">
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
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search transaction"
                className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-3xl border border-white/10 bg-[color:var(--background)] px-3 py-2 text-sm text-white"
              >
                <option value="">All</option>
                <option value="pending">pending</option>
                <option value="success">success</option>
                <option value="failed">failed</option>
                <option value="refunded">refunded</option>
              </select>
              <button onClick={handleSearch} className="btn-secondary px-3 py-1">Filter</button>
            </div>
          </div>
          {error ? (
            <div className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>
          ) : null}

          <TableResponsive
            data={payments}
            columns={columns}
            keyExtractor={(p) => p.id}
            cardRender={cardRender}
            emptyMessage={loading ? "Loading payments..." : "No payments found."}
          />

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <select
              value={String(25)}
              onChange={(e) => { setPage(1); fetchPayments(1, query, filterStatus); }}
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

  return useMain ? <main className="flex-1 px-6 py-16 lg:px-8">{content}</main> : content;
}
"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetch-json";
import { LoadingOverlay } from "@/components/ui/spinner";
import { Modal } from "@/components/ui/modal";

type Resource = "invoices" | "reviews" | "users" | "settings" | "audit-logs" | "features" | "gallery";

const labels: Record<Resource, string> = {
  invoices: "Invoices",
  reviews: "Reviews",
  users: "Admin users",
  settings: "Settings",
  "audit-logs": "Audit logs",
  features: "Venue Features",
  gallery: "Venue Gallery",
};

export default function AdminResourceManager({ resource, canManage, adminName }: { resource: Resource; canManage: boolean; adminName: string }) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const endpoint = `/api/admin/${resource}`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { res: response, data: body } = await fetchJson(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error(String(body.message ?? "") || `Unable to load data (${response.status}).`);
      setRows(Array.isArray(body.data) ? body.data : []);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load data."); }
    finally { setLoading(false); }
  }, [endpoint]);

  useEffect(() => { void load(); }, [load]);

  async function create() {
    setMessage("");
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (resource === "reviews") payload.rating = Number(form.rating || 5);
      if (resource === "invoices") { payload.subtotal = Number(form.subtotal || 0); payload.tax = Number(form.tax || 0); payload.discount = Number(form.discount || 0); }
      if (resource === "features") { payload.sortOrder = Number(form.sortOrder || 0); payload.isActive = form.isActive !== "false"; }
      if (resource === "gallery") { payload.sortOrder = Number(form.sortOrder || 0); payload.isActive = form.isActive !== "false"; }
      const { res: response, data: __body } = await fetchJson(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = __body;
      if (!response.ok) throw new Error(String(body.message ?? "") || "Unable to create record.");
      setForm({}); setMessage("Record created successfully."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create record."); }
    finally { setBusy(false); }
  }

  async function remove(id: string) {
    if (!confirm("Delete this record?")) return;
    setBusy(true);
    try {
      const { res: response, data: __body } = await fetchJson(`${endpoint}/${id}`, { method: "DELETE" });
      const body = __body;
      setMessage(String(body.message ?? "") || (response.ok ? "Deleted." : "Unable to delete record."));
      if (response.ok) await load();
    } finally { setBusy(false); }
  }

  async function openEditModal(row: Record<string, unknown>) {
    if (!canManage || resource === "audit-logs") return;
    const id = String(row.id);
    const initial: Record<string, string> = { id };
    if (resource === "reviews") {
      initial.customerName = String(row.customerName ?? "");
      initial.comment = String(row.comment ?? "");
      initial.rating = String(row.rating ?? "5");
    } else if (resource === "users") {
      initial.name = String(row.name ?? "");
      initial.email = String(row.email ?? "");
      initial.role = String(row.role ?? "staff");
    } else if (resource === "settings") {
      initial.key = String(row.key ?? "");
      initial.value = String(row.value ?? "");
      initial.description = String(row.description ?? "");
    } else if (resource === "features") {
      initial.name = String(row.name ?? "");
      initial.description = String(row.description ?? "");
      initial.imageUrl = String(row.imageUrl ?? "");
      initial.sortOrder = String(row.sortOrder ?? "0");
    } else if (resource === "gallery") {
      initial.title = String(row.title ?? "");
      initial.imageUrl = String(row.imageUrl ?? "");
      initial.sortOrder = String(row.sortOrder ?? "0");
    } else if (resource === "invoices") {
      initial.status = String(row.status ?? "issued");
      initial.total = String(row.total ?? "0");
    }
    setEditingId(id);
    setEditForm(initial);
    setModalOpen(true);
  }

  async function saveEditModal() {
    if (!editingId) return;
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { ...editForm };
      if (resource === "reviews") payload.rating = Number(editForm.rating || 5);
      if (resource === "invoices") { payload.subtotal = Number(editForm.subtotal || 0); payload.tax = Number(editForm.tax || 0); payload.discount = Number(editForm.discount || 0); }
      if (resource === "features" || resource === "gallery") {
        payload.sortOrder = Number(editForm.sortOrder || 0);
        payload.isActive = editForm.isActive !== "false";
      }
      const { res: response, data: __body } = await fetchJson(`${endpoint}/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const body = __body;
      if (!response.ok) throw new Error(String(body.message ?? "") || "Unable to update record.");
      setMessage(String(body.message ?? "") || (response.ok ? "Updated." : "Unable to update record."));
      if (response.ok) { setModalOpen(false); setEditingId(null); await load(); }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update record."); }
    finally { setBusy(false); }
  }

  const title = labels[resource];
  return (
    <>
      <section className="mx-auto max-w-7xl space-y-6 overflow-x-clip px-4 sm:px-6 lg:px-8">
    <LoadingOverlay show={busy || loading} label={busy ? "Memproses..." : "Memuat data..."} />
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Admin workspace</p><h1 className="mt-2 text-balance text-2xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-3xl">{title}</h1></div>
      <button onClick={() => void load()} className="btn-secondary">Refresh</button>
    </div>
    {message ? <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-amber-200">{message}</p> : null}
    {canManage && resource !== "audit-logs" ? <div className="glass-panel rounded-2xl p-5"><h2 className="text-lg font-semibold text-white">Create {title.slice(0, -1)}</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{resource === "reviews" ? <><input className="input" placeholder="Customer name" value={form.customerName || ""} onChange={e => setForm({ ...form, customerName: e.target.value })}/><input className="input" placeholder="Rating 1-5" value={form.rating || ""} onChange={e => setForm({ ...form, rating: e.target.value })}/><input className="input md:col-span-2" placeholder="Comment" value={form.comment || ""} onChange={e => setForm({ ...form, comment: e.target.value })}/><input className="input" placeholder="Booking ID (optional)" value={form.bookingId || ""} onChange={e => setForm({ ...form, bookingId: e.target.value })}/></> : resource === "users" ? <><input className="input" placeholder="Name" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })}/><input className="input" placeholder="Email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })}/><input className="input" placeholder="Password" type="password" value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })}/><select className="input" value={form.role || "staff"} onChange={e => setForm({ ...form, role: e.target.value })}><option value="staff">Staff</option><option value="manager">Manager</option><option value="super_admin">Superadmin</option></select></> : resource === "settings" ? <><input className="input" placeholder="Key" value={form.key || ""} onChange={e => setForm({ ...form, key: e.target.value })}/><input className="input" placeholder="Value" value={form.value || ""} onChange={e => setForm({ ...form, value: e.target.value })}/><input className="input" placeholder="Description" value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })}/></> : resource === "features" ? <><input className="input" placeholder="Name" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })}/><input className="input md:col-span-2" placeholder="Description" value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })}/><input className="input" placeholder="Image URL" value={form.imageUrl || ""} onChange={e => setForm({ ...form, imageUrl: e.target.value })}/><input className="input" placeholder="Sort order" value={form.sortOrder || ""} onChange={e => setForm({ ...form, sortOrder: e.target.value })}/></> : resource === "gallery" ? <><input className="input" placeholder="Title" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })}/><input className="input md:col-span-2" placeholder="Image URL" value={form.imageUrl || ""} onChange={e => setForm({ ...form, imageUrl: e.target.value })}/><input className="input" placeholder="Sort order" value={form.sortOrder || ""} onChange={e => setForm({ ...form, sortOrder: e.target.value })}/></> : <><input className="input" placeholder="Booking ID" value={form.bookingId || ""} onChange={e => setForm({ ...form, bookingId: e.target.value })}/><input className="input" placeholder="Payment ID" value={form.paymentId || ""} onChange={e => setForm({ ...form, paymentId: e.target.value })}/><input className="input" placeholder="Subtotal" value={form.subtotal || ""} onChange={e => setForm({ ...form, subtotal: e.target.value })}/></>}<button className="btn-primary md:col-span-3" onClick={() => void create()}>Create</button></div></div> : null}
    <div className="overflow-x-auto glass-panel rounded-2xl"><table className="w-full text-left text-sm"><thead className="bg-white/5 text-[color:var(--muted)]"><tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Details</th>{canManage && resource !== "audit-logs" ? <th className="px-4 py-3">Action</th> : null}</tr></thead><tbody>{loading ? <tr><td className="px-4 py-6 text-[color:var(--muted)]" colSpan={3}>Loading...</td></tr> : rows.map((row, index) => <tr key={String(row.id || index)} className="border-t border-white/10"><td className="max-w-xs px-4 py-3 font-mono text-xs text-[color:var(--muted)]">{String(row.id || row.key || index + 1)}</td><td className="px-4 py-3 text-white"><div className="grid gap-1 md:grid-cols-2">{Object.entries(row).filter(([key]) => !["id", "updatedAt"].includes(key)).slice(0, 8).map(([key, value]) => <span key={key}><b className="text-[color:var(--muted)]">{key}: </b>{typeof value === "object" ? JSON.stringify(value) : String(value ?? "-")}</span>)}</div></td>{canManage && resource !== "audit-logs" ? <td className="space-x-3 px-4 py-3"><button className="text-sky-300 hover:text-sky-200" onClick={() => void openEditModal(row)}>Edit</button><button className="text-rose-300 hover:text-rose-200" onClick={() => void remove(String(row.id))}>Delete</button></td> : null}</tr>)}</tbody></table></div>
      </section>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Edit ${title.slice(0, -1)}`}>
        <div className="space-y-4">
          {resource === "reviews" ? (
            <>
              <div><label className="text-sm text-[color:var(--muted)]">Customer name</label><input className="input mt-1" value={editForm.customerName || ""} onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })} /></div>
              <div><label className="text-sm text-[color:var(--muted)]">Comment</label><input className="input mt-1" value={editForm.comment || ""} onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })} /></div>
              <div><label className="text-sm text-[color:var(--muted)]">Rating 1-5</label><input className="input mt-1" value={editForm.rating || ""} onChange={(e) => setEditForm({ ...editForm, rating: e.target.value })} /></div>
            </>
          ) : resource === "users" ? (
            <>
              <div><label className="text-sm text-[color:var(--muted)]">Name</label><input className="input mt-1" value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div><label className="text-sm text-[color:var(--muted)]">Email</label><input className="input mt-1" value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
              <div><label className="text-sm text-[color:var(--muted)]">Role</label><select className="input mt-1" value={editForm.role || "staff"} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}><option value="staff">Staff</option><option value="manager">Manager</option><option value="super_admin">Superadmin</option></select></div>
              <div><label className="text-sm text-[color:var(--muted)]">Password (leave empty to keep)</label><input className="input mt-1" type="password" value={editForm.password || ""} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} /></div>
              <div><label className="text-sm text-[color:var(--muted)]">Active</label><select className="input mt-1" value={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value })}><option value="true">Active</option><option value="false">Inactive</option></select></div>
            </>
          ) : resource === "settings" ? (
            <>
              <div><label className="text-sm text-[color:var(--muted)]">Key</label><input className="input mt-1" value={editForm.key || ""} onChange={(e) => setEditForm({ ...editForm, key: e.target.value })} /></div>
              <div><label className="text-sm text-[color:var(--muted)]">Value</label><input className="input mt-1" value={editForm.value || ""} onChange={(e) => setEditForm({ ...editForm, value: e.target.value })} /></div>
              <div><label className="text-sm text-[color:var(--muted)]">Description</label><input className="input mt-1" value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
            </>
          ) : resource === "features" ? (
            <>
              <div><label className="text-sm text-[color:var(--muted)]">Name</label><input className="input mt-1" value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div><label className="text-sm text-[color:var(--muted)]">Description</label><input className="input mt-1" value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
              <div><label className="text-sm text-[color:var(--muted)]">Image URL</label><input className="input mt-1" value={editForm.imageUrl || ""} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} /></div>
              <div><label className="text-sm text-[color:var(--muted)]">Sort order</label><input className="input mt-1" value={editForm.sortOrder || ""} onChange={(e) => setEditForm({ ...editForm, sortOrder: e.target.value })} /></div>
              <div><label className="text-sm text-[color:var(--muted)]">Active</label><select className="input mt-1" value={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value })}><option value="true">Active</option><option value="false">Inactive</option></select></div>
            </>
          ) : resource === "gallery" ? (
            <>
              <div><label className="text-sm text-[color:var(--muted)]">Title</label><input className="input mt-1" value={editForm.title || ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} /></div>
              <div><label className="text-sm text-[color:var(--muted)]">Image URL</label><input className="input mt-1" value={editForm.imageUrl || ""} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} /></div>
              <div><label className="text-sm text-[color:var(--muted)]">Sort order</label><input className="input mt-1" value={editForm.sortOrder || ""} onChange={(e) => setEditForm({ ...editForm, sortOrder: e.target.value })} /></div>
              <div><label className="text-sm text-[color:var(--muted)]">Active</label><select className="input mt-1" value={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value })}><option value="true">Active</option><option value="false">Inactive</option></select></div>
            </>
          ) : resource === "invoices" ? (
            <>
              <div><label className="text-sm text-[color:var(--muted)]">Status</label><select className="input mt-1" value={editForm.status || "issued"} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}><option value="issued">Issued</option><option value="paid">Paid</option><option value="cancelled">Cancelled</option><option value="refunded">Refunded</option></select></div>
              <div><label className="text-sm text-[color:var(--muted)]">Total</label><input className="input mt-1" value={editForm.total || ""} onChange={(e) => setEditForm({ ...editForm, total: e.target.value })} /></div>
            </>
          ) : null}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={() => void saveEditModal()} disabled={busy} className="btn-primary">Save changes</button>
          </div>
        </div>
      </Modal>
    </>
  );
}


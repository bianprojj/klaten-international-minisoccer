"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetch-json";
import { LoadingOverlay } from "@/components/ui/spinner";

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

  async function update(row: Record<string, unknown>) {
    if (!canManage || resource === "audit-logs") return;
    setBusy(true);
    try {
    const id = String(row.id);
    const payload: Record<string, unknown> = {};
    if (resource === "reviews") {
      payload.customerName = window.prompt("Customer name", String(row.customerName ?? "")) ?? String(row.customerName ?? "");
      payload.comment = window.prompt("Comment", String(row.comment ?? "")) ?? String(row.comment ?? "");
      payload.rating = Number(window.prompt("Rating 1-5", String(row.rating ?? 5)) ?? row.rating ?? 5);
    } else if (resource === "users") {
      payload.name = window.prompt("Name", String(row.name ?? "")) ?? String(row.name ?? "");
      payload.email = window.prompt("Email", String(row.email ?? "")) ?? String(row.email ?? "");
      payload.role = window.prompt("Role: staff, manager, super_admin", String(row.role ?? "staff")) ?? String(row.role ?? "staff");
      payload.isActive = window.confirm("Keep this admin active?");
      const newPassword = window.prompt("Password baru (min 8 karakter, huruf besar+kecil, angka, simbol). Kosongkan jika tidak ingin mengganti.");
      if (newPassword) { payload.password = newPassword; }
    } else if (resource === "settings") {
      payload.key = window.prompt("Setting key", String(row.key ?? "")) ?? String(row.key ?? "");
      payload.value = window.prompt("Setting value", String(row.value ?? "")) ?? String(row.value ?? "");
      payload.description = window.prompt("Description", String(row.description ?? "")) ?? String(row.description ?? "");
    } else if (resource === "features") {
      payload.name = window.prompt("Feature name", String(row.name ?? "")) ?? String(row.name ?? "");
      payload.description = window.prompt("Description", String(row.description ?? "")) ?? String(row.description ?? "");
      payload.imageUrl = window.prompt("Image URL", String(row.imageUrl ?? "")) ?? String(row.imageUrl ?? "");
      payload.sortOrder = Number(window.prompt("Sort order", String(row.sortOrder ?? 0)) ?? row.sortOrder ?? 0);
      payload.isActive = window.confirm("Keep this feature active?");
    } else if (resource === "gallery") {
      payload.title = window.prompt("Title", String(row.title ?? "")) ?? String(row.title ?? "");
      payload.imageUrl = window.prompt("Image URL", String(row.imageUrl ?? "")) ?? String(row.imageUrl ?? "");
      payload.sortOrder = Number(window.prompt("Sort order", String(row.sortOrder ?? 0)) ?? row.sortOrder ?? 0);
      payload.isActive = window.confirm("Keep this gallery item active?");
    } else {
      payload.status = window.prompt("Invoice status: issued, paid, cancelled, refunded", String(row.status ?? "issued")) ?? String(row.status ?? "issued");
      payload.total = Number(window.prompt("Total", String(row.total ?? 0)) ?? row.total ?? 0);
    }
    const { res: response, data: __body } = await fetchJson(`${endpoint}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const body = __body;
    setMessage(String(body.message ?? "") || (response.ok ? "Updated." : "Unable to update record."));
    if (response.ok) await load();
    } finally { setBusy(false); }
  }

  const title = labels[resource];
  return <section className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
    <LoadingOverlay show={busy || loading} label={busy ? "Memproses..." : "Memuat data..."} />
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Admin workspace</p><h1 className="mt-2 text-balance text-2xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-3xl">{title}</h1><p className="mt-2 text-sm text-[color:var(--muted)]">Signed in as {adminName}</p></div>
      <button onClick={() => void load()} className="btn-secondary">Refresh</button>
    </div>
    {message ? <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-amber-200">{message}</p> : null}
    {canManage && resource !== "audit-logs" ? <div className="glass-panel rounded-2xl p-5"><h2 className="text-lg font-semibold text-white">Create {title.slice(0, -1)}</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{resource === "reviews" ? <><input className="input" placeholder="Customer name" value={form.customerName || ""} onChange={e => setForm({ ...form, customerName: e.target.value })}/><input className="input" placeholder="Rating 1-5" value={form.rating || ""} onChange={e => setForm({ ...form, rating: e.target.value })}/><input className="input md:col-span-2" placeholder="Comment" value={form.comment || ""} onChange={e => setForm({ ...form, comment: e.target.value })}/><input className="input" placeholder="Booking ID (optional)" value={form.bookingId || ""} onChange={e => setForm({ ...form, bookingId: e.target.value })}/></> : resource === "users" ? <><input className="input" placeholder="Name" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })}/><input className="input" placeholder="Email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })}/><input className="input" placeholder="Password" type="password" value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })}/><select className="input" value={form.role || "staff"} onChange={e => setForm({ ...form, role: e.target.value })}><option value="staff">Staff</option><option value="manager">Manager</option><option value="super_admin">Superadmin</option></select></> : resource === "settings" ? <><input className="input" placeholder="Key" value={form.key || ""} onChange={e => setForm({ ...form, key: e.target.value })}/><input className="input" placeholder="Value" value={form.value || ""} onChange={e => setForm({ ...form, value: e.target.value })}/><input className="input" placeholder="Description" value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })}/></> : resource === "features" ? <><input className="input" placeholder="Name" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })}/><input className="input md:col-span-2" placeholder="Description" value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })}/><input className="input" placeholder="Image URL" value={form.imageUrl || ""} onChange={e => setForm({ ...form, imageUrl: e.target.value })}/><input className="input" placeholder="Sort order" value={form.sortOrder || ""} onChange={e => setForm({ ...form, sortOrder: e.target.value })}/></> : resource === "gallery" ? <><input className="input" placeholder="Title" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })}/><input className="input md:col-span-2" placeholder="Image URL" value={form.imageUrl || ""} onChange={e => setForm({ ...form, imageUrl: e.target.value })}/><input className="input" placeholder="Sort order" value={form.sortOrder || ""} onChange={e => setForm({ ...form, sortOrder: e.target.value })}/></> : <><input className="input" placeholder="Booking ID" value={form.bookingId || ""} onChange={e => setForm({ ...form, bookingId: e.target.value })}/><input className="input" placeholder="Payment ID" value={form.paymentId || ""} onChange={e => setForm({ ...form, paymentId: e.target.value })}/><input className="input" placeholder="Subtotal" value={form.subtotal || ""} onChange={e => setForm({ ...form, subtotal: e.target.value })}/></>}<button className="btn-primary md:col-span-3" onClick={() => void create()}>Create</button></div></div> : null}
    <div className="overflow-x-auto glass-panel rounded-2xl"><table className="w-full text-left text-sm"><thead className="bg-white/5 text-[color:var(--muted)]"><tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Details</th>{canManage && resource !== "audit-logs" ? <th className="px-4 py-3">Action</th> : null}</tr></thead><tbody>{loading ? <tr><td className="px-4 py-6 text-[color:var(--muted)]" colSpan={3}>Loading...</td></tr> : rows.map((row, index) => <tr key={String(row.id || index)} className="border-t border-white/10"><td className="max-w-xs px-4 py-3 font-mono text-xs text-[color:var(--muted)]">{String(row.id || row.key || index + 1)}</td><td className="px-4 py-3 text-white"><div className="grid gap-1 md:grid-cols-2">{Object.entries(row).filter(([key]) => !["id", "updatedAt"].includes(key)).slice(0, 8).map(([key, value]) => <span key={key}><b className="text-[color:var(--muted)]">{key}: </b>{typeof value === "object" ? JSON.stringify(value) : String(value ?? "-")}</span>)}</div></td>{canManage && resource !== "audit-logs" ? <td className="space-x-3 px-4 py-3"><button className="text-sky-300 hover:text-sky-200" onClick={() => void update(row)}>Edit</button><button className="text-rose-300 hover:text-rose-200" onClick={() => void remove(String(row.id))}>Delete</button></td> : null}</tr>)}</tbody></table></div>
  </section>;
}


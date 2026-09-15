"use client";

import { fetchJson } from "@/lib/fetch-json";
import Image from "next/image";
import { DragEvent, useEffect, useState } from "react";
type GalleryItem = { id: string; title: string; imageUrl: string; imagePublicId?: string | null; sortOrder: number; isActive: boolean };
export default function VenueGalleryManager() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [form, setForm] = useState({ title: "", imageUrl: "", imagePublicId: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  async function load() { const { res: r, data: __b } = await fetchJson("/api/admin/gallery", { cache: "no-store" }); const b = __b; if (r.ok) setItems(b.data ?? []); else setMessage(String(b.message ?? "") ?? "Gagal memuat gallery."); }
  useEffect(() => { void load(); }, []);
  async function upload(file: File) {
    setUploading(true); setMessage("");
    try { const d = new FormData(); d.append("file", file); const { res: r, data: __b } = await fetchJson("/api/cloudinary/upload-file", { method: "POST", body: d }); const b = __b; if (!r.ok) throw new Error(String(b.message ?? "Request failed")); setForm(c => ({ ...c, imageUrl: b.data.secure_url ?? "", imagePublicId: b.data.public_id ?? "" })); setMessage("Gambar berhasil diunggah."); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Upload gagal."); } finally { setUploading(false); }
  }
  function drop(e: DragEvent<HTMLLabelElement>) { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void upload(f); }
  async function save() { const ep = editingId ? `/api/admin/gallery/${editingId}` : "/api/admin/gallery"; const { res: r, data: __b } = await fetchJson(ep, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const b = __b; setMessage(b.message ?? (r.ok ? "Gallery tersimpan." : "Gagal menyimpan.")); if (r.ok) { setForm({ title: "", imageUrl: "", imagePublicId: "" }); setEditingId(null); await load(); } }
  function edit(item: GalleryItem) { setEditingId(item.id); setForm({ title: item.title, imageUrl: item.imageUrl, imagePublicId: item.imagePublicId ?? "" }); setMessage("Mode edit aktif."); }
  function cancelEdit() { setEditingId(null); setForm({ title: "", imageUrl: "", imagePublicId: "" }); setMessage(""); }
  async function update(id: string, v: Partial<GalleryItem>) { await fetch(`/api/admin/gallery/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) }); await load(); }
  async function remove(id: string) { if (!confirm("Hapus gambar ini?")) return; await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" }); await load(); }
  async function reorder(target: string) { if (!dragged || dragged === target) return; const o = [...items]; const from = o.findIndex(i => i.id === dragged); const to = o.findIndex(i => i.id === target); const [it] = o.splice(from, 1); o.splice(to, 0, it); setItems(o); await Promise.all(o.map((it, idx) => update(it.id, { sortOrder: idx }))); setDragged(null); }
  return <div className="mx-auto max-w-7xl space-y-6"><section className="glass-panel rounded-2xl p-6 sm:p-8"><div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Venue gallery</p><h2 className="mt-2 text-balance text-2xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-3xl">Kelola galeri lapangan</h2><p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">Data disimpan di Supabase, gambar di Cloudinary. Drag untuk urutkan.</p></div><span className="w-fit rounded-full bg-white/10 px-4 py-2 text-sm text-[color:var(--muted)]">{items.length} gambar</span></div>
    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.2fr] lg:items-stretch"><input className="min-w-0 rounded-2xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none" placeholder="Judul gambar" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/><label onDragOver={e => e.preventDefault()} onDrop={drop} className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/20 bg-[color:var(--background)] p-4 text-center text-sm text-[color:var(--muted)] transition hover:border-emerald-400/50 hover:bg-white/5"><span>{uploading ? "Mengunggah..." : "Drag & drop gambar di sini atau klik untuk memilih"}</span><input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) void upload(f); }}/></label>{form.imageUrl ? <Image src={form.imageUrl} alt="Preview" width={400} height={225} unoptimized className="h-40 w-full rounded-3xl object-cover lg:col-span-2"/> : null}<div className="flex flex-wrap gap-3 lg:col-span-2"><button className="btn-primary" disabled={uploading} onClick={() => void save()}>{editingId ? "Simpan perubahan" : "Tambah ke galeri"}</button>{editingId ? <button className="btn-secondary" onClick={cancelEdit}>Batal edit</button> : null}</div></div>
    {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(item => <article key={item.id} draggable onDragStart={() => setDragged(item.id)} onDragOver={e => e.preventDefault()} onDrop={() => void reorder(item.id)} className="overflow-hidden rounded-3xl border border-white/10 bg-[color:var(--background)]"><Image src={item.imageUrl} alt={item.title} width={400} height={250} unoptimized className="h-48 w-full object-cover"/><div className="p-4"><h3 className="font-semibold text-[color:var(--foreground)]">{item.title}</h3><div className="mt-3 flex flex-wrap gap-3"><button className="text-sm text-sky-300" onClick={() => edit(item)}>Edit</button><button className="text-sm text-sky-300" onClick={() => void update(item.id, { isActive: !item.isActive })}>{item.isActive ? "Nonaktifkan" : "Aktifkan"}</button><button className="text-sm text-rose-300" onClick={() => void remove(item.id)}>Hapus</button></div></div></article>)}</div>
  </section></div>;
}

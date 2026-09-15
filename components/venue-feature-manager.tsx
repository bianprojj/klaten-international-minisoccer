"use client";

import { fetchJson } from "@/lib/fetch-json";

import Image from "next/image";
import { DragEvent, useEffect, useState } from "react";

type Feature = { id: string; name: string; description: string; imageUrl: string; imagePublicId?: string | null; sortOrder: number; isActive: boolean };

export default function VenueFeatureManager() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "", imagePublicId: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragged, setDragged] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() { const { res: response, data: __body } = await fetchJson("/api/admin/features", { cache: "no-store" }); const body = __body; if (response.ok) setFeatures(body.data ?? []); else setMessage(String(body.message ?? "") ?? "Unable to load features."); }
  useEffect(() => { void load(); }, []);

  async function upload(file: File) {
    setUploading(true); setMessage("");
    try { const data = new FormData(); data.append("file", file); const { res: response, data: __body } = await fetchJson("/api/cloudinary/upload-file", { method: "POST", body: data }); const body = __body; if (!response.ok) throw new Error(String(body.message ?? "Request failed")); setForm(current => ({ ...current, imageUrl: body.data.secure_url ?? "", imagePublicId: body.data.public_id ?? "" })); setMessage("Gambar berhasil diunggah ke Cloudinary."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Upload gagal."); }
    finally { setUploading(false); }
  }

  function drop(event: DragEvent<HTMLLabelElement>) { event.preventDefault(); const file = event.dataTransfer.files?.[0]; if (file) void upload(file); }
  async function save() { const endpoint = editingId ? `/api/admin/features/${editingId}` : "/api/admin/features"; const { res: response, data: __body } = await fetchJson(endpoint, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); const body = __body; setMessage(String(body.message ?? "") ?? (response.ok ? "Fasilitas tersimpan." : "Gagal menyimpan.")); if (response.ok) { setForm({ name: "", description: "", imageUrl: "", imagePublicId: "" }); setEditingId(null); await load(); } }
  function edit(feature: Feature) { setEditingId(feature.id); setForm({ name: feature.name, description: feature.description, imageUrl: feature.imageUrl, imagePublicId: feature.imagePublicId ?? "" }); setMessage("Mode edit aktif."); }
  function cancelEdit() { setEditingId(null); setForm({ name: "", description: "", imageUrl: "", imagePublicId: "" }); setMessage(""); }
  async function update(id: string, values: Partial<Feature>) { await fetch(`/api/admin/features/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) }); await load(); }
  async function remove(id: string) { if (!confirm("Hapus fasilitas ini?")) return; await fetch(`/api/admin/features/${id}`, { method: "DELETE" }); await load(); }
  async function reorder(target: string) { if (!dragged || dragged === target) return; const ordered = [...features]; const from = ordered.findIndex(item => item.id === dragged); const to = ordered.findIndex(item => item.id === target); const [item] = ordered.splice(from, 1); ordered.splice(to, 0, item); setFeatures(ordered); await Promise.all(ordered.map((feature, index) => update(feature.id, { sortOrder: index }))); setDragged(null); }

  return <div className="mx-auto max-w-7xl space-y-6"><section className="glass-panel rounded-2xl p-6 sm:p-8"><div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Venue features</p><h2 className="mt-2 text-balance text-2xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-3xl">Kelola fasilitas lapangan</h2><p className="mt-2 text-sm leading-7 text-[color:var(--muted)]">Data disimpan di Supabase, gambar disimpan di Cloudinary.</p></div><span className="w-fit rounded-full bg-white/10 px-4 py-2 text-sm text-[color:var(--muted)]">{features.length} fasilitas</span></div>
    <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_1.2fr] lg:items-stretch"><input className="min-w-0 rounded-2xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none" placeholder="Nama fasilitas / fitur" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/><textarea className="min-h-28 min-w-0 rounded-2xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-[color:var(--foreground)] outline-none" placeholder="Deskripsi" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/><label onDragOver={e => e.preventDefault()} onDrop={drop} className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/20 bg-[color:var(--background)] p-4 text-center text-sm text-[color:var(--muted)] transition hover:border-emerald-400/50 hover:bg-white/5"><span>{uploading ? "Mengunggah..." : "Drag & drop gambar di sini atau klik untuk memilih"}</span><input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); }}/></label>{form.imageUrl ? <Image src={form.imageUrl} alt="Preview" width={240} height={135} unoptimized className="h-32 w-full rounded-3xl object-cover lg:col-span-3"/> : null}<div className="flex flex-wrap gap-3 lg:col-span-3"><button className="btn-primary" disabled={uploading} onClick={() => void save()}>{editingId ? "Simpan perubahan" : "Tambah fasilitas"}</button>{editingId ? <button className="btn-secondary" onClick={cancelEdit}>Batal edit</button> : null}</div></div>
    {message ? <p className="mt-4 text-sm text-emerald-300">{message}</p> : null}
    <div className="mt-8 grid gap-4 sm:grid-cols-2">{features.map(feature => <article key={feature.id} draggable onDragStart={() => setDragged(feature.id)} onDragOver={e => e.preventDefault()} onDrop={() => void reorder(feature.id)} className="grid gap-4 rounded-3xl border border-white/10 bg-[color:var(--background)] p-4 sm:grid-cols-[120px_1fr] md:grid-cols-[120px_1fr_auto] md:items-center"><Image src={feature.imageUrl} alt={feature.name} width={120} height={80} unoptimized className="h-24 w-full rounded-2xl object-cover sm:h-20"/><div><h3 className="font-semibold text-[color:var(--foreground)]">{feature.name}</h3><p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{feature.description}</p><div className="mt-2 flex flex-wrap gap-3"><button className="text-sm text-sky-300" onClick={() => edit(feature)}>Edit</button><button className="text-sm text-sky-300" onClick={() => void update(feature.id, { isActive: !feature.isActive })}>{feature.isActive ? "Nonaktifkan" : "Aktifkan"}</button></div></div><button className="text-left text-sm text-rose-300 md:text-right" onClick={() => void remove(feature.id)}>Hapus</button></article>)}</div>
  </section></div>;
}

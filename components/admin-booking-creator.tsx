"use client";

import { fetchJson } from "@/lib/fetch-json";
import { LoadingOverlay, Spinner } from "@/components/ui/spinner";
import { DEFAULT_FIELD_ID } from "@/lib/venue";
import { getTodayDateStringInTimeZone } from "@/lib/timezone";

import { useEffect, useMemo, useState } from "react";

type AvailabilitySlot = {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  price?: number;
};

function parseTimeToMinutes(time: string) {
  const [hourText, minuteText] = time.split(":");
  return Number(hourText) * 60 + Number(minuteText ?? "0");
}

export default function AdminBookingCreator() {
  const [bookingDate, setBookingDate] = useState(getTodayDateStringInTimeZone());
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [referralCode, setReferralCode] = useState("");
  const [referralPercent, setReferralPercent] = useState(0);
  const [referralApplied, setReferralApplied] = useState(false);
  const [referralMessage, setReferralMessage] = useState<string | null>(null);
  const [referralChecking, setReferralChecking] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"Offline" | "Midtrans">("Offline");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingDate) return;
    const controller = new AbortController();
    setLoadingSlots(true);
    setSlotsError(null);
    setSlots([]);
    setSelectedIds(new Set());

    fetch(`/api/fields/${DEFAULT_FIELD_ID}/availability?date=${bookingDate}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message || "Unable to load schedule.");
        }
        return response.json();
      })
      .then((data) => {
        if (!data?.success || !Array.isArray(data.schedules)) throw new Error("Schedule data is malformed.");
        setSlots(
          (data.schedules as Array<Record<string, unknown>>).map((s) => ({
            id: String(s.id),
            startTime: String(s.startTime),
            endTime: String(s.endTime),
            isAvailable: Boolean(s.isAvailable),
            price: typeof s.price === "number" ? s.price : undefined,
          }))
        );
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        setSlotsError((err as Error).message);
      })
      .finally(() => setLoadingSlots(false));

    return () => controller.abort();
  }, [bookingDate]);

  const selectedSlots = useMemo(() => {
    const picked = slots.filter((s) => selectedIds.has(s.id));
    return [...picked].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  }, [slots, selectedIds]);

  const isContinuous = useMemo(() => {
    if (selectedSlots.length === 0) return false;
    return selectedSlots.every((slot, index) => index === 0 || slot.startTime === selectedSlots[index - 1].endTime);
  }, [selectedSlots]);

  const subtotal = useMemo(() => selectedSlots.reduce((sum, s) => sum + (s.price ?? 0), 0), [selectedSlots]);
  const discount = referralApplied && subtotal > 0 ? Math.min(Math.round((subtotal * referralPercent) / 100), subtotal) : 0;
  const adminFee = subtotal > 0 ? Math.round(((subtotal - discount) * 2) / 100) : 0;
  const total = subtotal - discount + adminFee;

  const toggleSlot = (slot: AvailabilitySlot) => {
    if (!slot.isAvailable) return;
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(slot.id)) next.delete(slot.id);
      else next.add(slot.id);
      return next;
    });
  };

  const handleApplyReferral = async () => {
    const code = referralCode.trim().toUpperCase();
    if (!code) {
      setReferralMessage("Masukkan kode referral dulu.");
      return;
    }
    setReferralChecking(true);
    setReferralMessage(null);
    try {
      const { res, data } = await fetchJson("/api/referrals/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      if (res.ok && data?.success && data?.valid) {
        setReferralCode(code);
        setReferralPercent(Number(data.percent) || 0);
        setReferralApplied(true);
        setReferralMessage(null);
      } else {
        setReferralApplied(false);
        setReferralPercent(0);
        setReferralMessage(data?.message || "Kode referral tidak valid.");
      }
    } catch {
      setReferralApplied(false);
      setReferralPercent(0);
      setReferralMessage("Gagal memeriksa kode. Coba lagi.");
    } finally {
      setReferralChecking(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    if (selectedSlots.length === 0) {
      setError("Pilih minimal satu slot waktu.");
      return;
    }
    if (!isContinuous) {
      setError("Pilih slot yang berurutan tanpa jeda.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError("Nama dan no HP wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      const { res, data } = await fetchJson("/api/staff/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim(),
          bookingDate,
          startTime: selectedSlots[0].startTime,
          endTime: selectedSlots[selectedSlots.length - 1].endTime,
          notes: notes.trim(),
          referralCode: referralApplied ? referralCode : "",
          paymentMethod,
        }),
      });
      if (!res.ok || !data?.success) throw new Error(String(data?.message ?? "") || "Gagal membuat booking.");
      if (paymentMethod === "Midtrans" && data?.data?.snapUrl) {
        window.location.href = String(data.data.snapUrl);
        return;
      }
      setSuccess(`Booking berhasil! Invoice: ${data?.data?.invoice?.invoiceNumber ?? "-"}`);
      setSelectedIds(new Set());
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setNotes("");
      setReferralCode("");
      setReferralPercent(0);
      setReferralApplied(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
      <LoadingOverlay show={saving} label="Membuat booking + payment + invoice..." />
      <h2 className="text-xl font-semibold text-white sm:text-2xl">Buat booking pelanggan</h2>
      <p className="mt-2 text-sm text-[color:var(--muted)]">Pilih waktu, referral, data pelanggan, lalu Cash atau Midtrans — booking, payment & invoice dibuat otomatis.</p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="text-sm text-[color:var(--muted)]">Tanggal</label>
          <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
        </div>

        <div>
          <label className="text-sm text-[color:var(--muted)]">Pilih waktu</label>
          {loadingSlots ? (
            <p className="mt-2 text-sm text-[color:var(--muted)]">Memuat jadwal…</p>
          ) : slotsError ? (
            <p className="mt-2 text-sm text-rose-200">{slotsError}</p>
          ) : slots.length === 0 ? (
            <p className="mt-2 text-sm text-[color:var(--muted)]">Tidak ada jadwal di tanggal ini.</p>
          ) : (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {slots.map((slot) => {
                const active = selectedIds.has(slot.id);
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => toggleSlot(slot)}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      !slot.isAvailable
                        ? "cursor-not-allowed border-white/10 bg-white/5 text-[color:var(--muted)]"
                        : active
                        ? "border-[color:var(--accent)] bg-[color:rgba(56,189,248,0.12)] text-white"
                        : "border-white/10 bg-[color:var(--background)] text-white hover:border-[color:var(--accent)]"
                    }`}
                  >
                    <span className="font-semibold">{slot.startTime} - {slot.endTime}</span>
                    <span className="ml-2 text-xs text-[color:var(--muted)]">
                      {slot.isAvailable ? `Rp ${Number(slot.price ?? 0).toLocaleString("id-ID")}` : "Terisi"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm text-[color:var(--muted)]">Kode referral (opsional)</label>
          {referralApplied ? (
            <div className="mt-2 flex items-center justify-between gap-3 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-200">{referralCode} dipakai — hemat {referralPercent}%</p>
              <button type="button" onClick={() => { setReferralApplied(false); setReferralPercent(0); setReferralCode(""); }} className="text-sm text-white underline-offset-2 hover:underline">Hapus</button>
            </div>
          ) : (
            <>
              <div className="mt-2 flex gap-2">
                <input value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="cth: HEMAT10" className="min-w-0 flex-1 rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm uppercase text-white outline-none" />
                <button type="button" onClick={() => void handleApplyReferral()} disabled={referralChecking} className="btn-secondary shrink-0 px-5 py-3 disabled:opacity-60">
                  {referralChecking ? "Cek..." : "Pakai"}
                </button>
              </div>
              {referralMessage ? <p className="mt-2 text-sm text-rose-200">{referralMessage}</p> : null}
            </>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-[color:var(--muted)]">Nama</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama pelanggan" className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
          </div>
          <div>
            <label className="text-sm text-[color:var(--muted)]">No HP</label>
            <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08..." className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
          </div>
        </div>
        <div>
          <label className="text-sm text-[color:var(--muted)]">Email (opsional)</label>
          <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="email@contoh.com" className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
        </div>
        <div>
          <label className="text-sm text-[color:var(--muted)]">Note (opsional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Catatan booking" className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm text-white outline-none" />
        </div>

        <div>
          <label className="text-sm text-[color:var(--muted)]">Metode pembayaran</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["Offline", "Midtrans"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setPaymentMethod(m)}
                className={`rounded-3xl border px-4 py-3 text-sm font-semibold transition ${
                  paymentMethod === m
                    ? "border-[color:var(--accent)] bg-[color:rgba(56,189,248,0.12)] text-white"
                    : "border-white/10 bg-[color:var(--background)] text-[color:var(--muted)]"
                }`}
              >
                {m === "Offline" ? "Cash" : "Midtrans"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1 rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-sm">
          <div className="flex justify-between text-[color:var(--muted)]"><span>Subtotal</span><span className="text-white">Rp {subtotal.toLocaleString("id-ID")}</span></div>
          {discount > 0 ? <div className="flex justify-between text-emerald-200"><span>Diskon {referralCode} ({referralPercent}%)</span><span>-Rp {discount.toLocaleString("id-ID")}</span></div> : null}
          <div className="flex justify-between text-[color:var(--muted)]"><span>Admin fee (2%)</span><span className="text-white">Rp {adminFee.toLocaleString("id-ID")}</span></div>
          <div className="flex justify-between font-semibold text-white"><span>Total</span><span>Rp {total.toLocaleString("id-ID")}</span></div>
        </div>

        {error ? <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div> : null}
        {success ? <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">{success}</div> : null}

        <button onClick={() => void handleSubmit()} disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 px-6 py-3 disabled:opacity-60">
          {saving ? <Spinner size={18} /> : null}
          {saving ? "Memproses..." : paymentMethod === "Midtrans" ? "Buat booking & bayar via Midtrans" : "Buat booking cash (otomatis lunas)"}
        </button>
      </div>
    </section>
  );
}

"use client";

import { fetchJson } from "@/lib/fetch-json";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatedCard } from "@/components/animated-card";
import { formatJakartaDate } from "@/lib/timezone";
import { buildDirectPaymentUrl } from "@/lib/payment-utils";

export const dynamic = "force-dynamic";

function formatTimeRange(start: string, end: string) {
  const parseTime = (value: string) => {
    const [hourText, minuteText] = value.split(":");
    const hour = Number(hourText);
    const minute = Number(minuteText ?? "0");

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      return null;
    }

    return { hour, minute };
  };

  const formatTime = (hour: number, minute: number) => `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const parsedStart = parseTime(start);
  const parsedEnd = parseTime(end);

  if (!parsedStart || !parsedEnd) {
    return `${start} - ${end} WIB`;
  }

  return `${formatTime(parsedStart.hour, parsedStart.minute)} - ${formatTime(parsedEnd.hour, parsedEnd.minute)} WIB`;
}

function getSearchParam(value: string | null, fallback = "") {
  return value ?? fallback;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const bookingDate = getSearchParam(searchParams.get("bookingDate"));
  const startTime = getSearchParam(searchParams.get("startTime"));
  const endTime = getSearchParam(searchParams.get("endTime"));
  const amount = Number(getSearchParam(searchParams.get("amount"), "0"));
  const subtotal = Number(getSearchParam(searchParams.get("subtotal"), "")) || amount;
  const discount = Number(getSearchParam(searchParams.get("discount"), "")) || 0;
  const adminFee = Number(getSearchParam(searchParams.get("adminFee"), "")) || 0;
  const referralCode = getSearchParam(searchParams.get("referralCode"));

  const hasValidBookingDetails = Boolean(bookingDate && startTime && endTime && amount > 0);
  const hasValidCustomerInfo = Boolean(customerName.trim() && customerEmail.trim() && customerPhone.trim());
  const canSubmit = hasValidBookingDetails;

  const handleCheckout = async () => {
    if (!hasValidBookingDetails) {
      setError("Booking details are incomplete. Please return to the booking page and select a slot.");
      return;
    }

    if (!hasValidCustomerInfo) {
      setError("Please fill in your name, email, and phone number.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const validateResp = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingDate, startTime, endTime, validateOnly: true }),
      });

      const validateResult = await validateResp.json().catch(() => null);
      if (!validateResp.ok || !validateResult?.success) {
        setError(validateResult?.message || "Slot no longer available.");
        setSaving(false);
        return;
      }

      const { res: response, data: __body } = await fetchJson("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingDate,
          startTime,
          endTime,
          customerName,
          customerEmail,
          customerPhone,
          notes: customerNotes.trim(),
        }),
      });

      const result = __body;
      if (!response.ok || !result.success || !result.booking?.id) {
        throw new Error(String(result.message ?? "") || "Unable to create booking.");
      }

      const paymentResponse = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: result.booking.id,
          amount,
          paymentMethod: "Midtrans",
          customerName,
          email: customerEmail,
          phone: customerPhone,
        }),
      });

      const paymentResult = await paymentResponse.json().catch(() => null);
      if (!paymentResponse.ok || !paymentResult?.success || !paymentResult?.snapUrl) {
        throw new Error(paymentResult?.message || paymentResult?.error || "Unable to create direct payment link.");
      }

      const directPaymentUrl = buildDirectPaymentUrl(paymentResult.snapUrl, paymentResult.transaction?.snapUrl);
      if (!directPaymentUrl) {
        throw new Error("No direct payment URL was returned.");
      }

      window.location.href = directPaymentUrl;
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  };

  return (
    <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <div className="card-surface p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent-strong)]">Secure checkout</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-4xl">Review your booking details</h1>
          <p className="mt-4 max-w-2xl text-lg text-[color:var(--muted)]">
            Confirm the date and time, then enter your contact information to proceed to payment.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 card-surface p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Date</p>
              <p className="mt-2 text-xl font-semibold text-[color:var(--foreground)]">{bookingDate ? formatJakartaDate(bookingDate) : "—"}</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">{startTime && endTime ? formatTimeRange(startTime, endTime) : "—"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 card-surface p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Total</p>
              <p className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">Rp {amount.toLocaleString("id-ID")}</p>
              <p className="mt-2 text-sm text-[color:var(--muted)]">Estimated charge</p>
            </div>
          </div>
        </div>

        <AnimatedCard className="p-6 sm:p-8">
          <h2 className="text-balance text-2xl font-semibold leading-tight text-[color:var(--foreground)]">Your contact information</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Required for booking confirmation and payment receipt.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[color:var(--muted)]">Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                onInput={(e) => setCustomerName((e.target as HTMLInputElement).value)}
                placeholder="Enter your full name"
                className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--muted)]">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                onInput={(e) => setCustomerEmail((e.target as HTMLInputElement).value)}
                placeholder="Enter your email"
                className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--muted)]">Phone Number</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                onInput={(e) => setCustomerPhone((e.target as HTMLInputElement).value)}
                placeholder="Enter your phone number"
                className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[color:var(--muted)]">Notes (optional)</label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                onInput={(e) => setCustomerNotes((e.target as HTMLTextAreaElement).value)}
                placeholder="Any additional notes for your booking (optional)"
                rows={3}
                className="mt-2 w-full rounded-3xl border border-white/10 bg-[color:var(--background)] px-4 py-3 text-white outline-none focus:border-[color:var(--accent)] placeholder:text-[color:var(--muted)]"
              />
            </div>
          </div>

          <div className="mt-8 space-y-2 border-t border-white/10 pt-8 text-sm text-[color:var(--muted)]">
            <div className="flex justify-between"><span>Subtotal</span><span>Rp {subtotal.toLocaleString("id-ID")}</span></div>
            {discount > 0 ? (
              <div className="flex justify-between"><span>Diskon referral{referralCode ? ` (${referralCode})` : ""}</span><span>-Rp {discount.toLocaleString("id-ID")}</span></div>
            ) : null}
            {adminFee > 0 ? (
              <div className="flex justify-between"><span>Admin fee (2%)</span><span>Rp {adminFee.toLocaleString("id-ID")}</span></div>
            ) : null}
            <div className="flex justify-between font-semibold text-[color:var(--foreground)]"><span>Total</span><span>Rp {amount.toLocaleString("id-ID")}</span></div>
          </div>

          {error ? (
            <p className="mt-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <button
            onClick={handleCheckout}
            disabled={saving || !canSubmit}
            className="mt-8 btn-primary w-full py-4 text-lg disabled:opacity-60"
          >
            {saving ? "Processing…" : canSubmit ? "Confirm and pay" : "Enter booking information to continue"}
          </button>
        </AnimatedCard>
      </div>
    </main>
  );
}

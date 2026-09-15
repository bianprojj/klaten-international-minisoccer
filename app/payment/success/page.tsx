import Link from "next/link";
import { AnimatedCard } from "@/components/animated-card";
import { InvoiceActions } from "@/components/invoice-actions";
import { getPaymentTransaction, reconcilePaymentStatus } from "@/lib/payment-service";
import { formatJakartaDateKey } from "@/lib/timezone";
import { DEFAULT_FIELD_NAME } from "@/lib/venue";

export const dynamic = "force-dynamic";

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const transactionId = getSearchParam(resolvedSearchParams.order_id) || getSearchParam(resolvedSearchParams.transactionId) || getSearchParam(resolvedSearchParams.transaction_id);
  const transactionStatus = getSearchParam(resolvedSearchParams.transaction_status) || getSearchParam(resolvedSearchParams.status) || getSearchParam(resolvedSearchParams.transactionStatus);

  if (transactionId) {
    await reconcilePaymentStatus(transactionId, transactionStatus).catch(() => undefined);
  }

  const payment = transactionId ? await getPaymentTransaction(transactionId).catch(() => null) : null;
  const status = payment?.status ?? "pending";
  const isSuccess = status === "success";
  const isFailed = status === "failed" || status === "cancelled" || status === "expired";
  const isPending = status === "pending";
  const refreshUrl = `/payment/success?transactionId=${encodeURIComponent(transactionId)}`;
  const continueUrl = payment?.booking ? `/booking/${payment.booking.id}/payment` : "/";

  return (
    <main className="flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <AnimatedCard className="p-6 text-center sm:p-8">
          <div
            className={`mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full text-7xl ${
              isSuccess ? "bg-emerald-500/15 text-emerald-300" : isFailed ? "bg-rose-500/15 text-rose-300" : "bg-amber-500/15 text-amber-300"
            }`}
          >
            {isSuccess ? "✓" : isFailed ? "✕" : "…"}
          </div>

          <div className={`mb-6 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
            isSuccess ? "bg-emerald-500/10 text-emerald-300" : isFailed ? "bg-rose-500/10 text-rose-300" : "bg-amber-500/10 text-amber-200"
          }`}>
            {isSuccess ? "Payment successful" : isFailed ? "Payment failed" : "Payment pending"}
          </div>

          <h1 className="text-balance text-3xl font-semibold leading-tight text-[color:var(--foreground)] sm:text-4xl">
            {isSuccess ? "Thank you! Your booking is confirmed." : isFailed ? "Your payment did not complete." : "Your payment is still pending."}
          </h1>

          <p className="mt-4 text-lg text-[color:var(--muted)]">
            {isSuccess
              ? "Your payment has been completed successfully. You can download or copy the invoice details below."
              : isFailed
              ? "Your payment could not be completed. Please try again or return to the homepage."
              : "We are waiting for payment confirmation from the payment provider. Please stay on this page or refresh the status manually."}
          </p>

          {isPending ? (
            <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-left">
              <p className="text-sm text-[color:var(--muted)]">
                The payment is pending. It can take a few moments for Midtrans to confirm the status. If the status does not update automatically, refresh below.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href={refreshUrl} className="btn-secondary w-full sm:w-auto">
                  Refresh status
                </Link>
                <Link href={continueUrl} className="btn-primary w-full sm:w-auto">
                  Open payment popup
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-8 glass-panel rounded-3xl p-6 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Payment summary</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-[color:var(--muted)]">{status}</span>
            </div>
            <div className="mt-6 grid gap-3 text-sm text-[color:var(--muted)] sm:grid-cols-2">
              <div className="flex justify-between gap-4"><span>Transaction ID</span><span className="text-right font-medium text-[color:var(--foreground)]">{payment?.transactionId ?? transactionId}</span></div>
              <div className="flex justify-between gap-4"><span>Booking ID</span><span className="text-right font-medium text-[color:var(--foreground)]">{payment?.bookingId ?? "—"}</span></div>
              <div className="flex justify-between gap-4"><span>Method</span><span className="text-right font-medium text-[color:var(--foreground)]">{payment?.paymentMethod ?? "—"}</span></div>
              <div className="flex justify-between gap-4"><span>Amount</span><span className="text-right font-medium text-[color:var(--foreground)]">Rp {payment?.amount?.toLocaleString("id-ID") ?? "0"}</span></div>
              <div className="flex justify-between gap-4"><span>Provider</span><span className="text-right font-medium text-[color:var(--foreground)]">{payment?.provider ?? "—"}</span></div>
              <div className="flex justify-between gap-4"><span>Field</span><span className="text-right font-medium text-[color:var(--foreground)]">{DEFAULT_FIELD_NAME}</span></div>
            </div>
          </div>

          <div className="mt-6 glass-panel rounded-3xl p-6 text-left">
            <div className="grid gap-3 text-sm text-[color:var(--muted)] sm:grid-cols-2">
              <div className="flex justify-between gap-4"><span>Invoice</span><span className="text-right font-medium text-[color:var(--foreground)]">{payment?.invoice?.invoiceNumber ?? "—"}</span></div>
              <div className="flex justify-between gap-4"><span>Invoice amount</span><span className="text-right font-medium text-[color:var(--foreground)]">Rp {payment?.invoice?.total?.toLocaleString("id-ID") ?? payment?.amount?.toLocaleString("id-ID") ?? "0"}</span></div>
            </div>
          </div>

          {payment?.invoice?.invoiceNumber ? (
            <InvoiceActions
              invoiceNumber={payment.invoice.invoiceNumber}
              customerName={payment.invoice.customerName ?? payment.booking.customerName}
              customerEmail={payment.invoice.customerEmail ?? payment.booking.customerEmail ?? undefined}
              amount={payment.invoice.total ?? payment.amount}
              bookingDate={formatJakartaDateKey(payment.booking.bookingDate)}
              bookingTime={`${payment.booking.startTime} - ${payment.booking.endTime}`}
            />
          ) : null}

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link href="/booking-history" className="btn-primary">
              View booking history
            </Link>
            <Link href="/" className="btn-secondary">
              Back to homepage
            </Link>
          </div>
        </AnimatedCard>
      </div>
    </main>
  );
}

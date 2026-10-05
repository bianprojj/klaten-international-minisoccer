import { NextResponse } from "next/server";
import { PaymentStatus } from "@/lib/payment-provider";
import { normalizePaymentStatus, processWebhookEvent } from "@/lib/payment-service";
import { verifyMidtransSignature } from "@/lib/midtrans";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function resolveTransactionId(body: Record<string, unknown>) {
  return (
    (typeof body?.transactionId === "string" && body.transactionId) ||
    (typeof body?.orderId === "string" && body.orderId) ||
    (typeof body?.transaction_id === "string" && body.transaction_id) ||
    (typeof body?.order_id === "string" && body.order_id) ||
    ""
  );
}

function resolveTransactionStatus(body: Record<string, unknown>): PaymentStatus | "" {
  const rawValue = body?.transaction_status ?? body?.status ?? body?.transactionStatus ?? body?.status_code ?? body?.statusCode;
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return "";
  }

  return normalizePaymentStatus(String(rawValue)) as PaymentStatus;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    // Midtrans sends signature_key inside the JSON body, not as a header.
    // Headers are still honored for manual/test callers.
    const bodySignature = typeof (body as Record<string, unknown>)?.signature_key === "string" ? String((body as Record<string, unknown>).signature_key) : "";
    const signature = request.headers.get("x-midtrans-signature") || request.headers.get("x-signature") || request.headers.get("x-callback-signature") || request.headers.get("x-notification-token") || bodySignature;

    if (process.env.NODE_ENV === "production") {
      const ok = signature && verifyMidtransSignature(rawBody, signature);
      if (!ok) {
        console.warn("[WEBHOOK] Invalid Midtrans signature detected", { timestamp: new Date().toISOString() });
        return NextResponse.json({ success: false, message: "Invalid Midtrans signature." }, { status: 401 });
      }
    }

    const transactionId = resolveTransactionId(body as Record<string, unknown>);
    const status = resolveTransactionStatus(body as Record<string, unknown>);

    // Compute SHA256 hash of payload to deduplicate repeated webhook deliveries
    const eventHash = crypto.createHash("sha256").update(rawBody).digest("hex");

    // Attempt to record the webhook event; if it's duplicate, skip processing.
    try {
      await prisma.webhookEvent.create({
        data: {
          eventHash,
          orderId: transactionId || undefined,
          eventType: status || undefined,
          payload: body,
        },
      });
    } catch (err) {
      // If record already exists, treat as duplicate. Check existence instead of relying on error code typing.
      try {
        const exists = await prisma.webhookEvent.findUnique({ where: { eventHash } });
        if (exists) {
          console.info("[WEBHOOK] Duplicate webhook received, already processed/recorded", { eventHash });
          return NextResponse.json({ success: true, message: "Duplicate webhook ignored." });
        }
      } catch (innerErr) {
        console.error("[WEBHOOK] Failed checking webhook event existence", { err: innerErr instanceof Error ? innerErr.message : String(innerErr) });
      }

      // Other DB errors should be logged and returned
      console.error("[WEBHOOK] Failed to record webhook event", { err: err instanceof Error ? err.message : String(err) });
      return NextResponse.json({ success: false, message: "Failed to record webhook event." }, { status: 500 });
    }

    if (!transactionId || !status) {
      console.warn("[WEBHOOK] Missing transaction ID or status", { body, timestamp: new Date().toISOString() });
      return NextResponse.json({ success: false, message: "Missing transaction identifier or status." }, { status: 400 });
    }

    console.info("[WEBHOOK] Processing payment webhook", { transactionId, status, timestamp: new Date().toISOString() });
    
    try {
      await processWebhookEvent(transactionId, status, eventHash);
      return NextResponse.json({ success: true, message: "Webhook processed." });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn("[WEBHOOK] processWebhookEvent failed, attempting fallback lookup", { transactionId, status, err: errMsg });

      // If payment not found by incoming identifier, try to find by midtransOrderId (order_id)
      const orderIdField = (body && (body.order_id || body.orderId || body.orderId)) as string | undefined;
      if (orderIdField) {
        const payment = await prisma.payment.findFirst({ where: { midtransOrderId: orderIdField } });
        if (payment) {
          try {
            await processWebhookEvent(payment.transactionId, status, eventHash);
            return NextResponse.json({ success: true, message: "Webhook processed via fallback (midtransOrderId)." });
          } catch (err2) {
            console.error("[WEBHOOK] Fallback processWebhookEvent failed", { err: err2 instanceof Error ? err2.message : String(err2) });
            return NextResponse.json({ success: false, message: "Webhook processing failed during fallback." }, { status: 500 });
          }
        }
      }

      console.error("[WEBHOOK] Unable to associate webhook with a payment record", { transactionId, status, error: errMsg });
      // Return 202 to indicate received but not processed — avoids immediate retries escalation
      return NextResponse.json({ success: false, message: "Webhook received but payment record not found." }, { status: 202 });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[WEBHOOK] Error processing webhook:", {
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json({ success: false, message: `Webhook error: ${errorMsg}` }, { status: 500 });
  }
}

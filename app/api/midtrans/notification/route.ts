import { NextResponse } from "next/server";
import { normalizePaymentStatus, processWebhookEvent } from "@/lib/payment-service";
import { verifyMidtransSignature } from "@/lib/midtrans";
import type { PaymentStatus } from "@/lib/payment-provider";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function resolveTransactionId(body: Record<string, unknown>) {
  return (
    (typeof body?.transaction_id === "string" && body.transaction_id) ||
    (typeof body?.transactionId === "string" && body.transactionId) ||
    (typeof body?.order_id === "string" && body.order_id) ||
    (typeof body?.orderId === "string" && body.orderId) ||
    ""
  );
}

function resolveTransactionStatus(body: Record<string, unknown>) {
  const rawValue = body?.transaction_status ?? body?.status ?? body?.transactionStatus ?? body?.status_code ?? body?.statusCode;
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return "";
  }

  return normalizePaymentStatus(String(rawValue));
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    // Midtrans sends signature_key inside the JSON body, not as a header.
    // Headers are still honored for manual/test callers.
    const bodySignature = typeof (body as Record<string, unknown>)?.signature_key === "string" ? String((body as Record<string, unknown>).signature_key) : "";
    const signature = request.headers.get("x-midtrans-signature") || request.headers.get("x-signature") || bodySignature;

    if (process.env.NODE_ENV === "production" && (!signature || !verifyMidtransSignature(rawBody, signature))) {
      console.warn("[MIDTRANS] Invalid signature detected", { timestamp: new Date().toISOString() });
      return NextResponse.json({ success: false, message: "Invalid Midtrans signature." }, { status: 401 });
    }

    const transactionId = resolveTransactionId(body as Record<string, unknown>);
    const status = resolveTransactionStatus(body as Record<string, unknown>) as PaymentStatus;
    const eventHash = crypto.createHash("sha256").update(rawBody).digest("hex");

    if (!transactionId || !status) {
      console.warn("[MIDTRANS] Missing transaction id or status", { body, timestamp: new Date().toISOString() });
      return NextResponse.json({ success: false, message: "Missing transaction identifier or status." }, { status: 400 });
    }

    try {
      await prisma.webhookEvent.create({
        data: {
          eventHash,
          orderId: transactionId,
          eventType: status,
          payload: body,
        },
      });
    } catch (err) {
      const exists = await prisma.webhookEvent.findUnique({ where: { eventHash } });
      if (exists) {
        console.info("[MIDTRANS] Duplicate notification ignored", { eventHash, transactionId, status });
        return NextResponse.json({ success: true, message: "Duplicate Midtrans notification ignored." });
      }
      console.error("[MIDTRANS] Failed to record webhook event", { err: err instanceof Error ? err.message : String(err), eventHash });
      return NextResponse.json({ success: false, message: "Failed to record webhook event." }, { status: 500 });
    }

    console.info("[MIDTRANS] Notification received", { transactionId, status, timestamp: new Date().toISOString() });
    try {
      await processWebhookEvent(transactionId, status, eventHash);
      return NextResponse.json({ success: true, message: "Midtrans notification processed." });
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      const orderIdField = (body as Record<string, unknown>)?.order_id ?? (body as Record<string, unknown>)?.orderId;
      if (typeof orderIdField === "string" && orderIdField) {
        const payment = await prisma.payment.findFirst({ where: { midtransOrderId: orderIdField } });
        if (payment) {
          await processWebhookEvent(payment.transactionId, status, eventHash);
          return NextResponse.json({ success: true, message: "Midtrans notification processed via fallback." });
        }
      }
      throw new Error(errMsg);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[MIDTRANS] Notification error:", { message: errorMsg, stack: error instanceof Error ? error.stack : undefined, timestamp: new Date().toISOString() });
    return NextResponse.json({ success: false, message: `Unable to process Midtrans notification. ${errorMsg}` }, { status: 500 });
  }
}

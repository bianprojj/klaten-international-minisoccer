import crypto from "crypto";

function getMidtransServerKey() {
  return process.env.MIDTRANS_SERVER_KEY ?? "";
}

const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? process.env.MIDTRANS_CLIENT_KEY ?? "";
const MIDTRANS_IS_PRODUCTION = String(process.env.MIDTRANS_IS_PRODUCTION ?? "false").toLowerCase() === "true";
const MIDTRANS_SANDBOX_URL = process.env.MIDTRANS_SANDBOX_URL ?? "https://app.sandbox.midtrans.com";
const MIDTRANS_PRODUCTION_URL = process.env.MIDTRANS_PRODUCTION_URL ?? "https://app.midtrans.com";
const MIDTRANS_BASE_URL = process.env.MIDTRANS_BASE_URL ?? `${MIDTRANS_IS_PRODUCTION ? MIDTRANS_PRODUCTION_URL : MIDTRANS_SANDBOX_URL}/snap/v1/transactions`;
const MIDTRANS_STATUS_BASE_URL = process.env.MIDTRANS_STATUS_BASE_URL ?? `${MIDTRANS_IS_PRODUCTION ? MIDTRANS_PRODUCTION_URL : MIDTRANS_SANDBOX_URL}/v2`;
const MIDTRANS_SNAP_SCRIPT_URL = process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ?? `${MIDTRANS_IS_PRODUCTION ? MIDTRANS_PRODUCTION_URL : MIDTRANS_SANDBOX_URL}/snap/snap.js`;

export interface MidtransCreatePayload {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details?: {
    first_name?: string;
    email?: string;
    phone?: string;
  };
  callbacks?: {
    finish?: string;
    error?: string;
    pending?: string;
  };
  notification_url?: string;
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  expiry?: {
    unit?: string;
    duration?: number;
  };
}

export interface MidtransTransactionResponse {
  token: string;
  redirect_url: string;
}

export async function createMidtransTransaction(payload: MidtransCreatePayload): Promise<MidtransTransactionResponse> {
  const serverKey = getMidtransServerKey();
  if (!serverKey.trim()) {
    const token = `mock-${Math.random().toString(36).slice(2, 12)}`;
    const redirectUrl = `${MIDTRANS_SANDBOX_URL}/snap/pay/${payload.transaction_details.order_id}`;

    return {
      token,
      redirect_url: redirectUrl,
    };
  }

  const grossAmount = Number(payload.transaction_details.gross_amount);
  const itemTotal = (payload.item_details ?? []).reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);

  if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
    throw new Error("Invalid Midtrans payload: transaction_details.gross_amount must be a positive number.");
  }

  if (payload.item_details?.length && grossAmount !== itemTotal) {
    throw new Error(`Invalid Midtrans payload: gross_amount ${grossAmount} does not match item_details total ${itemTotal}.`);
  }

  const response = await fetch(MIDTRANS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  const rawBody = await response.text();

  if (!response.ok) {
    let parsedBody: Record<string, unknown> | null = null;
    try {
      parsedBody = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      parsedBody = null;
    }

    const errorMessages = parsedBody && Array.isArray(parsedBody.error_messages)
      ? parsedBody.error_messages.join(", ")
      : undefined;
    const message = errorMessages || parsedBody?.message || rawBody || `Midtrans request failed with status ${response.status}`;
    throw new Error(`Midtrans request failed (${response.status}): ${message}`);
  }

  try {
    return JSON.parse(rawBody) as MidtransTransactionResponse;
  } catch {
    throw new Error("Midtrans returned an invalid response body.");
  }
}

export async function getMidtransTransactionStatus(orderId: string): Promise<Record<string, unknown>> {
  const serverKey = getMidtransServerKey();
  if (!serverKey.trim()) {
    throw new Error("Midtrans server key is required to fetch transaction status.");
  }

  const url = `${MIDTRANS_STATUS_BASE_URL}/${encodeURIComponent(orderId)}/status`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });

  const rawBody = await response.text();
  if (!response.ok) {
    let parsedBody: Record<string, unknown> | null = null;
    try {
      parsedBody = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      parsedBody = null;
    }

    const errorMessage = parsedBody?.message ?? rawBody ?? `Midtrans status lookup failed with ${response.status}`;
    throw new Error(`Midtrans status fetch failed (${response.status}): ${errorMessage}`);
  }

  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid Midtrans status response body.");
  }
}

export function resolveMidtransTransactionStatus(body: Record<string, unknown>): string {
  const transactionStatus = body?.transaction_status ?? body?.status ?? body?.transactionStatus;
  if (typeof transactionStatus === "string" && transactionStatus.trim()) return transactionStatus;

  const statusCodeRaw = body?.status_code ?? body?.statusCode;
  const statusCode = typeof statusCodeRaw === "number" || typeof statusCodeRaw === "string" ? String(statusCodeRaw) : "";
  if (!statusCode) {
    return "";
  }

  if (["200", "201", "202"].includes(statusCode)) {
    return statusCode === "200" ? "settlement" : "pending";
  }

  if (["400", "401", "403", "404", "407", "500"].includes(statusCode)) return "failed";
  return statusCode;
}

function parseMidtransBody(rawBody: string) {
  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function verifyMidtransSignature(rawBody: string, signature: string) {
  const serverKey = getMidtransServerKey();
  if (!serverKey || !signature.trim()) {
    return false;
  }

  const providedBuffer = Buffer.from(signature.trim(), "hex");
  if (providedBuffer.length === 0) {
    return false;
  }

  const parsedBody = parseMidtransBody(rawBody);
  const orderId = parsedBody
    ? (typeof parsedBody.order_id === "string" || typeof parsedBody.order_id === "number"
        ? String(parsedBody.order_id)
        : typeof parsedBody.orderId === "string" || typeof parsedBody.orderId === "number"
          ? String(parsedBody.orderId)
          : "")
    : "";
  const statusCode = parsedBody
    ? (typeof parsedBody.status_code === "string" || typeof parsedBody.status_code === "number"
        ? String(parsedBody.status_code)
        : typeof parsedBody.statusCode === "string" || typeof parsedBody.statusCode === "number"
          ? String(parsedBody.statusCode)
          : "")
    : "";
  const grossAmount = parsedBody
    ? (typeof parsedBody.gross_amount === "string" || typeof parsedBody.gross_amount === "number"
        ? String(parsedBody.gross_amount)
        : typeof parsedBody.grossAmount === "string" || typeof parsedBody.grossAmount === "number"
          ? String(parsedBody.grossAmount)
          : "")
    : "";

  const officialSignature = orderId && statusCode && grossAmount
    ? crypto.createHash("sha512").update(`${orderId}${statusCode}${grossAmount}${serverKey}`).digest("hex")
    : null;

  if (officialSignature) {
    const expectedOfficialBuffer = Buffer.from(officialSignature, "hex");
    if (expectedOfficialBuffer.length === providedBuffer.length && crypto.timingSafeEqual(expectedOfficialBuffer, providedBuffer)) {
      return true;
    }
  }

  const expectedFromRawBody = crypto
    .createHash("sha512")
    .update(`${rawBody}${serverKey}`)
    .digest("hex");

  const expectedRawBodyBuffer = Buffer.from(expectedFromRawBody, "hex");
  if (expectedRawBodyBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedRawBodyBuffer, providedBuffer);
}

export function getMidtransConfig() {
  return {
    clientKey: MIDTRANS_CLIENT_KEY,
    serverKey: getMidtransServerKey(),
    baseUrl: MIDTRANS_BASE_URL,
    snapScriptUrl: MIDTRANS_SNAP_SCRIPT_URL,
  };
}

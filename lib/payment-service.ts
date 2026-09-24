import { prisma } from "@/lib/prisma";
import { DemoPaymentProvider, PaymentMethod, PaymentStatus, PaymentTransactionInput, PaymentSimulationDetails } from "@/lib/payment-provider";
import { BookingStatus, expireStalePendingBookings } from "@/lib/booking-engine";
import { sendNotification } from "@/lib/notifications";
import { createMidtransTransaction, getMidtransTransactionStatus, resolveMidtransTransactionStatus } from "@/lib/midtrans";
import { DEFAULT_FIELD_NAME } from "@/lib/venue";
import { buildMidtransCustomerDetails, isUuid } from "@/lib/payment-utils";
import { buildInvoiceAttachmentAuto } from "@/lib/invoice-pdf";
import { formatJakartaDateKey } from "@/lib/timezone";

const paymentProvider = new DemoPaymentProvider();

function resolveAppBaseUrl(explicitBaseUrl?: string) {
  const configured = explicitBaseUrl?.trim() || process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://klaten-international-minisoccer.vercel.app");
  return configured.replace(/\/+$/, "");
}

export function normalizePaymentStatus(status: string): PaymentStatus {
  const lower = String(status ?? "").toLowerCase().trim();

  if (["capture", "settlement", "success", "accepted", "completed"].includes(lower)) return "success";
  if (["200"].includes(lower)) return "success";
  if (["deny", "failure", "failed", "decline", "error", "fraud", "invalid"].includes(lower)) return "failed";
  if (["expire", "expired", "410"].includes(lower)) return "expired";
  if (["cancel", "cancelled", "canceled", "void"].includes(lower)) return "cancelled";
  if (["refund", "refunded"].includes(lower)) return "refunded";
  if (["pending", "processing", "challenge", "authorizing", "201", "202"].includes(lower)) return "pending";
  return "pending";
}

export function buildPaymentLookupWhere(identifier: string) {
  const normalizedIdentifier = identifier?.trim() ?? "";
  if (!normalizedIdentifier) {
    return [] as Array<Record<string, string>>;
  }

  const conditions: Array<Record<string, string>> = [
    { transactionId: normalizedIdentifier },
    { midtransOrderId: normalizedIdentifier },
  ];

  if (isUuid(normalizedIdentifier)) {
    conditions.push({ bookingId: normalizedIdentifier });
  }

  return conditions;
}

async function findPaymentByIdentifier(identifier: string) {
  const conditions = buildPaymentLookupWhere(identifier);
  if (conditions.length === 0) {
    return null;
  }

  return prisma.payment.findFirst({
    where: {
      OR: conditions,
    },
    include: { booking: true },
  });
}

function buildInvoiceNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `INV-${date}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function createPaymentTransaction(input: PaymentTransactionInput & { appBaseUrl?: string; forceNew?: boolean }) {
  if (!input.bookingId) {
    throw new Error("bookingId is required.");
  }

  if (!input.amount || input.amount <= 0) {
    throw new Error("A valid amount is required.");
  }

  const bookingId = input.bookingId.trim();
  const normalizedBookingId = isUuid(bookingId) ? bookingId : undefined;

  if (!normalizedBookingId) {
    throw new Error("Invalid bookingId format.");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: normalizedBookingId },
  });

  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (booking.totalPrice > 0 && input.amount !== booking.totalPrice) {
    throw new Error(`Amount mismatch: expected booking total ${booking.totalPrice}, received ${input.amount}.`);
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      bookingId: normalizedBookingId,
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingPayment && !input.forceNew) {
    const alreadyResolved = existingPayment.status === "success" || booking.status === "confirmed";
    if (alreadyResolved) {
      const refreshed = await prisma.payment.findUnique({
        where: { id: existingPayment.id },
        include: { booking: true },
      });

      if (refreshed) {
        return {
          transactionId: refreshed.transactionId,
          expiresAt: refreshed.expiredAt?.toISOString() ?? new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          paymentMethod: refreshed.paymentMethod as PaymentMethod,
          amount: refreshed.amount,
          status: refreshed.status,
          providerName: refreshed.provider,
          snapUrl: refreshed.snapUrl,
          snapToken: refreshed.snapToken,
          existing: true,
        };
      }
    }

    if (existingPayment.status === "pending") {
      // If an existing pending payment exists, check Midtrans live status before creating a new link.
      try {
        if (existingPayment.midtransOrderId) {
          const midResp = await getMidtransTransactionStatus(existingPayment.midtransOrderId);
          const liveStatus = normalizePaymentStatus(resolveMidtransTransactionStatus(midResp));
          if (liveStatus !== "pending") {
            // process webhook locally to update DB
            await processWebhookEvent(existingPayment.transactionId, liveStatus);
            const refreshed = await prisma.payment.findUnique({ where: { id: existingPayment.id } });
            if (refreshed) {
              return {
                transactionId: refreshed.transactionId,
                expiresAt: refreshed.expiredAt?.toISOString() ?? new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                paymentMethod: refreshed.paymentMethod as PaymentMethod,
                amount: refreshed.amount,
                status: refreshed.status,
                providerName: refreshed.provider,
                snapUrl: refreshed.snapUrl,
                snapToken: refreshed.snapToken,
                existing: true,
              };
            }
          }
        }
      } catch (err) {
        console.warn("[payment-service] live Midtrans status check failed for existing payment", { err: err instanceof Error ? err.message : String(err) });
      }

      if (existingPayment.expiredAt && existingPayment.expiredAt > new Date() && existingPayment.snapToken && existingPayment.snapUrl) {
        return {
          transactionId: existingPayment.transactionId,
          expiresAt: existingPayment.expiredAt?.toISOString() ?? new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          paymentMethod: existingPayment.paymentMethod as PaymentMethod,
          amount: existingPayment.amount,
          status: existingPayment.status,
          providerName: existingPayment.provider,
          snapUrl: existingPayment.snapUrl,
          snapToken: existingPayment.snapToken,
          existing: true,
        };
      }
    }
  }

  const appBaseUrl = resolveAppBaseUrl(input.appBaseUrl);
  const explicitNotificationUrl = process.env.MIDTRANS_NOTIFICATION_URL?.trim();
  const notificationUrl = explicitNotificationUrl ? explicitNotificationUrl.replace(/\/+$/, "") : `${appBaseUrl}/api/payments/webhook`;
  // Generate a short, unique transaction id and use it as Midtrans order_id so webhooks map reliably.
  const uniqueTransactionId = `TX-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const midtransOrderId = uniqueTransactionId; // keep order id equal to our transaction id
  const customerDetails = buildMidtransCustomerDetails(input.customerName, input.email, input.phone);
  const midtransPayload = {
    transaction_details: {
      order_id: midtransOrderId,
      gross_amount: input.amount,
    },
    customer_details: customerDetails,
    item_details: [
      {
        id: normalizedBookingId,
        name: DEFAULT_FIELD_NAME,
        price: input.amount,
        quantity: 1,
      },
    ],
    callbacks: {
      finish: `${appBaseUrl}/payment/success?transactionId=${encodeURIComponent(uniqueTransactionId)}`,
      error: `${appBaseUrl}/payment/failure?transactionId=${encodeURIComponent(uniqueTransactionId)}`,
      pending: `${appBaseUrl}/payment/success?transactionId=${encodeURIComponent(uniqueTransactionId)}`,
    },
    notification_url: notificationUrl,
    expiry: {
      unit: "minutes",
      duration: 15,
    },
    };

  // Create a local payment record first so webhooks can map to it even if delivered early.
  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  let paymentRecord = null;

  if (existingPayment) {
    paymentRecord = await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        transactionId: uniqueTransactionId,
        midtransOrderId: midtransOrderId,
        paymentMethod: input.paymentMethod as PaymentMethod,
        amount: input.amount,
        status: "pending",
        provider: "Midtrans",
        expiredAt: expiry,
        updatedAt: new Date(),
      },
    });
  } else {
    paymentRecord = await prisma.payment.create({
      data: {
        bookingId: normalizedBookingId,
        transactionId: uniqueTransactionId,
        midtransOrderId: midtransOrderId,
        paymentMethod: input.paymentMethod as PaymentMethod,
        amount: input.amount,
        status: "pending",
        provider: "Midtrans",
        expiredAt: expiry,
      },
    });
  }

  // Call Midtrans to create transaction (order_id matches our transaction id)
  let midtransResponse;
  try {
    midtransResponse = await createMidtransTransaction(midtransPayload);
  } catch (err) {
    // If Midtrans creation fails, mark payment as failed and rethrow
    await prisma.payment.update({ where: { id: paymentRecord.id }, data: { status: "failed", updatedAt: new Date() } });
    throw err;
  }

  // Persist Midtrans response (snap token / url)
  paymentRecord = await prisma.payment.update({
    where: { id: paymentRecord.id },
    data: {
      snapToken: midtransResponse.token,
      snapUrl: midtransResponse.redirect_url,
      midtransOrderId: midtransOrderId,
      updatedAt: new Date(),
    },
  });

  const invoiceSubtotal = Number.isFinite(Number(input.subtotal)) && Number(input.subtotal) > 0 ? Math.floor(Number(input.subtotal)) : booking.totalPrice;
  const invoiceDiscount = Number.isFinite(Number(input.discount)) && Number(input.discount) > 0 ? Math.min(Math.floor(Number(input.discount)), invoiceSubtotal) : 0;
  await prisma.invoice.upsert({
    where: { bookingId: booking.id },
    update: {
      paymentId: paymentRecord.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      subtotal: invoiceSubtotal,
      discount: invoiceDiscount,
      total: booking.totalPrice,
      status: "issued",
      updatedAt: new Date(),
    },
    create: {
      invoiceNumber: buildInvoiceNumber(),
      bookingId: booking.id,
      paymentId: paymentRecord.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      subtotal: invoiceSubtotal,
      discount: invoiceDiscount,
      total: booking.totalPrice,
      status: "issued",
    },
  });

  return {
    transactionId: uniqueTransactionId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    paymentMethod: input.paymentMethod as PaymentMethod,
    amount: input.amount,
    status: "pending",
    providerName: "Midtrans",
    snapUrl: midtransResponse.redirect_url,
    snapToken: midtransResponse.token,
    existing: false,
  };
}

export async function reconcilePaymentStatus(transactionId: string, status?: string) {
  if (!transactionId) {
    return null;
  }

  const payment = await findPaymentByIdentifier(transactionId);
  if (!payment) {
    return normalizePaymentStatus(status ?? "") || null;
  }

  const normalized = normalizePaymentStatus(status ?? "");

  if (normalized !== "pending") {
    await processWebhookEvent(payment.transactionId, normalized);
    return normalized;
  }

  if (payment.status === "success" && payment.booking.status !== "confirmed") {
    await processWebhookEvent(payment.transactionId, "success");
    return "success";
  }

  if (!payment.midtransOrderId) {
    return payment.status || normalized || null;
  }

  try {
    const midtransResponse = await getMidtransTransactionStatus(payment.midtransOrderId);
    const liveStatus = normalizePaymentStatus(resolveMidtransTransactionStatus(midtransResponse));

    if (liveStatus !== "pending") {
      await processWebhookEvent(payment.transactionId, liveStatus);
      return liveStatus;
    }
  } catch (error) {
    console.warn("[payment-service] Midtrans status lookup failed", {
      transactionId,
      midtransOrderId: payment.midtransOrderId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return payment.status || normalized || null;
}

export function shouldReclaimBookingStatus(status: string | undefined | null): boolean {
  const normalized = status?.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return ["expired", "cancelled", "refunded"].includes(normalized);
}

export function resolvePaymentUpdateTransactionId(
  inputIdentifier: string,
  payment: { transactionId: string; midtransOrderId?: string | null }
): string {
  if (payment?.transactionId) {
    return payment.transactionId;
  }

  return inputIdentifier;
}

export async function syncBookingStatusesFromPayments() {
  const payments = await prisma.payment.findMany({
    include: { booking: true },
    orderBy: { createdAt: "desc" },
  });

  for (const payment of payments) {
    const bookingStatusMap: Record<PaymentStatus, BookingStatus> = {
      pending: "pending",
      success: "confirmed",
      failed: "cancelled",
      expired: "expired",
      cancelled: "cancelled",
      refunded: "refunded",
    };

    const nextBookingStatus = bookingStatusMap[payment.status as PaymentStatus] ?? payment.booking.status;

    if (payment.booking.status !== nextBookingStatus) {
      await prisma.booking.update({
        where: { id: payment.booking.id },
        data: { status: nextBookingStatus, updatedAt: new Date() },
      });
    }
  }
}

export async function expirePendingPayments() {
  const now = new Date();
  await expireStalePendingBookings(now);
  await syncBookingStatusesFromPayments();

  const overduePayments = await prisma.payment.findMany({
    where: {
      status: "pending",
      expiredAt: { lt: now },
    },
    select: {
      id: true,
      bookingId: true,
    },
  });

  if (overduePayments.length === 0) {
    return;
  }

  const bookingIds = overduePayments.map((payment) => payment.bookingId);
  const paymentIds = overduePayments.map((payment) => payment.id);

  await prisma.$transaction([
    prisma.payment.updateMany({
      where: { id: { in: paymentIds } },
      data: { status: "expired", updatedAt: now, expiredAt: now },
    }),
    prisma.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: { status: "expired", updatedAt: now },
    }),
    prisma.invoice.updateMany({
      where: { bookingId: { in: bookingIds } },
      data: { status: "issued", updatedAt: now },
    }),
  ]);

}

export async function getPaymentTransaction(transactionId: string) {
  await expirePendingPayments();

  const payment = await findPaymentByIdentifier(transactionId);

  if (!payment) {
    throw new Error("Payment record not found.");
  }

  const result = await prisma.payment.findUnique({
    where: { id: payment.id },
    include: {
      booking: true,
      invoice: true,
    },
  });

  if (!result) {
    throw new Error("Payment record not found.");
  }

  return result;
}

export async function getPaymentTransactionByBookingId(bookingId: string) {
  await expirePendingPayments();

  const payment = await prisma.payment.findFirst({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
    include: {
      booking: true,
      invoice: true,
    },
  });

  return payment;
}

export async function getPaymentSimulationDetails(method: PaymentMethod): Promise<PaymentSimulationDetails> {
  return paymentProvider.getSimulationDetails(method);
}

export async function processWebhookEvent(transactionId: string, status: PaymentStatus, eventHash?: string) {
  const normalized = normalizePaymentStatus(status);

  const payment = await findPaymentByIdentifier(transactionId);

  if (!payment) {
    throw new Error("Payment record not found.");
  }

  const booking = payment.booking;
  const now = new Date();

  const updateData: {
    status: PaymentStatus;
    updatedAt: Date;
    paidAt?: Date;
    expiredAt?: Date;
  } = {
    status: normalized,
    updatedAt: now,
  };

  if (normalized === "success") {
    updateData.paidAt = now;
  }

  if (["expired", "failed", "cancelled"].includes(normalized)) {
    updateData.expiredAt = now;
  }

  const paymentUpdateTransactionId = resolvePaymentUpdateTransactionId(transactionId, payment);

  // Perform DB updates atomically to avoid partially applied state.
  const bookingStatusMap: Record<PaymentStatus, BookingStatus> = {
    pending: "pending",
    success: "confirmed",
    failed: "cancelled",
    expired: "expired",
    cancelled: "cancelled",
    refunded: "refunded",
  };

  const nextBookingStatus = bookingStatusMap[normalized] ?? booking.status;

  const invoiceUpsert = prisma.invoice.upsert({
    where: { bookingId: booking.id },
    update: {
      status: normalized === "success" ? "paid" : "issued",
      paidAt: normalized === "success" ? now : undefined,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      subtotal: booking.totalPrice,
      total: booking.totalPrice,
      updatedAt: now,
    },
    create: {
      invoiceNumber: buildInvoiceNumber(),
      bookingId: booking.id,
      paymentId: payment.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      subtotal: booking.totalPrice,
      total: booking.totalPrice,
      status: normalized === "success" ? "paid" : "issued",
    },
  });

  const [updatedPayment, _updatedBooking, _upsertedInvoice] = await prisma.$transaction([
    prisma.payment.update({ where: { transactionId: paymentUpdateTransactionId }, data: updateData }),
    prisma.booking.update({ where: { id: booking.id }, data: { status: nextBookingStatus, updatedAt: now } }),
    invoiceUpsert,
  ]);

  // Mark webhook event as processed if provided
  if (eventHash) {
    try {
      await prisma.webhookEvent.updateMany({ where: { eventHash }, data: { processed: true, processedAt: now } });
    } catch (err) {
      console.warn("[payment-service] Failed to mark webhook event processed", { err: err instanceof Error ? err.message : String(err), eventHash });
    }
  }

  // Send notifications after DB transaction commits
  if (normalized === "success") {
    const invoice = await prisma.invoice.findUnique({ where: { bookingId: booking.id } });

    const attachment = invoice
      ? await buildInvoiceAttachmentAuto({
          invoiceNumber: invoice.invoiceNumber,
          customerName: invoice.customerName ?? booking.customerName,
          customerEmail: invoice.customerEmail ?? booking.customerEmail,
          customerPhone: invoice.customerPhone ?? booking.customerPhone,
          status: invoice.status,
          subtotal: Number(invoice.subtotal ?? 0),
          discount: invoice.discount != null ? Number(invoice.discount) : null,
          tax: invoice.tax != null ? Number(invoice.tax) : null,
          total: Number(invoice.total ?? invoice.subtotal ?? 0),
          issuedAt: invoice.issuedAt,
          paidAt: invoice.paidAt ?? updatedPayment.paidAt ?? null,
          booking: {
            id: booking.id,
            bookingDate: booking.bookingDate,
            startTime: booking.startTime,
            endTime: booking.endTime,
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            customerPhone: booking.customerPhone,
            durationHours: booking.durationHours,
            totalPrice: booking.totalPrice,
          },
          payment: {
            transactionId: updatedPayment.transactionId,
            paymentMethod: updatedPayment.paymentMethod,
            provider: updatedPayment.provider,
            paidAt: updatedPayment.paidAt ?? null,
            midtransOrderId: updatedPayment.midtransOrderId ?? null,
          },
        })
      : undefined;

    await sendNotification("email-confirmation", {
      bookingId: booking.id,
      invoiceNumber: invoice?.invoiceNumber,
      amount: updatedPayment.amount,
      customerName: booking.customerName,
      fieldName: DEFAULT_FIELD_NAME,
      startAt: `${formatJakartaDateKey(booking.bookingDate)} ${booking.startTime} WIB`,
      endAt: `${formatJakartaDateKey(booking.bookingDate)} ${booking.endTime} WIB`,
      email: booking.customerEmail ?? undefined,
      phone: booking.customerPhone,
      attachment,
    });
  }

  if (["cancelled", "expired", "failed"].includes(normalized)) {
    await sendNotification("booking-cancelled", {
      bookingId: booking.id,
      reason: normalized === "expired" ? "payment expired" : normalized === "failed" ? "payment failed" : "payment was cancelled",
    });
  }
}

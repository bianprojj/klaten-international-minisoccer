import { Resend } from "resend";

export type NotificationEvent =
  | "email-confirmation"
  | "whatsapp-confirmation"
  | "booking-reminder"
  | "payment-reminder"
  | "booking-cancelled"
  | "refund-processed";

export type NotificationChannel = "email" | "whatsapp";

export interface NotificationPayload {
  customerName?: string;
  email?: string;
  phone?: string;
  bookingId?: string;
  fieldName?: string;
  startAt?: string;
  endAt?: string;
  amount?: number;
  orderId?: string;
  reason?: string;
  invoiceNumber?: string;
  attachment?: {
    filename: string;
    content: string;
  };
}

export interface NotificationResult {
  success: boolean;
  id: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  message: string;
  provider: string;
  queuedAt: string;
}

const notificationHistory: NotificationResult[] = [];

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function buildMessage(event: NotificationEvent, payload: NotificationPayload) {
  const customerName = payload.customerName ?? "Guest";
  const bookingId = payload.bookingId ?? payload.orderId ?? "N/A";

  switch (event) {
    case "email-confirmation":
      return {
        channel: "email" as const,
        message: `Hi ${customerName}, your booking ${bookingId} has been confirmed for ${payload.fieldName ?? "the selected field"}.`,
      };
    case "whatsapp-confirmation":
      return {
        channel: "whatsapp" as const,
        message: `WhatsApp sent to ${payload.phone ?? "+628000000000"}: Hi ${customerName}, your booking ${bookingId} is confirmed.`,
      };
    case "booking-reminder":
      return {
        channel: "whatsapp" as const,
        message: `Reminder: ${customerName}, your booking ${bookingId} is scheduled for ${payload.startAt ?? "soon"}.`,
      };
    case "payment-reminder":
      return {
        channel: "email" as const,
        message: `Payment reminder: ${customerName}, please complete payment for order ${bookingId} before it expires.`,
      };
    case "booking-cancelled":
      return {
        channel: "email" as const,
        message: `Booking ${bookingId} has been cancelled${payload.reason ? ` because ${payload.reason}` : ""}.`,
      };
    case "refund-processed":
      return {
        channel: "whatsapp" as const,
        message: `Refund processed for ${customerName} for order ${bookingId}.`,
      };
    default:
      return {
        channel: "email" as const,
        message: `Notification sent for ${event}.`,
      };
  }
}

function getEmailSubject(event: NotificationEvent) {
  switch (event) {
    case "email-confirmation":
      return "Booking confirmed";
    case "payment-reminder":
      return "Payment reminder";
    case "booking-cancelled":
      return "Booking cancelled";
    default:
      return "Notification from MiniSoccer";
  }
}

async function sendEmail(event: NotificationEvent, payload: NotificationPayload) {
  const to = payload.email;
  const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim();
  const from = configuredFrom && configuredFrom.includes("<") ? configuredFrom : configuredFrom ? configuredFrom : "MiniSoccer <onboarding@resend.dev>";
  const resendClient = getResendClient();

  if (!to) {
    throw new Error("Missing email recipient configuration.");
  }

  if (!resendClient) {
    throw new Error("Resend API key is not configured.");
  }

  console.info("[notifications] Preparing email send", {
    event,
    to,
    from,
    configuredFrom: configuredFrom ?? null,
    timestamp: new Date().toISOString(),
  });

  const { message } = buildMessage(event, payload);
  const subject = getEmailSubject(event);

  const body = event === "email-confirmation"
    ? `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;">
        <h2 style="margin-bottom:12px;">Booking Confirmed</h2>
        <p>${message}</p>
        <p><strong>Customer:</strong> ${payload.customerName ?? "Guest"}</p>
        <p><strong>Email:</strong> ${payload.email ?? "N/A"}</p>
        <p><strong>Phone:</strong> ${payload.phone ?? "N/A"}</p>
        <p><strong>Field:</strong> ${payload.fieldName ?? "N/A"}</p>
        <p><strong>Schedule:</strong> ${payload.startAt ?? "N/A"} - ${payload.endAt ?? "N/A"}</p>
        <p><strong>Amount:</strong> Rp ${payload.amount?.toLocaleString("id-ID") ?? "0"}</p>
        <p><strong>Booking ID:</strong> ${payload.bookingId ?? "N/A"}</p>
        ${payload.invoiceNumber ? `<p><strong>Invoice:</strong> ${payload.invoiceNumber}</p>` : ""}
      </div>`
    : `<p>${message}</p>`;

  const emailPayload: Parameters<typeof resendClient.emails.send>[0] = {
    from,
    to,
    subject,
    html: body,
  };

  if (payload.attachment) {
    emailPayload.attachments = [
      {
        filename: payload.attachment.filename,
        content: payload.attachment.content,
      },
    ];
  }

  console.info("[notifications] Sending email", {
    event,
    recipient: to,
    hasAttachment: Boolean(payload.attachment),
    attachmentName: payload.attachment?.filename,
    attachmentBytes: payload.attachment?.content?.length ?? 0,
    timestamp: new Date().toISOString(),
  });

  const response = await resendClient.emails.send(emailPayload);

  console.info("[notifications] Email send response", {
    event,
    recipient: to,
    sender: from,
    response,
    timestamp: new Date().toISOString(),
  });

  if (typeof response === "object" && response && "error" in response && response.error) {
    const resendError = response.error as { message?: string };
    throw new Error(resendError.message ?? "Resend email send failed.");
  }
}

export async function sendNotification(event: NotificationEvent, payload: NotificationPayload): Promise<NotificationResult> {
  const { channel, message } = buildMessage(event, payload);
  const result: NotificationResult = {
    success: true,
    id: `notification-${Date.now()}`,
    event,
    channel,
    message,
    provider: "demo-notifier",
    queuedAt: new Date().toISOString(),
  };

  if (channel === "email") {
    try {
      await sendEmail(event, payload);
      result.provider = "resend";
    } catch (error) {
      return {
        ...result,
        success: false,
        message: `Resend email failed: ${(error as Error).message}`,
      };
    }
  }

  notificationHistory.push(result);
  return result;
}

export function getNotificationHistory() {
  return [...notificationHistory].reverse();
}

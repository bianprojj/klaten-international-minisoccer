import { Resend } from "resend";
import { siteConfig } from "./site-config";

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
  subtotal?: number;
  discount?: number;
  adminFee?: number;
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

function getEmailSubject(event: NotificationEvent, payload?: NotificationPayload) {
  switch (event) {
    case "email-confirmation":
      return payload?.invoiceNumber ? `Booking Dikonfirmasi – ${payload.invoiceNumber}` : "Booking Dikonfirmasi";
    case "payment-reminder":
      return "Payment reminder";
    case "booking-cancelled":
      return "Booking cancelled";
    default:
      return "Notification from MiniSoccer";
  }
}

function formatRupiah(amount?: number): string {
  return `Rp ${Math.round(Number(amount) || 0).toLocaleString("id-ID")}`;
}

function buildConfirmationHtml(payload: NotificationPayload): string {
  const siteUrl = siteConfig.url.replace(/\/+$/, "");
  const logoUrl = `${siteUrl}/logo-invoice-400.png`;
  const subtotal = payload.subtotal ?? payload.amount ?? 0;
  const discount = payload.discount ?? 0;
  const adminFee = payload.adminFee ?? 0;
  const total = payload.amount ?? 0;
  const invoiceUrl = payload.invoiceNumber
    ? `${siteUrl}/api/invoices/download?invoiceNumber=${encodeURIComponent(payload.invoiceNumber)}`
    : `${siteUrl}/booking-history`;

  return `<!doctype html>
<html lang="id">
<body style="margin:0;padding:0;background-color:#F1EED9;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Booking Anda dikonfirmasi. Invoice PDF terlampir di email ini.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1EED9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background-color:#005136;padding:28px 32px;text-align:center;">
              <img src="${logoUrl}" alt="Klaten International Minisoccer" width="72" style="display:block;margin:0 auto 12px;border:0;" />
              <div style="font-family:Arial,sans-serif;font-size:22px;font-weight:bold;color:#FFFFFF;">Booking Dikonfirmasi</div>
              <div style="font-family:Arial,sans-serif;font-size:13px;color:#C9D651;margin-top:6px;">Terima kasih, ${payload.customerName ?? "Guest"}! Lapangan siap untuk Anda.</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;font-family:Arial,sans-serif;color:#1A1F4D;">
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">Halo <strong>${payload.customerName ?? "Guest"}</strong>,<br />Pembayaran Anda telah kami terima. Berikut ringkasan booking:</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1EED9;border-radius:12px;">
                <tr><td style="padding:14px 16px;font-size:13px;">
                  <div style="margin-bottom:8px;"><span style="color:#5b6478;">Lapangan</span><br /><strong>${payload.fieldName ?? "Mini Soccer"}</strong></div>
                  <div style="margin-bottom:8px;"><span style="color:#5b6478;">Jadwal</span><br /><strong>${payload.startAt ?? "-"} — ${payload.endAt ?? "-"}</strong></div>
                  <div><span style="color:#5b6478;">ID Booking</span><br /><strong>${payload.bookingId ?? "-"}</strong></div>
                </td></tr>
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;font-size:13px;">
                <tr><td style="padding:4px 0;color:#5b6478;">Subtotal</td><td align="right">${formatRupiah(subtotal)}</td></tr>
                ${discount > 0 ? `<tr><td style="padding:4px 0;color:#005136;">Diskon referral</td><td align="right" style="color:#005136;">-${formatRupiah(discount)}</td></tr>` : ""}
                ${adminFee > 0 ? `<tr><td style="padding:4px 0;color:#5b6478;">Admin fee (2%)</td><td align="right">${formatRupiah(adminFee)}</td></tr>` : ""}
                <tr><td style="padding:8px 0 0;font-size:16px;font-weight:bold;">Total Lunas</td><td align="right" style="padding:8px 0 0;font-size:16px;font-weight:bold;color:#005136;">${formatRupiah(total)}</td></tr>
                ${payload.invoiceNumber ? `<tr><td style="padding:4px 0;color:#5b6478;">No. Invoice</td><td align="right"><strong>${payload.invoiceNumber}</strong></td></tr>` : ""}
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr>
                  <td align="center" style="padding-bottom:10px;">
                    <a href="${invoiceUrl}" style="display:inline-block;background-color:#C9D651;color:#1A1F4D;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 28px;border-radius:999px;">Download Invoice (PDF)</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${siteUrl}/booking-history" style="font-size:13px;color:#005136;">Lihat Riwayat Booking</a>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;font-size:12px;color:#5b6478;">File PDF invoice juga terlampir di email ini. Sampai jumpa di lapangan!</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#005136;padding:18px 32px;text-align:center;font-family:Arial,sans-serif;font-size:11px;color:#FFFFFF;">
              ${siteConfig.address}<br />Telp ${siteConfig.phone} &nbsp;•&nbsp; ${siteConfig.email}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
  const subject = getEmailSubject(event, payload);

  const body = event === "email-confirmation" ? buildConfirmationHtml(payload) : `<p>${message}</p>`;

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
  if (notificationHistory.length > 200) notificationHistory.splice(0, notificationHistory.length - 200);
  return result;
}

export function getNotificationHistory() {
  return [...notificationHistory].reverse();
}

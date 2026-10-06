import fs from "node:fs";
import path from "node:path";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { InvoicePdfInput } from "./invoice-pdf";
import { siteConfig } from "./site-config";

const GREEN: [number, number, number] = [0, 81, 54];
const LIME: [number, number, number] = [201, 214, 81];
const INK: [number, number, number] = [26, 31, 77];
const MUTED: [number, number, number] = [100, 110, 130];
const WHITE: [number, number, number] = [255, 255, 255];

function rp(amount: number): string {
  return "Rp " + Math.round(Number(amount) || 0).toLocaleString("id-ID");
}

function formatDate(value: Date | null | undefined): string {
  if (!value || Number.isNaN(new Date(value).getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: Date | null | undefined): string {
  if (!value || Number.isNaN(new Date(value).getTime())) return "-";
  const parts = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("day")}-${get("month")}-${get("year")} ${get("hour")}:${get("minute")} WIB`;
}

function loadLogoDataUrl(): string | null {
  try {
    const filePath = path.join(process.cwd(), "public", "logo-invoice-400.png");
    const buf = fs.readFileSync(filePath);
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/**
 * Build a branded A4 invoice PDF with graphic header/footer.
 * Free + unlimited (jsPDF, no browser/Chromium needed).
 */
export function buildInvoicePdfBufferJsPdf(invoice: InvoicePdfInput): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pageWidth = 210;
  const margin = 14;
  const right = pageWidth - margin;

  const customerName = invoice.customerName ?? "Guest";
  const customerEmail = invoice.customerEmail ?? "-";
  const customerPhone = invoice.customerPhone ?? "-";
  const subtotal = Number(invoice.subtotal ?? 0);
  const discount = Number(invoice.discount ?? 0);
  const adminFee = Math.max(0, Math.round(Number(invoice.total ?? 0) - subtotal + (discount || 0)));
  const total = Number(invoice.total ?? subtotal);
  const isPaid = String(invoice.status ?? "").toLowerCase() === "paid";
  const bookingDate = invoice.booking.bookingDate ? new Date(invoice.booking.bookingDate) : null;
  const dateLabel = bookingDate
    ? new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(bookingDate)
    : "-";

  // ── Header banner ──────────────────────────────────────────────
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageWidth, 42, "F");

  const logo = loadLogoDataUrl();
  doc.setFillColor(...WHITE);
  doc.roundedRect(margin, 9, 36, 24, 2.5, 2.5, "F");
  if (logo) {
    // logo persegi: 19x19 rata tengah kotak putih 36x24
    doc.addImage(logo, "PNG", margin + (36 - 19) / 2, 9 + (24 - 19) / 2, 19, 19);
  }

  doc.setTextColor(...WHITE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text("INVOICE", right, 18, { align: "right" });
  doc.setFontSize(10.5);
  doc.text(invoice.invoiceNumber, right, 24.5, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`Tanggal: ${formatDate(invoice.issuedAt)}`, right, 29.5, { align: "right" });

  const badgeLabel = isPaid ? "LUNAS" : "BELUM LUNAS";
  const badgeWidth = 34;
  const badgeX = right - badgeWidth;
  if (isPaid) {
    doc.setFillColor(...LIME);
    doc.roundedRect(badgeX, 33, badgeWidth, 6.5, 2, 2, "F");
    doc.setTextColor(...GREEN);
  } else {
    doc.setFillColor(...WHITE);
    doc.roundedRect(badgeX, 33, badgeWidth, 6.5, 2, 2, "F");
    doc.setTextColor(...GREEN);
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(badgeLabel, badgeX + badgeWidth / 2, 37.6, { align: "center" });

  // ── Pihak & detail booking ─────────────────────────────────────
  let y = 52;
  doc.setTextColor(...GREEN);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Ditagihkan kepada", margin, y);
  doc.text("Detail Booking", 118, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...INK);
  doc.text(customerName, margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...MUTED);
  doc.text(customerEmail, margin, y);
  y += 4.5;
  doc.text(customerPhone, margin, y);

  let ry = 58;
  const detailRows: Array<[string, string]> = [
    ["Tanggal", dateLabel],
    ["Jam", `${invoice.booking.startTime ?? "-"} - ${invoice.booking.endTime ?? "-"} WIB`],
    ["Durasi", invoice.booking.durationHours ? `${invoice.booking.durationHours} jam` : "-"],
    ["Metode", invoice.payment.paymentMethod ?? "-"],
  ];
  doc.setFontSize(9.5);
  for (const [label, value] of detailRows) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(label, 118, ry);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...INK);
    const lines = doc.splitTextToSize(value, 78);
    doc.text(lines, 150, ry);
    ry += 4.5 * (Array.isArray(lines) ? lines.length : 1);
  }

  // ── Tabel item ─────────────────────────────────────────────────
  const itemDesc = `Sewa Lapangan Mini Soccer 5v5\n${dateLabel} • ${invoice.booking.startTime ?? "-"}-${invoice.booking.endTime ?? "-"} WIB`;
  autoTable(doc, {
    startY: Math.max(y, ry) + 8,
    margin: { left: margin, right: margin },
    head: [["Deskripsi", "Jumlah"]],
    body: [[itemDesc, `1 x ${rp(subtotal)}`]],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9.5, textColor: INK, cellPadding: 3.5, lineColor: [220, 228, 222], lineWidth: 0.2 },
    headStyles: { fillColor: GREEN, textColor: WHITE, fontStyle: "bold", fontSize: 10 },
    columnStyles: { 0: { cellWidth: 128 }, 1: { halign: "right", cellWidth: 54 } },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cursorY = (doc as any).lastAutoTable.finalY + 8;
  const moneyRow = (label: string, value: string, bold = false, big = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(big ? 13 : 10);
    doc.setTextColor(...(bold ? GREEN : MUTED));
    doc.text(label, 138, cursorY);
    doc.setTextColor(...(bold ? GREEN : INK));
    doc.text(value, right, cursorY, { align: "right" });
    cursorY += big ? 7 : 5.5;
  };
  moneyRow("Subtotal", rp(subtotal));
  if (discount > 0) moneyRow("Diskon", `- ${rp(discount)}`);
  if (adminFee > 0) moneyRow("Admin fee (2%)", rp(adminFee));
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.4);
  doc.line(138, cursorY - 1.5, right, cursorY - 1.5);
  cursorY += 2;
  moneyRow("TOTAL", rp(total), true, true);

  cursorY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`ID Transaksi: ${invoice.payment.transactionId}`, margin, cursorY);
  cursorY += 4.5;
  if (invoice.payment.midtransOrderId && invoice.payment.midtransOrderId !== invoice.payment.transactionId) {
    doc.text(`Order ID: ${invoice.payment.midtransOrderId}`, margin, cursorY);
    cursorY += 4.5;
  }
  if (invoice.paidAt || invoice.payment.paidAt) {
    doc.text(`Dibayar: ${formatDateTime(invoice.paidAt ?? invoice.payment.paidAt ?? null)}`, margin, cursorY);
  }

  // ── Footer ─────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...GREEN);
  doc.text("Terima kasih atas kepercayaan Anda.", pageWidth / 2, 258, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("Invoice ini dibuat otomatis dan sah tanpa tanda tangan.", pageWidth / 2, 263.5, { align: "center" });

  doc.setFillColor(...GREEN);
  doc.rect(0, 275, pageWidth, 22, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(8.5);
  doc.text(siteConfig.address, pageWidth / 2, 283, { align: "center" });
  doc.text(`Telp ${siteConfig.phone}  •  IG ${siteConfig.instagram.replace("https://www.instagram.com/", "@").replace("/", "")}  •  ${siteConfig.email}`, pageWidth / 2, 288.5, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}

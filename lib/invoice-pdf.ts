import { DEFAULT_FIELD_NAME } from "@/lib/venue";

export interface InvoicePdfInput {
  invoiceNumber: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  status?: string | null;
  subtotal: number;
  discount?: number | null;
  tax?: number | null;
  total: number;
  issuedAt: Date;
  paidAt?: Date | null;
  booking: {
    id: string;
    bookingDate: Date;
    startTime: string;
    endTime: string;
    customerName?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    durationHours?: number | null;
    totalPrice?: number | null;
  };
  payment: {
    transactionId: string;
    paymentMethod?: string | null;
    provider?: string | null;
    paidAt?: Date | null;
    midtransOrderId?: string | null;
  };
}

function escapePdfText(text: string) {
  return text.replace(/([\\()])/g, "\\$1");
}

function writeText(text: string, x: number, y: number, fontSize = 12) {
  return `BT /F1 ${fontSize} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

function writeLine(x1: number, y1: number, x2: number, y2: number) {
  return `${x1} ${y1} m ${x2} ${y2} l S`;
}

function writeRect(x: number, y: number, width: number, height: number) {
  return `${x} ${y} ${width} ${height} re S`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function createInvoicePdf(contentLines: string[]) {
  const stream = contentLines.join("\n");
  const streamBytes = Buffer.from(stream, "utf8");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";

  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";

  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";

  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += `4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`;
  pdf += stream;
  pdf += "endstream\nendobj\n";

  offsets.push(Buffer.byteLength(pdf, "utf8"));
  pdf += "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += "xref\n0 6\n0000000000 65535 f \n";
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

export function generateInvoicePdfBuffer(invoice: InvoicePdfInput) {
  const bookingDate = formatDate(invoice.booking.bookingDate);
  const issueDate = formatDate(invoice.issuedAt);
  const paidDate = invoice.paidAt ? formatDate(invoice.paidAt) : invoice.payment.paidAt ? formatDate(invoice.payment.paidAt) : "-";
  const statusText = (invoice.status ?? "pending").toUpperCase();
  const statusBadge = statusText === "SUCCESS" ? "PAID" : statusText === "FAILED" ? "UNPAID" : statusText;

  const subtotal = Number(invoice.subtotal ?? 0);
  const discount = Number(invoice.discount ?? 0);
  const tax = Number(invoice.tax ?? 0);
  const total = Number(invoice.total ?? subtotal - discount + tax);

  const customerName = (invoice.customerName || invoice.booking.customerName || "Guest").toString().trim();
  const customerEmail = (invoice.customerEmail || invoice.booking.customerEmail || "-").toString().trim();
  const customerPhone = (invoice.customerPhone || invoice.booking.customerPhone || "-").toString().trim();
  const paymentMethod = invoice.payment.paymentMethod ?? "Midtrans";
  const provider = invoice.payment.provider ?? "Midtrans";
  const fieldName = DEFAULT_FIELD_NAME;
  const timeRange = `${invoice.booking.startTime} - ${invoice.booking.endTime}`;
  const durationHours = Math.max(1, Math.ceil(
    ((new Date(`1970-01-02T${invoice.booking.endTime}:00`).getTime() - new Date(`1970-01-02T${invoice.booking.startTime}:00`).getTime()) / 3600000)
  ));

  const paymentLabel = paymentMethod || "Midtrans";
  const summaryRows = [
    { label: "Subtotal", value: formatCurrency(subtotal) },
    ...(discount > 0 ? [{ label: "Discount", value: `- ${formatCurrency(discount)}` }] : []),
    ...(tax > 0 ? [{ label: "Tax", value: formatCurrency(tax) }] : []),
    { label: "Total", value: formatCurrency(total) },
  ];

  const headerLines = [
    writeRect(32, 760, 530, 64),
    writeLine(32, 760, 562, 760),
    writeLine(32, 824, 562, 824),
    writeRect(32, 760, 120, 64),
    writeText("KIM", 56, 792, 26),
    writeText("Klaten International Minisoccer", 170, 794, 10),
    writeText("Jl. Stadion, Klaten", 170, 782, 7),
    writeText("hello@minisoccer.id", 170, 772, 7),
    writeText("INVOICE", 470, 798, 18),
    writeText(`No. ${invoice.invoiceNumber}`, 464, 786, 8),
    writeText(`Date: ${issueDate}`, 464, 774, 7),
    // status badge background (filled light gray)
    `0.88 g 444 760 84 18 re f 0 g`,
    writeText(statusBadge, 464, 764, 8),
  ];

  const customerLines = [
    writeRect(32, 620, 250, 108),
    writeText("CUSTOMER", 48, 705, 10),
    writeLine(32, 698, 282, 698),
    writeText("Name", 48, 684, 8),
    writeText(customerName.substring(0, 25), 120, 684, 8),
  ];

  const bookingLines = [
    writeRect(312, 620, 250, 108),
    writeText("BOOKING", 328, 705, 10),
    writeLine(312, 698, 562, 698),
    writeText("Booking ID", 328, 688, 7),
    writeText(invoice.booking.id.substring(0, 20) + "...", 392, 688, 7),
    writeText("Date", 328, 674, 8),
    writeText(bookingDate, 392, 674, 8),
    writeText("Time", 328, 660, 8),
    writeText(timeRange, 392, 660, 8),
    writeText("Duration", 328, 646, 8),
    writeText(`${invoice.booking.durationHours ?? durationHours} Hours`, 392, 646, 8),
    writeText("Payment", 328, 632, 8),
    writeText(paymentLabel, 392, 632, 8),
  ];

  const tableHeader = [
    writeRect(32, 470, 530, 118),
    writeText("BOOKING SUMMARY", 48, 566, 11),
    writeLine(32, 560, 562, 560),
    writeText("DESCRIPTION", 48, 545, 8),
    writeText("QTY", 368, 545, 8),
    writeText("UNIT PRICE", 420, 545, 8),
    writeText("AMOUNT", 485, 545, 8),
    writeLine(32, 536, 562, 536),
  ];

  const bookingRow = [
    writeText(fieldName.substring(0, 40), 48, 516, 9),
    writeText("1", 378, 516, 9),
    writeText(formatCurrency(subtotal), 424, 516, 9),
    writeText(formatCurrency(subtotal), 487, 516, 9),
    writeLine(32, 500, 562, 500),
  ];

  const totalsBox = [
    writeRect(342, 294, 220, 136),
    writeLine(342, 416, 562, 416),
    writeText("Subtotal", 358, 404, 8),
    writeText(formatCurrency(subtotal), 470, 404, 8),
    ...(discount > 0 ? [
      writeText("Discount", 358, 390, 8),
      writeText(`-${formatCurrency(discount)}`, 470, 390, 8),
    ] : []),
    ...(tax > 0 ? [
      writeText("Tax", 358, 376, 8),
      writeText(formatCurrency(tax), 470, 376, 8),
    ] : []),
    writeLine(342, 366, 562, 366),
    writeText("GRAND TOTAL", 358, 352, 10),
    writeText(formatCurrency(total), 430, 338, 14),
  ];

  const breakdownLines = [
    writeRect(32, 294, 280, 136),
    writeText("DETAILS", 48, 415, 10),
    writeLine(32, 408, 312, 408),
    writeText(`Booking Date: ${bookingDate}`, 48, 394, 8),
    writeText(`Time Slot: ${timeRange}`, 48, 380, 8),
    writeText(`Provider: ${provider}`, 48, 366, 8),
    writeText(`Transaction ID: ${invoice.payment.transactionId.substring(0, 25)}`, 48, 352, 8),
    writeText(`Invoice No: ${invoice.invoiceNumber}`, 48, 338, 8),
    writeText(`Order ID: ${invoice.payment.midtransOrderId?.substring(0, 25) ?? "-"}`, 48, 324, 8),
  ];

  const amountBreakdown: string[] = [];

  const footer = [
    writeLine(32, 182, 562, 182),
    writeText("Thank you for booking with KIM", 208, 160, 10),
    writeText("@kim.soccerfield • klaten-international-minisoccer.vercel.app", 170, 144, 8),
    writeText("For questions: +62 812-3456-7890", 216, 130, 8),
    writeRect(0, 0, 595, 26),
    writeLine(0, 0, 595, 26),
    writeLine(0, 0, 595, 0),
  ];

  const accentLines = [
    writeLine(0, 0, 90, 26),
    writeLine(0, 26, 90, 0),
    writeLine(510, 0, 595, 26),
    writeLine(510, 26, 595, 0),
  ];

  const lines = [
    ...accentLines,
    ...headerLines,
    ...customerLines,
    ...bookingLines,
    ...tableHeader,
    ...bookingRow,
    ...amountBreakdown,
    ...totalsBox,
    ...breakdownLines,
    ...footer,
  ];

  return createInvoicePdf(lines);
}

export function buildInvoiceAttachment(invoice: InvoicePdfInput) {
  const pdfBuffer = generateInvoicePdfBuffer(invoice);

  return {
    filename: `invoice-${invoice.invoiceNumber}.pdf`,
    content: pdfBuffer.toString("base64"),
  };
}

/** Convert legacy Date-based input to Classic HTML Invoice shape (ISO strings). */
function toClassicInvoicePayload(invoice: InvoicePdfInput) {
  return {
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerName ?? null,
    customerEmail: invoice.customerEmail ?? null,
    customerPhone: invoice.customerPhone ?? null,
    status: invoice.status ?? null,
    subtotal: invoice.subtotal ?? null,
    discount: invoice.discount ?? null,
    tax: invoice.tax ?? null,
    total: invoice.total ?? null,
    issuedAt: invoice.issuedAt ? invoice.issuedAt.toISOString() : null,
    paidAt: invoice.paidAt
      ? invoice.paidAt.toISOString()
      : invoice.payment.paidAt
        ? invoice.payment.paidAt.toISOString()
        : null,
    booking: {
      id: invoice.booking.id,
      bookingDate: invoice.booking.bookingDate ? invoice.booking.bookingDate.toISOString() : null,
      startTime: invoice.booking.startTime ?? null,
      endTime: invoice.booking.endTime ?? null,
      customerName: invoice.booking.customerName ?? null,
      customerEmail: invoice.booking.customerEmail ?? null,
      customerPhone: invoice.booking.customerPhone ?? null,
      durationHours: invoice.booking.durationHours ?? null,
    },
    payment: {
      transactionId: invoice.payment.transactionId ?? null,
      paymentMethod: invoice.payment.paymentMethod ?? null,
      provider: invoice.payment.provider ?? null,
      paidAt: invoice.payment.paidAt ? invoice.payment.paidAt.toISOString() : null,
      midtransOrderId: invoice.payment.midtransOrderId ?? null,
    },
  };
}

/**
 * jsPDF first (fast, no browser), then Classic HTML/Puppeteer, then legacy.
 * Used by live download route + email attachment.
 */
export async function generateInvoicePdfBufferAuto(invoice: InvoicePdfInput): Promise<{ buffer: Buffer; engine: "jspdf" | "classic" | "legacy" }> {
  // Allow emergency opt-out: INVOICE_PDF_ENGINE=legacy forces old generator.
  if (process.env.INVOICE_PDF_ENGINE === "legacy") {
    return { buffer: generateInvoicePdfBuffer(invoice), engine: "legacy" };
  }
  try {
    const mod = await import("./invoice-jspdf");
    return { buffer: mod.buildInvoicePdfBufferJsPdf(invoice), engine: "jspdf" };
  } catch (err) {
    console.warn("[invoice-pdf] jsPDF engine failed, trying classic HTML", {
      invoiceNumber: invoice.invoiceNumber,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  try {
    const mod = await import("./invoice-html-pdf");
    const pdf = await mod.generateInvoicePdfBufferHtml(toClassicInvoicePayload(invoice) as never);
    return { buffer: Buffer.from(pdf), engine: "classic" };
  } catch (err) {
    console.warn("[invoice-pdf] Classic HTML PDF failed, using legacy fallback", {
      invoiceNumber: invoice.invoiceNumber,
      error: err instanceof Error ? err.message : String(err),
    });
    return { buffer: generateInvoicePdfBuffer(invoice), engine: "legacy" };
  }
}

export async function buildInvoiceAttachmentAuto(invoice: InvoicePdfInput) {
  const { buffer, engine } = await generateInvoicePdfBufferAuto(invoice);
  return {
    filename: `invoice-${invoice.invoiceNumber}.pdf`,
    content: buffer.toString("base64"),
    engine,
  };
}

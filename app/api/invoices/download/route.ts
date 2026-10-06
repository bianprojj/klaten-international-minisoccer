import { NextResponse } from "next/server";
import { generateInvoicePdfBuffer, generateInvoicePdfBufferAuto } from "@/lib/invoice-pdf";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const invoiceNumber = url.searchParams.get("invoiceNumber")?.trim();
  const forceLegacy =
    url.searchParams.get("format") === "legacy" ||
    url.searchParams.get("engine") === "legacy" ||
    process.env.INVOICE_PDF_ENGINE === "legacy";

  if (!invoiceNumber) {
    return NextResponse.json({ success: false, message: "Missing invoiceNumber query parameter." }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { invoiceNumber },
    include: { booking: true, payment: true },
  });

  if (!invoice) {
    return NextResponse.json({ success: false, message: "Invoice not found." }, { status: 404 });
  }

  const pdfPayload = {
    invoiceNumber: String(invoice.invoiceNumber),
    customerName: invoice.customerName ?? invoice.booking?.customerName ?? null,
    customerEmail: invoice.customerEmail ?? invoice.booking?.customerEmail ?? null,
    customerPhone: invoice.customerPhone ?? invoice.booking?.customerPhone ?? null,
    status: invoice.status ?? null,
    subtotal: Number(invoice.subtotal ?? 0),
    discount: invoice.discount ?? null,
    tax: invoice.tax ?? null,
    total: Number(invoice.total ?? (invoice.subtotal ?? 0)),
    issuedAt: invoice.issuedAt ? new Date(invoice.issuedAt) : new Date(),
    paidAt: invoice.paidAt ? new Date(invoice.paidAt) : (invoice.payment?.paidAt ? new Date(invoice.payment.paidAt) : null),
    booking: {
      id: String(invoice.booking?.id ?? ''),
      bookingDate: invoice.booking?.bookingDate ? new Date(invoice.booking!.bookingDate) : new Date(),
      startTime: invoice.booking?.startTime ?? '00:00',
      endTime: invoice.booking?.endTime ?? '00:00',
      customerName: invoice.booking?.customerName ?? null,
      customerEmail: invoice.booking?.customerEmail ?? null,
      customerPhone: invoice.booking?.customerPhone ?? null,
      durationHours: invoice.booking?.durationHours ?? null,
      totalPrice: invoice.booking?.totalPrice ?? null,
    },
    payment: {
      transactionId: String(invoice.payment?.transactionId ?? ''),
      paymentMethod: invoice.payment?.paymentMethod ?? null,
      provider: invoice.payment?.provider ?? null,
      paidAt: invoice.payment?.paidAt ? new Date(invoice.payment!.paidAt) : null,
      midtransOrderId: invoice.payment?.midtransOrderId ?? null,
    },
  };

  // Default live: jsPDF, then Classic HTML/Puppeteer, then legacy.
  let pdfBuffer: Buffer;
  let engine: "jspdf" | "classic" | "legacy";
  if (forceLegacy) {
    pdfBuffer = generateInvoicePdfBuffer(pdfPayload);
    engine = "legacy";
  } else {
    const result = await generateInvoicePdfBufferAuto(pdfPayload);
    pdfBuffer = result.buffer;
    engine = result.engine;
  }

  const bodyUint8 = Uint8Array.from(pdfBuffer);

  return new NextResponse(bodyUint8, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      "X-PDF-Engine": engine,
    },
  });
}

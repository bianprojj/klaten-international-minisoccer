import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const testRecipient = process.env.TEST_EMAIL_RECIPIENT ?? "autobot1208@gmail.com";
    const attachmentContent = Buffer.from("This is a test invoice attachment for MiniSoccer booking flow.\n\nCustomer: Test Buyer\nEmail: autobot1208@gmail.com\nBooking: TEST-EMAIL-001\n", "utf8").toString("base64");

    const result = await sendNotification("email-confirmation", {
      customerName: "Test Buyer",
      email: testRecipient,
      phone: "+628123456789",
      bookingId: "TEST-EMAIL-001",
      fieldName: "Mini Soccer Field",
      startAt: "2026-08-30 18:00",
      endAt: "2026-08-30 19:30",
      amount: 275400,
      subtotal: 300000,
      discount: 30000,
      adminFee: 5400,
      invoiceNumber: "INV-TEST-001",
      attachment: {
        filename: "invoice-test-001.pdf",
        content: attachmentContent,
      },
    });

    console.info("[test-email] Notification result", result);

    return NextResponse.json({
      success: true,
      message: "Test email sent with attachment.",
      result,
      recipient: testRecipient,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[test-email] Notification failed", { message, stack: error instanceof Error ? error.stack : undefined });

    return NextResponse.json({
      success: false,
      message,
    }, { status: 500 });
  }
}

import { sendNotification } from "../lib/notifications";

async function testResendEmail() {
  console.log("Testing Resend API with verified domain...");
  console.log("Target email: autobot1208@gmail.com (external email)");

  try {
    const result = await sendNotification("email-confirmation", {
      customerName: "Test User",
      email: "autobot1208@gmail.com",
      phone: "+6281234567890",
      bookingId: "TEST-001",
      fieldName: "Lapangan Test",
      startAt: "2026-09-18T10:00:00",
      endAt: "2026-09-18T12:00:00",
      amount: 250000,
      orderId: "ORDER-TEST-001",
    });

    console.log("Result:", JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("✅ Email sent successfully to external email!");
    } else {
      console.log("❌ Email failed:", result.message);
    }
  } catch (error) {
    console.error("❌ Error:", (error as Error).message);
  }
}

testResendEmail();
export type PaymentMethod =
  | "Midtrans"
  | "QRIS"
  | "GoPay"
  | "Dana"
  | "ShopeePay"
  | "OVO"
  | "BCA"
  | "BNI"
  | "Mandiri"
  | "Offline";

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    ["QRIS", "GoPay", "Dana", "ShopeePay", "OVO", "BCA", "BNI", "Mandiri", "Offline"].includes(value)
  );
}

export type PaymentStatus =
  | "pending"
  | "success"
  | "failed"
  | "expired"
  | "cancelled"
  | "refunded";

export interface PaymentTransactionInput {
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  email?: string;
  phone?: string;
  subtotal?: number;
  discount?: number;
}

export interface PaymentSimulationDetails {
  label: string;
  methodType: "QRIS" | "Virtual Account" | "E-Wallet";
  description: string;
  logo: string;
  accountNumber?: string;
}

export interface PaymentProvider {
  createTransaction(input: PaymentTransactionInput): Promise<{
    transactionId: string;
    expiresAt: string;
    paymentMethod: PaymentMethod;
    amount: number;
    status: PaymentStatus;
    providerName: string;
  }>;

  getSimulationDetails(method: PaymentMethod): PaymentSimulationDetails;
}

const virtualAccountMethods: PaymentMethod[] = ["BCA", "BNI", "Mandiri"];
const eWalletMethods: PaymentMethod[] = ["GoPay", "Dana", "ShopeePay", "OVO"];

function padNumber(value: number, length: number) {
  return value.toString().padStart(length, "0");
}

function buildVirtualAccountNumber(method: PaymentMethod) {
  const prefix = method === "BCA" ? "8888" : method === "BNI" ? "9999" : "7777";
  const randomSuffix = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("");
  return `${prefix}${randomSuffix}`;
}

export class DemoPaymentProvider implements PaymentProvider {
  async createTransaction(input: PaymentTransactionInput): Promise<{
    transactionId: string;
    expiresAt: string;
    paymentMethod: PaymentMethod;
    amount: number;
    status: PaymentStatus;
    providerName: string;
  }> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    const dateKey = `${now.getUTCFullYear()}${padNumber(now.getUTCMonth() + 1, 2)}${padNumber(now.getUTCDate(), 2)}`;
    const transactionId = `DEMO-${dateKey}-${padNumber(Math.floor(Math.random() * 90000) + 10000, 5)}`;

    return {
      transactionId,
      expiresAt: expiresAt.toISOString(),
      paymentMethod: input.paymentMethod,
      amount: input.amount,
      status: "pending",
      providerName: "DemoPaymentProvider",
    };
  }

  getSimulationDetails(method: PaymentMethod): PaymentSimulationDetails {
    const logo = method === "QRIS" ? "QRIS" : eWalletMethods.includes(method) ? method : "VA";
    const methodType: PaymentSimulationDetails["methodType"] = method === "QRIS"
      ? "QRIS"
      : virtualAccountMethods.includes(method)
      ? "Virtual Account"
      : "E-Wallet";

    return {
      label: method,
      methodType,
      description:
        methodType === "QRIS"
          ? "Scan the fake QR code with your mobile app."
          : methodType === "Virtual Account"
          ? "Copy the virtual account number and complete the payment in your banking app."
          : "Open the selected wallet and simulate a successful transfer.",
      logo,
      accountNumber: virtualAccountMethods.includes(method) ? buildVirtualAccountNumber(method) : undefined,
    };
  }
}

import { describe, expect, it } from "vitest";
import { feeTotalPaise, formatPaise, fundingFeeTotalPaise, payerSchema, paymentResultSchema } from "./razorpay-payment";

describe("Funding Programme online payment", () => {
  it("charges ₹999 plus 18% GST, i.e. ₹1,178.82", () => {
    expect(fundingFeeTotalPaise()).toBe(117882);
    expect(formatPaise(fundingFeeTotalPaise())).toBe("₹1,178.82");
  });

  it("rounds GST to the nearest paisa", () => {
    expect(feeTotalPaise(3599, 18)).toBe(424682);
  });

  it("requires a name, valid email and phone before payment", () => {
    expect(payerSchema.safeParse({ name: "A", email: "a@b.in", phone: "9876543210" }).success).toBe(false);
    expect(payerSchema.safeParse({ name: "Asha Rao", email: "not-an-email", phone: "9876543210" }).success).toBe(false);
    expect(payerSchema.safeParse({ name: "Asha Rao", email: "asha@example.in", phone: "+91 98765-43210" }).success).toBe(true);
  });

  it("only accepts Razorpay-shaped payment confirmations", () => {
    expect(paymentResultSchema.safeParse({ orderId: "order_ABC123xyz", paymentId: "pay_ABC123xyz", signature: "a".repeat(64) }).success).toBe(true);
    expect(paymentResultSchema.safeParse({ orderId: "order_ABC123xyz", paymentId: "pay_ABC123xyz", signature: "forged" }).success).toBe(false);
  });
});

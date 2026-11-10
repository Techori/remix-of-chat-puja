import { z } from "zod";
import { indiaRegistrationOptions } from "./international-programme";

// Browser-safe payment rules shared by the payment form, server functions and tests.
export const fundingFee = indiaRegistrationOptions[0];

export function feeTotalPaise(amountRupees: number, gstPercent: number) {
  return Math.round((amountRupees * 100 * (100 + gstPercent)) / 100);
}

export function fundingFeeTotalPaise() {
  return feeTotalPaise(fundingFee.amount, fundingFee.gstPercent);
}

export function formatPaise(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const payerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s-]{6,18}$/, "Enter a valid phone number"),
});
export type Payer = z.infer<typeof payerSchema>;

export const paymentResultSchema = z.object({
  orderId: z.string().regex(/^order_[A-Za-z0-9]{6,40}$/),
  paymentId: z.string().regex(/^pay_[A-Za-z0-9]{6,40}$/),
  signature: z.string().regex(/^[a-f0-9]{64}$/),
});

export const paymentStatuses = ["created", "paid", "failed"] as const;

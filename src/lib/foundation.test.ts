import { describe, expect, it } from "vitest";
import { foundationImpact, foundationPrograms, foundationSubmissionSchema, PROFIT_COMMITMENT_PERCENT } from "./foundation";

const base = { fullName: "Test Person", email: "test@example.com", phone: "9876543210", details: {} };

describe("RILOYD Foundation rules", () => {
  it("has exactly five core programmes", () => expect(foundationPrograms).toHaveLength(5));
  it("commits 20% of profits", () => expect(PROFIT_COMMITMENT_PERCENT).toBe(20));
  it("never ships invented impact numbers", () => expect(foundationImpact.every(i => i.value === null)).toBe(true));
  it("requires a real message for contact forms", () => {
    expect(foundationSubmissionSchema.safeParse({ ...base, kind: "contact", message: "Hi" }).success).toBe(false);
    expect(foundationSubmissionSchema.safeParse({ ...base, kind: "contact", message: "I would like to help with education." }).success).toBe(true);
  });
  it("rejects an invalid mobile number", () => expect(foundationSubmissionSchema.safeParse({ ...base, phone: "12", kind: "volunteer" }).success).toBe(false));
  it("rejects unknown form types", () => expect(foundationSubmissionSchema.safeParse({ ...base, kind: "payment" }).success).toBe(false));
});

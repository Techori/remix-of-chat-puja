// Server-only Razorpay helpers. Credentials are read at call time inside server handlers.
export function razorpayCredentials() {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  if (!keyId || !keySecret) throw new Error("Online payment is not set up yet. Please try again later.");
  return { keyId, keySecret };
}

export async function razorpayRequest<T>(path: string, init?: { method?: "GET" | "POST"; body?: unknown }): Promise<T> {
  const { keyId, keySecret } = razorpayCredentials();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`, "Content-Type": "application/json" },
    ...(init?.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });
  const body = (await response.json().catch(() => null)) as (T & { error?: { description?: string } }) | null;
  if (!response.ok || !body) {
    console.error("Razorpay request failed", response.status, body?.error?.description ?? "");
    throw new Error("The payment service is unavailable right now. Please try again.");
  }
  return body;
}

export async function hmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export type RazorpayOrder = { id: string; amount: number; currency: string };
export type RazorpayPayment = { id: string; order_id: string; amount: number; currency: string; status: string };

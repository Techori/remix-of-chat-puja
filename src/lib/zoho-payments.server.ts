import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Server-only Zoho Payments (India) helpers. Credentials are read at call time inside server handlers.
const API = "https://payments.zoho.in/api/v1";

export function zohoCredentials() {
  const accountId = process.env["ZOHO_PAYMENTS_ACCOUNT_ID"];
  const apiKey = process.env["ZOHO_PAYMENTS_API_KEY"];
  const clientId = process.env["ZOHO_PAYMENTS_CLIENT_ID"];
  const clientSecret = process.env["ZOHO_PAYMENTS_CLIENT_SECRET"];
  const refreshToken = process.env["ZOHO_PAYMENTS_REFRESH_TOKEN"];
  if (!accountId || !apiKey || !clientId || !clientSecret || !refreshToken) throw new Error("Zoho Payments is not set up yet. Please choose another payment method.");
  return { accountId, apiKey, clientId, clientSecret, refreshToken };
}

export function zohoConfigured() {
  return ["ZOHO_PAYMENTS_ACCOUNT_ID", "ZOHO_PAYMENTS_API_KEY", "ZOHO_PAYMENTS_CLIENT_ID", "ZOHO_PAYMENTS_CLIENT_SECRET", "ZOHO_PAYMENTS_REFRESH_TOKEN"].every(name => Boolean(process.env[name]));
}

// Zoho limits how often a refresh token can mint access tokens, so a valid token is reused from the database.
async function accessToken() {
  const { clientId, clientSecret, refreshToken } = zohoCredentials();
  const { data: cached } = await supabaseAdmin.from("payment_provider_tokens").select("access_token,expires_at").eq("provider", "zoho").maybeSingle();
  if (cached && new Date(cached.expires_at).getTime() > Date.now() + 120_000) return cached.access_token;
  const body = new URLSearchParams({ refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token" });
  const response = await fetch("https://accounts.zoho.in/oauth/v2/token", { method: "POST", body });
  const json = (await response.json().catch(() => null)) as { access_token?: string; expires_in?: number; error?: string } | null;
  if (!response.ok || !json?.access_token) {
    console.error("Zoho token refresh failed", response.status, json?.error ?? "");
    throw new Error("Zoho Payments is unavailable right now. Please try again or choose another method.");
  }
  const expiresAt = new Date(Date.now() + (json.expires_in ?? 3600) * 1000).toISOString();
  await supabaseAdmin.from("payment_provider_tokens").upsert({ provider: "zoho", access_token: json.access_token, expires_at: expiresAt });
  return json.access_token;
}

export async function zohoRequest<T>(path: string, init?: { method?: "GET" | "POST"; body?: unknown }): Promise<T> {
  const { accountId } = zohoCredentials();
  const token = await accessToken();
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${API}${path}${separator}account_id=${encodeURIComponent(accountId)}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
    ...(init?.body === undefined ? {} : { body: JSON.stringify(init.body) }),
  });
  const json = (await response.json().catch(() => null)) as (T & { code?: number; message?: string }) | null;
  if (!response.ok || !json || json.code !== 0) {
    console.error("Zoho Payments request failed", response.status, json?.code ?? "", json?.message ?? "");
    throw new Error("Zoho Payments is unavailable right now. Please try again or choose another method.");
  }
  return json;
}

export function rupeesToPaise(amount: string) {
  return Math.round(Number.parseFloat(amount) * 100);
}

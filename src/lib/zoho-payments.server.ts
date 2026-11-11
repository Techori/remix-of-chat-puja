import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Server-only Zoho Payments (India) helpers. Credentials are read at call time inside server handlers.
const API = "https://payments.zoho.in/api/v1";
const ACCOUNTS = "https://accounts.zoho.in/oauth/v2/token";
const KEYS = ["ZOHO_PAYMENTS_ACCOUNT_ID", "ZOHO_PAYMENTS_API_KEY", "ZOHO_PAYMENTS_CLIENT_ID", "ZOHO_PAYMENTS_CLIENT_SECRET"] as const;

export function zohoKeysPresent() {
  return KEYS.every(name => Boolean(process.env[name]));
}

export function zohoCredentials() {
  const accountId = process.env["ZOHO_PAYMENTS_ACCOUNT_ID"];
  const apiKey = process.env["ZOHO_PAYMENTS_API_KEY"];
  const clientId = process.env["ZOHO_PAYMENTS_CLIENT_ID"];
  const clientSecret = process.env["ZOHO_PAYMENTS_CLIENT_SECRET"];
  if (!accountId || !apiKey || !clientId || !clientSecret) throw new Error("Zoho Payments is not set up yet. Please choose another payment method.");
  return { accountId, apiKey, clientId, clientSecret };
}

async function storedToken() {
  const { data } = await supabaseAdmin.from("payment_provider_tokens").select("access_token,expires_at,refresh_token").eq("provider", "zoho").maybeSingle();
  return data;
}

// Ready when the four keys exist and an admin has connected the account (refresh token saved).
export async function zohoConfigured() {
  if (!zohoKeysPresent()) return false;
  return Boolean(process.env["ZOHO_PAYMENTS_REFRESH_TOKEN"] || (await storedToken())?.refresh_token);
}

type TokenResponse = { access_token?: string; refresh_token?: string; expires_in?: number; error?: string };
async function tokenRequest(params: Record<string, string>) {
  const response = await fetch(ACCOUNTS, { method: "POST", body: new URLSearchParams(params) });
  const json = (await response.json().catch(() => null)) as TokenResponse | null;
  if (!response.ok || !json?.access_token) {
    console.error("Zoho token request failed", response.status, json?.error ?? "");
    return { error: json?.error ?? `status ${response.status}` };
  }
  return { token: json };
}

// One-time admin step: exchange a short-lived Self Client code for a long-lived refresh token.
export async function connectZoho(code: string) {
  const { clientId, clientSecret } = zohoCredentials();
  const result = await tokenRequest({ code, client_id: clientId, client_secret: clientSecret, grant_type: "authorization_code" });
  if (!result.token?.refresh_token || !result.token.access_token) throw new Error(result.error === "invalid_code" ? "The code is invalid or expired. Generate a new code in Zoho and paste it within a few minutes." : "Zoho did not accept the code. Check the Client ID/Secret and scopes, then try again.");
  const { error } = await supabaseAdmin.from("payment_provider_tokens").upsert({
    provider: "zoho", access_token: result.token.access_token, refresh_token: result.token.refresh_token,
    expires_at: new Date(Date.now() + (result.token.expires_in ?? 3600) * 1000).toISOString(),
  });
  if (error) throw new Error("Zoho connection could not be saved.");
}

// Zoho limits how often a refresh token can mint access tokens, so a valid token is reused from the database.
async function accessToken() {
  const { clientId, clientSecret } = zohoCredentials();
  const cached = await storedToken();
  if (cached && new Date(cached.expires_at).getTime() > Date.now() + 120_000) return cached.access_token;
  const refreshToken = cached?.refresh_token ?? process.env["ZOHO_PAYMENTS_REFRESH_TOKEN"];
  if (!refreshToken) throw new Error("Zoho Payments is not connected yet. Please choose another payment method.");
  const result = await tokenRequest({ refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token" });
  if (!result.token?.access_token) throw new Error("Zoho Payments is unavailable right now. Please try again or choose another method.");
  await supabaseAdmin.from("payment_provider_tokens").upsert({
    provider: "zoho", access_token: result.token.access_token, refresh_token: refreshToken,
    expires_at: new Date(Date.now() + (result.token.expires_in ?? 3600) * 1000).toISOString(),
  });
  return result.token.access_token;
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

/**
 * Server-side Supabase client that uses only the PUBLISHABLE key.
 *
 * Why: the checkout, payment-verification, tracking and webhook paths must work
 * on any host (Lovable, Vercel, local) without the service-role key. Every
 * privileged operation they need is exposed as a hardened SECURITY DEFINER
 * database function that either verifies a Razorpay HMAC signature server-side
 * (payments/webhook) or only returns safe, customer-facing columns (tracking).
 *
 * Never import this file from client code.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function getPublicServerClient() {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["SUPABASE_ANON_KEY"];

  if (!url || !key) {
    throw new Error(
      "Missing Supabase configuration: set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      // New-format sb_ keys are opaque strings, not bearer JWTs.
      fetch: (input, init) => {
        const headers = new Headers(
          typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
        );
        if (init?.headers) {
          new Headers(init.headers).forEach((value, name) => headers.set(name, value));
        }
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

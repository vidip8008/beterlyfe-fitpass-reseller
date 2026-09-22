import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type OrderRow = Tables<"orders">;

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("FORBIDDEN");
}

export const getAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });

/**
 * First-admin bootstrap. The signed-in user's verified email must already be in
 * the private `admin_allowlist` table (server-only, no client access, seeded by
 * migration). Nobody can add themselves — there is no public signup path.
 */
export const claimAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String((context.claims as Record<string, unknown>)["email"] ?? "")
      .trim()
      .toLowerCase();
    if (!email) return { granted: false as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: allowed } = await supabaseAdmin
      .from("admin_allowlist")
      .select("email")
      .eq("email", email)
      .maybeSingle();
    if (!allowed) return { granted: false as const };

    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    if (error) {
      console.error("[admin] role grant failed", error);
      return { granted: false as const };
    }
    return { granted: true as const };
  });

const signupSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(10, "Use at least 10 characters").max(200),
});

/**
 * Creates a normal (non-admin) account. Authentication and authorisation are
 * separate: every new account gets the `user` role. Admin rights are only ever
 * granted server-side by `claimAdminRole` when the signed-in email is on the
 * private `admin_allowlist` — clients can never self-grant.
 */
export const createAccount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => signupSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });

    if (createErr || !created?.user) {
      const code = (createErr as { code?: string } | null)?.code ?? "";
      const message = createErr?.message ?? "";
      console.error("[admin] account create failed", code, message);
      if (code === "email_exists" || /already been registered|already registered/i.test(message)) {
        return { ok: false as const, reason: "email_exists" as const, message: "" };
      }
      if (code === "weak_password" || /weak|pwned|password/i.test(message)) {
        return {
          ok: false as const,
          reason: "weak_password" as const,
          message: message || "Choose a stronger password.",
        };
      }
      return { ok: false as const, reason: "create_failed" as const, message };
    }

    // Default, least-privileged role. Never 'admin'.
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: created.user.id, role: "user" }, { onConflict: "user_id,role" });
    if (roleErr) console.error("[admin] default role assign failed", roleErr);

    return { ok: true as const, reason: "created" as const, message: "" };
  });

export const listOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data as OrderRow[];
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  patch: z
    .object({
      payment_status: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
      voucher_status: z.enum(["processing", "voucher_ready", "sent", "completed", "issue"]).optional(),
      whatsapp_status: z.enum(["pending", "sent", "failed"]).optional(),
      voucher_code: z.string().trim().max(200).nullable().optional(),
      voucher_instructions: z.string().trim().max(4000).nullable().optional(),
      admin_notes: z.string().trim().max(4000).nullable().optional(),
    })
    .refine((p) => Object.keys(p).length > 0, "Nothing to update"),
});

export const updateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const patch = Object.fromEntries(
      Object.entries(data.patch).filter(([, v]) => v !== undefined),
    ) as TablesUpdate<"orders">;
    const { data: row, error } = await context.supabase
      .from("orders")
      .update(patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as OrderRow;
  });

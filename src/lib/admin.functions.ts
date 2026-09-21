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

/**
 * Is first-admin signup still open? True only while zero admins exist.
 * Public (no auth) but leaks nothing beyond that boolean.
 */
export const adminSignupStatus = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  return { open: (count ?? 0) === 0 };
});

const signupSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(10, "Use at least 10 characters").max(200),
});

/**
 * Creates the very first admin account. Guarded three ways:
 *  - the email must be on the server-only `admin_allowlist`
 *  - it only works while no admin role exists at all
 *  - the role is granted server-side with the service key; clients cannot self-grant
 */
export const createFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => signupSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) return { ok: false as const, reason: "closed" as const };

    const { data: allowed } = await supabaseAdmin
      .from("admin_allowlist")
      .select("email")
      .eq("email", data.email)
      .maybeSingle();
    if (!allowed) return { ok: false as const, reason: "not_allowed" as const };

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });

    let userId = created?.user?.id ?? null;

    if (createErr) {
      const code = (createErr as { code?: string }).code ?? "";
      const message = createErr.message ?? "";
      const alreadyExists =
        code === "email_exists" || /already been registered|already registered/i.test(message);

      if (!alreadyExists) {
        console.error("[admin] first-admin create failed", createErr);
        // Safe to surface: Supabase auth messages here are validation feedback
        // (weak/pwned password, invalid email), never secrets.
        return { ok: false as const, reason: "create_failed" as const, message };
      }

      // A previous attempt left an auth user behind without the admin role.
      // Recover it instead of creating a duplicate: set the password we were
      // given, confirm the email, then grant the role below.
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list?.users?.find((u) => (u.email ?? "").toLowerCase() === data.email);
      if (!existing) {
        return {
          ok: false as const,
          reason: "create_failed" as const,
          message: "An account with this email exists but could not be loaded.",
        };
      }
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.full_name },
      });
      if (updErr) {
        console.error("[admin] first-admin recovery failed", updErr);
        return { ok: false as const, reason: "create_failed" as const, message: updErr.message };
      }
      userId = existing.id;
    }

    if (!userId) {
      return { ok: false as const, reason: "create_failed" as const, message: "No account was created." };
    }

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (roleErr) {
      console.error("[admin] first-admin role grant failed", roleErr);
      return { ok: false as const, reason: "create_failed" as const, message: roleErr.message };
    }
    return { ok: true as const };
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

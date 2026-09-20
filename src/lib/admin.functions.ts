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

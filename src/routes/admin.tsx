import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { Loader2, LogOut, MessageCircle, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAdminAccess, listOrders, updateOrder, type OrderRow } from "@/lib/admin.functions";
import { PAYMENT_STATUS, VOUCHER_STATUS, WHATSAPP_STATUS, formatINR, formatWhatsApp, type PaymentStatus, type VoucherStatus, type WhatsAppStatus } from "@/lib/site";
import { openVoucherChatUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin | BeterLyfe" },
      { name: "description", content: "BeterLyfe order management." },
      { property: "og:title", content: "Admin | BeterLyfe" },
      { property: "og:description", content: "BeterLyfe order management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

/* ---------------- Auth gate ---------------- */

function AdminPage() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <Centered><Loader2 className="size-6 animate-spin text-primary" /></Centered>;
  if (!session) return <LoginCard />;
  return <AdminGate userEmail={session.user.email ?? ""} />;
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center bg-background px-4">{children}</div>;
}

function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error("Sign-in failed. Check your email and password.");
  }

  return (
    <Centered>
      <form onSubmit={submit} className="surface-card w-full max-w-sm rounded-3xl p-7">
        <Logo compact />
        <h1 className="mt-6 text-2xl font-extrabold">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Restricted to BeterLyfe staff.</p>
        <div className="mt-6 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" variant="hero" size="lg" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Sign in
          </Button>
        </div>
      </form>
    </Centered>
  );
}

function AdminGate({ userEmail }: { userEmail: string }) {
  const check = useServerFn(getAdminAccess);
  const access = useQuery({ queryKey: ["admin-access"], queryFn: () => check(), retry: false });

  if (access.isPending) return <Centered><Loader2 className="size-6 animate-spin text-primary" /></Centered>;
  if (access.isError || !access.data?.isAdmin) {
    return (
      <Centered>
        <div className="surface-card max-w-sm rounded-3xl p-7 text-center">
          <ShieldAlert className="mx-auto size-10 text-destructive" />
          <h1 className="mt-4 text-xl font-extrabold">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">{userEmail} does not have admin access.</p>
          <Button className="mt-6" variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button>
        </div>
      </Centered>
    );
  }
  return <Dashboard userEmail={userEmail} />;
}

/* ---------------- Dashboard ---------------- */

function Dashboard({ userEmail }: { userEmail: string }) {
  const qc = useQueryClient();
  const fetchOrders = useServerFn(listOrders);
  const orders = useQuery({ queryKey: ["orders"], queryFn: () => fetchOrders(), refetchInterval: 30_000 });
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = orders.data ?? [];
  const stats = useMemo(() => {
    const paid = rows.filter((o) => o.payment_status === "paid");
    return [
      ["Total Orders", rows.length],
      ["Paid Orders", paid.length],
      ["Processing", paid.filter((o) => o.voucher_status === "processing").length],
      ["Voucher Ready", rows.filter((o) => o.voucher_status === "voucher_ready").length],
      ["Voucher Sent", rows.filter((o) => o.voucher_status === "sent" || o.voucher_status === "completed").length],
      ["Total Revenue", formatINR(paid.reduce((s, o) => s + o.amount, 0))],
    ] as const;
  }, [rows]);

  const filtered = rows.filter((o) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return [o.order_id, o.customer_name, o.whatsapp_number, o.email, o.city, o.razorpay_payment_id ?? ""].some((v) => v.toLowerCase().includes(s));
  });
  const open = rows.find((o) => o.id === openId) ?? null;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="container-site flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Logo compact />
            <span className="hidden rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:inline">Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden truncate text-xs text-muted-foreground md:inline">{userEmail}</span>
            <Button variant="ghost" size="sm" onClick={() => orders.refetch()} aria-label="Refresh">
              <RefreshCw className={orders.isFetching ? "animate-spin" : ""} />
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}><LogOut /> Sign out</Button>
          </div>
        </div>
      </header>

      <main className="container-site py-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {stats.map(([k, v]) => (
            <div key={k} className="surface-card rounded-2xl p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{k}</p>
              <p className="mt-2 text-2xl font-extrabold tracking-tight">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-extrabold">Orders</h1>
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search order, name, WhatsApp, city…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-surface text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                {["Order ID", "Customer", "WhatsApp", "City", "Amount", "Payment", "Voucher", "Created", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.isPending && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">Loading orders…</td></tr>
              )}
              {orders.isError && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-destructive">Could not load orders. Refresh to retry.</td></tr>
              )}
              {!orders.isPending && filtered.length === 0 && !orders.isError && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No orders yet.</td></tr>
              )}
              {filtered.map((o) => (
                <tr key={o.id} className="border-t transition-colors hover:bg-surface/60">
                  <td className="px-4 py-3 font-mono font-semibold">{o.order_id}</td>
                  <td className="px-4 py-3">{o.customer_name}</td>
                  <td className="px-4 py-3">{formatWhatsApp(o.whatsapp_number)}</td>
                  <td className="px-4 py-3">{o.city}</td>
                  <td className="px-4 py-3">{formatINR(o.amount)}</td>
                  <td className="px-4 py-3"><Badge kind="payment" value={o.payment_status} /></td>
                  <td className="px-4 py-3"><Badge kind="voucher" value={o.voucher_status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="px-4 py-3"><Button size="sm" variant="secondary" onClick={() => setOpenId(o.id)}>Open</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          {open && <OrderDetail order={open} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Badge({ kind, value }: { kind: "payment" | "voucher"; value: string }) {
  const label = kind === "payment" ? PAYMENT_STATUS[value as PaymentStatus] : VOUCHER_STATUS[value as VoucherStatus];
  const tone =
    value === "paid" || value === "completed" || value === "sent" || value === "voucher_ready"
      ? "bg-primary/15 text-primary"
      : value === "failed" || value === "issue" || value === "refunded"
        ? "bg-destructive/15 text-destructive"
        : "bg-secondary text-muted-foreground";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tone}`}>{label ?? value}</span>;
}

/* ---------------- Order detail ---------------- */

function OrderDetail({ order }: { order: OrderRow }) {
  const qc = useQueryClient();
  const update = useServerFn(updateOrder);
  const [voucherCode, setVoucherCode] = useState(order.voucher_code ?? "");
  const [instructions, setInstructions] = useState(order.voucher_instructions ?? "");
  const [notes, setNotes] = useState(order.admin_notes ?? "");

  useEffect(() => {
    setVoucherCode(order.voucher_code ?? "");
    setInstructions(order.voucher_instructions ?? "");
    setNotes(order.admin_notes ?? "");
  }, [order.id, order.voucher_code, order.voucher_instructions, order.admin_notes]);

  const mutation = useMutation({
    mutationFn: (patch: Parameters<typeof update>[0]["data"]["patch"]) => update({ data: { id: order.id, patch } }),
    onSuccess: (row) => {
      qc.setQueryData<OrderRow[]>(["orders"], (old) => old?.map((o) => (o.id === row.id ? row : o)) ?? [row]);
      toast.success("Order updated");
    },
    onError: () => toast.error("Update failed. Please try again."),
  });

  const saveVoucher = () =>
    mutation.mutate({ voucher_code: voucherCode || null, voucher_instructions: instructions || null, admin_notes: notes || null });
  const markReady = () =>
    mutation.mutate({ voucher_code: voucherCode || null, voucher_instructions: instructions || null, admin_notes: notes || null, voucher_status: "voucher_ready" });

  const waUrl = openVoucherChatUrl(order.whatsapp_number, {
    customer_name: order.customer_name,
    order_id: order.order_id,
    voucher_code: voucherCode,
    voucher_instructions: instructions,
  });

  const details: [string, string][] = [
    ["Customer", order.customer_name],
    ["Email", order.email],
    ["WhatsApp", formatWhatsApp(order.whatsapp_number)],
    ["City", order.city],
    ["Amount", `${formatINR(order.amount)} ${order.currency}`],
    ["Razorpay Order ID", order.razorpay_order_id ?? "—"],
    ["Razorpay Payment ID", order.razorpay_payment_id ?? "—"],
    ["Created", new Date(order.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })],
    ["Updated", new Date(order.updated_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })],
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-mono text-xl">{order.order_id}</DialogTitle>
        <DialogDescription>FITPASS 8-Month Membership · manual voucher fulfilment</DialogDescription>
      </DialogHeader>

      <dl className="grid gap-2 sm:grid-cols-2">
        {details.map(([k, v]) => (
          <div key={k} className="rounded-xl border bg-surface/40 px-3 py-2">
            <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{k}</dt>
            <dd className="mt-0.5 break-all text-sm font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatusSelect label="Payment status" value={order.payment_status} options={PAYMENT_STATUS} onChange={(v) => mutation.mutate({ payment_status: v as PaymentStatus })} />
        <StatusSelect label="Voucher status" value={order.voucher_status} options={VOUCHER_STATUS} onChange={(v) => mutation.mutate({ voucher_status: v as VoucherStatus })} />
        <StatusSelect label="WhatsApp status" value={order.whatsapp_status} options={WHATSAPP_STATUS} onChange={(v) => mutation.mutate({ whatsapp_status: v as WhatsAppStatus })} />
      </div>

      <div className="grid gap-4 rounded-2xl border bg-surface/40 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Voucher fulfilment</p>
        <div className="grid gap-2">
          <Label htmlFor="voucher_code">Voucher Code</Label>
          <Input id="voucher_code" className="font-mono" value={voucherCode} onChange={(e) => setVoucherCode(e.target.value)} placeholder="Enter the procured voucher code" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="instructions">Activation Instructions</Label>
          <Textarea id="instructions" rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Step-by-step activation instructions for the customer" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notes">Admin Notes</Label>
          <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes (never shown to the customer)" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={saveVoucher} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="animate-spin" />} Save Voucher
          </Button>
          <Button variant="hero" onClick={markReady} disabled={mutation.isPending}>Mark Voucher Ready</Button>
          <Button asChild variant="whatsapp">
            <a href={waUrl} target="_blank" rel="noopener noreferrer"><MessageCircle /> WhatsApp Customer</a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          WhatsApp opens with a pre-filled message — review it, press Send manually, then set Voucher status to “Sent” and WhatsApp status to “Sent”.
        </p>
      </div>
    </>
  );
}

function StatusSelect({ label, value, options, onChange }: { label: string; value: string; options: Record<string, string>; onChange: (v: string) => void }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([k, v]) => (
            <SelectItem key={k} value={k}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

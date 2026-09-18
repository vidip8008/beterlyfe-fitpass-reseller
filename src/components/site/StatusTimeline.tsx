import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentStatus, VoucherStatus } from "@/lib/site";

type StepState = "done" | "active" | "todo" | "issue";

export interface TimelineStep {
  label: string;
  sub?: string;
  state: StepState;
}

export function deriveSteps(payment: PaymentStatus, voucher: VoucherStatus): TimelineStep[] {
  const paid = payment === "paid";
  if (payment === "failed" || payment === "refunded") {
    return [
      { label: payment === "failed" ? "Payment Failed" : "Payment Refunded", state: "issue" },
      { label: "Voucher Processing", state: "todo" },
      { label: "WhatsApp Delivery", state: "todo" },
    ];
  }
  if (!paid) {
    return [
      { label: "Payment Pending", sub: "Being verified", state: "active" },
      { label: "Voucher Processing", state: "todo" },
      { label: "WhatsApp Delivery", state: "todo" },
    ];
  }
  const steps: TimelineStep[] = [{ label: "Payment Received", state: "done" }];
  switch (voucher) {
    case "processing":
      steps.push({ label: "Voucher Processing", sub: "Being procured", state: "active" });
      steps.push({ label: "WhatsApp Delivery", state: "todo" });
      break;
    case "voucher_ready":
      steps.push({ label: "Voucher Ready", state: "done" });
      steps.push({ label: "WhatsApp Delivery", sub: "Sending soon", state: "active" });
      break;
    case "sent":
      steps.push({ label: "Voucher Ready", state: "done" });
      steps.push({ label: "Sent on WhatsApp", state: "done" });
      break;
    case "completed":
      steps.push({ label: "Voucher Ready", state: "done" });
      steps.push({ label: "Delivered & Completed", state: "done" });
      break;
    case "issue":
      steps.push({ label: "Voucher Issue", sub: "We're resolving this", state: "issue" });
      steps.push({ label: "WhatsApp Delivery", state: "todo" });
      break;
  }
  return steps;
}

export function StatusTimeline({ steps, className }: { steps: TimelineStep[]; className?: string }) {
  return (
    <ol className={cn("relative grid gap-0", className)}>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={s.label} className="relative flex gap-4 pb-6 last:pb-0" style={{ animationDelay: `${i * 140}ms` }}>
            {!last && (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[13px] top-7 h-[calc(100%-12px)] w-0.5 origin-top animate-draw",
                  s.state === "done" ? "bg-primary" : "bg-border-strong",
                )}
                style={{ animationDelay: `${i * 140 + 200}ms` }}
              />
            )}
            <span
              className={cn(
                "relative grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold animate-pop",
                s.state === "done" && "border-primary bg-primary text-primary-foreground",
                s.state === "active" && "border-primary bg-background text-primary",
                s.state === "todo" && "border-border-strong bg-background text-muted-foreground",
                s.state === "issue" && "border-destructive bg-destructive/15 text-destructive",
              )}
              style={{ animationDelay: `${i * 140}ms` }}
            >
              {s.state === "done" ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : s.state === "active" ? (
                <>
                  <span className="absolute inset-0 rounded-full bg-primary/40 animate-pulse-ring" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                </>
              ) : s.state === "issue" ? (
                "!"
              ) : (
                <span className="h-2 w-2 rounded-full bg-border-strong" />
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-sm font-semibold",
                  s.state === "todo" ? "text-muted-foreground" : "text-foreground",
                  s.state === "issue" && "text-destructive",
                )}
              >
                {s.label}
              </p>
              {s.sub && <p className="text-xs text-muted-foreground">{s.sub}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

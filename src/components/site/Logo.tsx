import { Link } from "@tanstack/react-router";
import logo from "@/assets/beterlyfe-logo.png";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)} aria-label="BeterLyfe home">
      <img
        src={logo}
        alt="BeterLyfe logo"
        width={40}
        height={40}
        className="h-9 w-9 rounded-lg sm:h-10 sm:w-10"
      />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-lg font-extrabold tracking-tight text-foreground">BeterLyfe</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            FITPASS Reseller
          </span>
        </span>
      )}
    </Link>
  );
}

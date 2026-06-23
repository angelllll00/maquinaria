import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type PastelVariant =
  | "purple"
  | "blue"
  | "emerald"
  | "amber"
  | "stone"
  | "rose";

const PASTEL_MAP: Record<PastelVariant, string> = {
  purple: "pastel-purple",
  blue: "pastel-blue",
  emerald: "pastel-emerald",
  amber: "pastel-amber",
  stone: "pastel-stone",
  rose: "pastel-rose",
};

const ICON_BG: Record<PastelVariant, string> = {
  purple: "bg-[#6C5CE7]/15 text-[#6C5CE7]",
  blue: "bg-blue-500/15 text-blue-600",
  emerald: "bg-emerald-500/15 text-emerald-600",
  amber: "bg-amber-500/15 text-amber-600",
  stone: "bg-stone-400/20 text-stone-600",
  rose: "bg-rose-500/15 text-rose-600",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = "purple",
  hint,
  children,
}: {
  title: string;
  value: ReactNode;
  icon: LucideIcon;
  variant?: PastelVariant;
  hint?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/70 p-5 shadow-sm",
        PASTEL_MAP[variant]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {title}
          </p>
          <p className="mt-1 text-3xl font-black text-slate-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        <div
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
            ICON_BG[variant]
          )}
        >
          <Icon size={22} />
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

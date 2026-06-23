import { MINERAL_BADGE, type MineralType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MineralBadge({
  type,
  size = "md",
}: {
  type: MineralType;
  size?: "sm" | "md";
}) {
  const cfg = MINERAL_BADGE[type];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full ring-1 font-semibold",
        cfg.bg,
        cfg.text,
        cfg.ring,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      {cfg.label}
    </span>
  );
}

import { Truck } from "lucide-react";

export function BrandLogo({ size = 64, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`grid place-items-center rounded-2xl bg-white/15 backdrop-blur-sm ${className}`}
      style={{ width: size, height: size }}
    >
      <Truck size={size * 0.55} className="text-white" strokeWidth={2.2} />
    </div>
  );
}

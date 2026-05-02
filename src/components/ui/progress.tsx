import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  barClassName?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function Progress({ value, className, barClassName, variant = "default" }: ProgressProps) {
  const colors = {
    default: "bg-emerald-600",
    success: "bg-emerald-600",
    warning: "bg-amber-500",
    danger: "bg-red-600",
  };
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "w-full h-2 bg-stone-100 rounded-full overflow-hidden",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", colors[variant], barClassName)}
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

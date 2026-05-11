import { cn, statusTone } from "@/lib/utils";

export function Badge({
  children,
  className,
  tone
}: {
  children: React.ReactNode;
  className?: string;
  tone?: string | null;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        tone ? statusTone(tone) : "bg-slate-100 text-slate-700 ring-slate-200",
        className
      )}
    >
      {children}
    </span>
  );
}

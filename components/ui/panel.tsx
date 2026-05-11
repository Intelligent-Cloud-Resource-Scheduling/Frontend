import { cn } from "@/lib/utils";

export function Panel({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("rounded-lg border border-border bg-white p-5 shadow-soft", className)}>{children}</section>;
}

export function SectionHeading({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

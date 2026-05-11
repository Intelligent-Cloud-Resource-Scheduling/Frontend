import { FileQuestion } from "lucide-react";

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-slate-50 px-4 py-8 text-center">
      <FileQuestion className="h-8 w-8 text-slate-400" aria-hidden="true" />
      <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

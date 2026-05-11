import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "focus-ring h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "focus-ring h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-900",
        className
      )}
      {...props}
    />
  );
}

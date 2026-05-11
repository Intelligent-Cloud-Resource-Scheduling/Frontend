import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "0 sec";
  const mins = Math.ceil(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs} sec`;
  return `${mins} min`;
}

export function readableDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function statusTone(status?: string | null) {
  const normalized = status?.toLowerCase() ?? "pending";
  if (["completed", "complete", "done", "success"].includes(normalized)) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (["failed", "error", "cancelled", "canceled"].includes(normalized)) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }
  if (["processing", "running", "in_progress"].includes(normalized)) {
    return "bg-sky-50 text-sky-700 ring-sky-200";
  }
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

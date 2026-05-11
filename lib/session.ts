"use client";

import type { AppRole, Session } from "@/types/api";

const STORAGE_KEY = "cloud-video-session";

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function requireRole(role: AppRole) {
  const session = getSession();
  if (!session || session.role !== role || !session.token) return null;
  return session;
}

export function saveSession(session: Session) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Shield, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSession, requireRole } from "@/lib/session";
import type { AppRole, Session } from "@/types/api";

export function ProtectedArea({
  role,
  children
}: {
  role: AppRole;
  children: (session: Session) => React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [session] = useState<Session | null>(() => requireRole(role));

  useEffect(() => {
    if (!session) {
      router.replace(role === "admin" ? "/admin/login" : "/login");
    }
  }, [pathname, role, router, session]);

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-sm text-muted-foreground">
        Checking session...
      </main>
    );
  }

  return <>{children(session)}</>;
}

export function DashboardChrome({
  role,
  title,
  subtitle,
  children
}: {
  role: AppRole;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function signOut() {
    clearSession();
    router.replace(role === "admin" ? "/admin/login" : "/login");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-white">
              {role === "admin" ? <Shield className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-950">{title}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <Button variant="secondary" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>
      {children}
    </main>
  );
}

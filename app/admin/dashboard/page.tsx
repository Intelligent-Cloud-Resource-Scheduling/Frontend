"use client";

import { Activity, LockKeyhole, Server } from "lucide-react";
import { DashboardChrome, ProtectedArea } from "@/components/dashboard-shell";
import { Panel, SectionHeading } from "@/components/ui/panel";

export default function AdminDashboardPage() {
  return (
    <ProtectedArea role="admin">
      {(session) => (
        <DashboardChrome role="admin" title="Admin Dashboard" subtitle="Administrative access is isolated from user workflows.">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-3 lg:px-6">
            <Panel className="lg:col-span-2">
              <SectionHeading
                title="Admin workspace"
                subtitle="The current backend contract only exposes admin authentication, so this page keeps admin sessions separated and ready for future controls."
              />
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Signed in as", session.user.email, LockKeyhole],
                  ["Session role", "Admin only", Server],
                  ["Status", "Protected route", Activity]
                ].map(([label, value, Icon]) => (
                  <div key={label as string} className="rounded-lg border border-border bg-slate-50 p-4">
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-sm text-muted-foreground">{label as string}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">{value as string}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </DashboardChrome>
      )}
    </ProtectedArea>
  );
}

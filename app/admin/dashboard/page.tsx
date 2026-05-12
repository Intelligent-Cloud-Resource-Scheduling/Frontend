"use client";

import { DashboardChrome, ProtectedArea } from "@/components/dashboard-shell";
import { AdminDashboard } from "@/components/admin-dashboard";

export default function AdminDashboardPage() {
  return (
    <ProtectedArea role="admin">
      {(session) => (
        <DashboardChrome role="admin" title="Admin Dashboard" subtitle="Manage plans, VM capacity, and admin-only tools.">
          <AdminDashboard session={session} />
        </DashboardChrome>
      )}
    </ProtectedArea>
  );
}

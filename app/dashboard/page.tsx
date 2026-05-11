"use client";

import { DashboardChrome, ProtectedArea } from "@/components/dashboard-shell";
import { UserDashboard } from "@/components/user-dashboard";

export default function DashboardPage() {
  return (
    <ProtectedArea role="user">
      {(session) => (
        <DashboardChrome role="user" title="User Dashboard" subtitle="Upload videos, request processing, and monitor jobs.">
          <UserDashboard session={session} />
        </DashboardChrome>
      )}
    </ProtectedArea>
  );
}

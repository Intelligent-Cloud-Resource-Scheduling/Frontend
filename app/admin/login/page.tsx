import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default function AdminLoginPage() {
  return (
    <AuthShell
      title="Admin sign in"
      subtitle="Admin accounts can only sign in and are routed to the admin dashboard."
      footer={
        <span>
          User account?{" "}
          <Link className="font-semibold text-primary hover:underline" href="/login">
            Go to user login
          </Link>
        </span>
      }
    >
      <AuthForm mode="login" role="admin" />
    </AuthShell>
  );
}

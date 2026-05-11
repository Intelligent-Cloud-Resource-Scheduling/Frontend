import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      title="User sign in"
      subtitle="Access your uploads, processing jobs, and plan usage."
      footer={
        <span>
          Need an account?{" "}
          <Link className="font-semibold text-primary hover:underline" href="/register">
            Register as a user
          </Link>
        </span>
      }
    >
      <AuthForm mode="login" role="user" />
    </AuthShell>
  );
}

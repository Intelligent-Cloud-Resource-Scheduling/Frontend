import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create user account"
      subtitle="Registration creates standard user accounts only."
      footer={
        <span>
          Already registered?{" "}
          <Link className="font-semibold text-primary hover:underline" href="/login">
            Sign in
          </Link>
        </span>
      }
    >
      <AuthForm mode="register" role="user" />
    </AuthShell>
  );
}

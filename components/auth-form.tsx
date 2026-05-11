"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/session";
import type { AppRole } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthMode = "login" | "register";

export function AuthForm({ mode, role }: { mode: AuthMode; role: AppRole }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response =
        mode === "register"
          ? await api.register({ name, email, password })
          : role === "admin"
            ? await api.loginAdmin({ email, password })
            : await api.loginUser({ email, password });

      saveSession({
        role,
        token: response.data.token,
        user: response.data.user
      });

      router.push(role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      {mode === "register" ? (
        <label className="block text-sm font-medium text-slate-700">
          Name
          <Input
            className="mt-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Hamza Test"
            required
          />
        </label>
      ) : null}
      <label className="block text-sm font-medium text-slate-700">
        Email
        <Input
          className="mt-2"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@cloud.project"
          required
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Password
        <Input
          className="mt-2"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          required
        />
      </label>
      {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      <Button className="w-full" type="submit" disabled={isSubmitting}>
        {mode === "register" ? <UserPlus className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
        {isSubmitting ? "Working..." : mode === "register" ? "Create account" : "Sign in"}
      </Button>
      {role === "user" && mode === "login" ? (
        <p className="text-center text-sm text-muted-foreground">
          New user?{" "}
          <Link className="font-semibold text-primary hover:underline" href="/register">
            Create an account
          </Link>
        </p>
      ) : null}
      {role === "user" ? (
        <p className="text-center text-sm text-muted-foreground">
          Admin access is handled from{" "}
          <Link className="font-semibold text-primary hover:underline" href="/admin/login">
            admin login
          </Link>
          .
        </p>
      ) : null}
    </form>
  );
}

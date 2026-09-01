"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";
import { ADMIN_TOKEN_KEY } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/brand/Logo";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const invalid = searchParams.get("invalid");
  const forbidden = searchParams.get("forbidden");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.user.role !== "ADMIN") {
        setError("This account does not have admin access.");
        return;
      }
      window.localStorage.setItem(ADMIN_TOKEN_KEY, res.token);
      document.cookie = "admin_token=1; Path=/; SameSite=Lax";
      setSession(res.token, res.user);
      router.replace("/overview");
      router.refresh();
    } catch (err) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message: string }).message === "string"
          ? (err as { message: string }).message
          : "Login failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {invalid && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
          Your session has expired. Please sign in again.
        </p>
      )}
      {forbidden && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red">
          You do not have admin access.
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red">
          {error}
        </p>
      )}
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="admin@notaryday.app"
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
      />
      <Button type="submit" loading={loading} className="mt-1 w-full">
        Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-white">
          <Logo onDark />
          <h1 className="mt-4 text-xl font-bold">Admin Console</h1>
          <p className="mt-1 text-sm text-white/60">
            Sign in to the platform admin console
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";
import { ADMIN_TOKEN_KEY } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

function errorStatus(error: unknown): number | undefined {
  const asResponseError = error as {
    statusCode?: number;
    response?: { status?: number };
  };
  return asResponseError?.statusCode ?? asResponseError?.response?.status;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token: storeToken, setUser, clearSession } = useAuthStore();

  // Zustand's `persist` rehydrates asynchronously on the first client render,
  // so `storeToken` can still be null on the very first paint even though a
  // (valid) token lives in localStorage. Read the same key `api.ts` reads so
  // the "does a session exist?" decision is stable across the hydration
  // boundary and never depends on a store write we haven't observed yet.
  const storedToken =
    typeof window !== "undefined"
      ? window.localStorage.getItem(ADMIN_TOKEN_KEY)
      : null;
  const hasSession = !!storeToken || !!storedToken;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: hasSession,
    staleTime: 10 * 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  // All navigation lives in effects — never during render (which would throw
  // "Cannot update a component (Router) while rendering").
  useEffect(() => {
    // No token anywhere → sign in.
    if (!hasSession) {
      router.replace("/login");
      return;
    }

    // /me rejected a 401 → token invalid/expired → wipe and redirect.
    if (isError && errorStatus(error) === 401) {
      clearSession();
      router.replace("/login?invalid=1");
      return;
    }

    // /me resolved but the user isn't an admin → forbidden.
    if (data && data.role !== "ADMIN") {
      clearSession();
      router.replace("/login?forbidden=1");
    }
  }, [
    hasSession,
    isError,
    error,
    data,
    clearSession,
    router,
  ]);

  if (!hasSession) {
    // Redirecting to /login via the effect above; render nothing meanwhile.
    return <Spinner />;
  }

  if (isError) {
    // Non-401 (network / 5xx): keep the session, let the user retry.
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-sm font-semibold text-navy">
          Couldn&apos;t reach the server
        </p>
        <p className="max-w-sm text-xs text-slate-soft">
          Your session is still active. This looks like a temporary connection
          issue — try again.
        </p>
        <Button onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  if (isLoading || !data) {
    return <Spinner />;
  }

  // data.role is validated in the effect above; guard render here.
  if (data.role !== "ADMIN") {
    return <Spinner />;
  }

  return <>{children}</>;
}

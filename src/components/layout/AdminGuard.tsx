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
  const { token, setUser, clearSession } = useAuthStore();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: !!token,
    staleTime: 10 * 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  useEffect(() => {
    if (isError && errorStatus(error) === 401) {
      clearSession();
      router.replace("/login");
    }
  }, [isError, error, clearSession, router]);

  if (!token && typeof window !== "undefined") {
    const stored = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (stored) {
      router.replace("/login?invalid=1");
      return <Spinner />;
    }
    router.replace("/login");
    return <Spinner />;
  }

  if (isLoading) {
    return <Spinner />;
  }

  if (isError) {
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

  if (!data) {
    return <Spinner />;
  }

  if (data.role !== "ADMIN") {
    clearSession();
    router.replace("/login?forbidden=1");
    return <Spinner />;
  }

  return <>{children}</>;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/api/auth.api";
import { useAuthStore } from "@/store/authStore";
import { ADMIN_TOKEN_KEY } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, setUser, clearSession } = useAuthStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    enabled: !!token,
    staleTime: 10 * 60_000,
  });

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  useEffect(() => {
    if (isError) {
      clearSession();
      router.replace("/login");
    }
  }, [isError, clearSession, router]);

  if (!token && typeof window !== "undefined") {
    const stored = window.localStorage.getItem(ADMIN_TOKEN_KEY);
    if (stored) {
      router.replace("/login?invalid=1");
      return <Spinner />;
    }
    router.replace("/login");
    return <Spinner />;
  }

  if (isLoading || !data) {
    return <Spinner />;
  }

  if (data.role !== "ADMIN") {
    clearSession();
    router.replace("/login?forbidden=1");
    return <Spinner />;
  }

  return <>{children}</>;
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchStats,
  fetchUsers,
  fetchUser,
  fetchJobs,
  fetchSystemHealth,
  fetchEmailProviders,
  setActiveEmailProvider,
  testEmailProvider,
  updateUserPlan,
  resetUserPassword,
  suspendUser,
  restoreUser,
  type ListUsersParams,
  type ListJobsParams,
  type TestEmailParams,
} from "@/api/admin.api";
import { PlanTier } from "@/types";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchStats,
    staleTime: 60_000,
  });
}

export function useAdminUsers(params: ListUsersParams) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => fetchUsers(params),
    placeholderData: (prev) => prev,
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: ["admin", "user", id],
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });
}

export function useAdminJobs(params: ListJobsParams) {
  return useQuery({
    queryKey: ["admin", "jobs", params],
    queryFn: () => fetchJobs(params),
    placeholderData: (prev) => prev,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ["admin", "system", "health"],
    queryFn: fetchSystemHealth,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useEmailProviders() {
  return useQuery({
    queryKey: ["admin", "email-providers"],
    queryFn: fetchEmailProviders,
    staleTime: 30_000,
  });
}

export function useEmailProviderMutations() {
  const queryClient = useQueryClient();

  const toggle = useMutation({
    mutationFn: (provider: "resend" | "brevo") =>
      setActiveEmailProvider(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "email-providers"] });
    },
  });

  const test = useMutation({
    mutationFn: (params: TestEmailParams) => testEmailProvider(params),
  });

  return { toggle, test };
}

export function useAdminMutations() {
  const queryClient = useQueryClient();

  const invalidateUser = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ["admin", "user", id] });
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
  };

  const changePlan = useMutation({
    mutationFn: ({
      id,
      plan,
      planExpiresAt,
    }: {
      id: string;
      plan: PlanTier;
      planExpiresAt?: string;
    }) => updateUserPlan(id, plan, planExpiresAt),
    onSuccess: (_data, vars) => invalidateUser(vars.id),
  });

  const resetPw = useMutation({
    mutationFn: (id: string) => resetUserPassword(id),
  });

  const suspend = useMutation({
    mutationFn: (id: string) => suspendUser(id),
    onSuccess: (_d, id) => invalidateUser(id),
  });

  const restore = useMutation({
    mutationFn: (id: string) => restoreUser(id),
    onSuccess: (_d, id) => invalidateUser(id),
  });

  return { changePlan, resetPw, suspend, restore };
}

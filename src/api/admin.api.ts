import api from "@/lib/api";
import type {
  AdminStats,
  AdminUserRow,
  AdminJob,
  Paginated,
  SystemHealth,
  UserDetail,
  PlanTier,
} from "@/types";

export interface ListUsersParams {
  search?: string;
  plan?: PlanTier;
  onboarding?: string;
  suspended?: string;
  page?: number;
  limit?: number;
}

export function fetchStats() {
  return api.get<AdminStats>("/admin/stats/overview");
}

export async function fetchUsers(
  params: ListUsersParams = {}
): Promise<Paginated<AdminUserRow[]>> {
  const res = await api.get<Paginated<AdminUserRow[]>>("/admin/users", {
    params,
  });
  return res;
}

export async function fetchUser(id: string) {
  return api.get<UserDetail>(`/admin/users/${id}`);
}

export async function updateUserPlan(id: string, plan: PlanTier) {
  return api.patch<AdminUserRow>(`/admin/users/${id}/plan`, { plan });
}

export async function resetUserPassword(id: string) {
  return api.post<{ success: boolean }>(`/admin/users/${id}/reset-password`);
}

export async function suspendUser(id: string) {
  return api.post<{ success: boolean }>(`/admin/users/${id}/suspend`);
}

export async function restoreUser(id: string) {
  return api.post<{ success: boolean }>(`/admin/users/${id}/restore`);
}

export interface ListJobsParams {
  status?: string;
  source?: string;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export async function fetchJobs(
  params: ListJobsParams = {}
): Promise<Paginated<AdminJob[]>> {
  const res = await api.get<Paginated<AdminJob[]>>("/admin/jobs", { params });
  return res;
}

export async function fetchSystemHealth() {
  return api.get<SystemHealth>("/admin/system/health");
}

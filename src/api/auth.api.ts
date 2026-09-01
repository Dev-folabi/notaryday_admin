import api from "@/lib/api";
import type { AdminUser } from "@/store/authStore";

export interface LoginResponse {
  user: AdminUser;
  token: string;
}

export async function login(email: string, password: string) {
  return api.post<LoginResponse>("/auth/login", { email, password });
}

export async function fetchMe() {
  return api.get<AdminUser>("/auth/me");
}

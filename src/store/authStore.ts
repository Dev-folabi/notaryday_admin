import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ADMIN_TOKEN_KEY } from "@/lib/api";

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  full_name?: string | null;
  role: "USER" | "ADMIN";
}

interface AuthState {
  token: string | null;
  user: AdminUser | null;
  setSession: (token: string, user: AdminUser) => void;
  setUser: (user: AdminUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      clearSession: () => {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(ADMIN_TOKEN_KEY);
          document.cookie =
            "admin_token=; Path=/; Max-Age=0; SameSite=Lax";
        }
        set({ token: null, user: null });
      },
    }),
    {
      name: "admin-auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

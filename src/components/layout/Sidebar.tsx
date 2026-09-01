"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Activity,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const NAV = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/system", label: "System", icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col bg-navy text-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-admin-indigo">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">Notary Day</p>
          <p className="text-[10px] uppercase tracking-widest text-white/50">
            Admin Console
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/overview" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white",
                active && "bg-white/10 text-white"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-admin-indigo text-xs font-bold">
            {user?.full_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold">{user?.email}</p>
            <p className="text-[10px] text-white/50">Administrator</p>
          </div>
        </div>
        <button
          onClick={clearSession}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </button>
      </div>
    </aside>
  );
}

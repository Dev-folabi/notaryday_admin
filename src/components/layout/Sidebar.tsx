"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Activity,
  Megaphone,
  UsersRound,
  Send,
  Ban,
  BarChart3,
  Waves,
  ListTodo,
  Mail,
  LogOut,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { Logo } from "@/components/brand/Logo";

const NAV = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/marketing", label: "Marketing", icon: Megaphone, exact: true },
  { href: "/marketing/leads", label: "Leads", icon: UsersRound },
  { href: "/marketing/campaigns", label: "Campaigns", icon: Send },
  { href: "/marketing/waves", label: "Waves", icon: Waves },
  { href: "/marketing/tasks", label: "Outreach", icon: ListTodo },
  { href: "/marketing/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/marketing/unsubscribes", label: "Unsubscribes", icon: Ban },
  { href: "/marketing/settings", label: "Settings", icon: Settings },
  { href: "/system", label: "System", icon: Activity },
  { href: "/system/email-providers", label: "Email providers", icon: Mail },
];

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-navy/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-navy text-white transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo onDark />
          <button
            onClick={onClose}
            className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href ||
                (item.href !== "/overview" &&
                  pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
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
    </>
  );
}

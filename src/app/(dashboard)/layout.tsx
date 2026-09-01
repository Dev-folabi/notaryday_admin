"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminGuard } from "@/components/layout/AdminGuard";
import { Toaster } from "@/components/ui/Toast";
import { Logo } from "@/components/brand/Logo";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <AdminGuard>
      <div className="min-h-dvh bg-background">
        <Sidebar open={open} onClose={() => setOpen(false)} />

        <div className="flex min-h-dvh flex-col lg:pl-60">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-navy px-4 lg:hidden">
            <Logo onDark />
            <button
              onClick={() => setOpen(true)}
              className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
      <Toaster />
    </AdminGuard>
  );
}

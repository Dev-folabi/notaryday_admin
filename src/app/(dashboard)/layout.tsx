"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { AdminGuard } from "@/components/layout/AdminGuard";
import { Toaster } from "@/components/ui/Toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
      <Toaster />
    </AdminGuard>
  );
}

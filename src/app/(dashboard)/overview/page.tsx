"use client";

import Link from "next/link";
import {
  Users,
  Activity,
  CreditCard,
  Hourglass,
  Briefcase,
  AlertTriangle,
} from "lucide-react";
import { useAdminStats } from "@/hooks/useAdmin";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { formatDate, titleCase } from "@/lib/utils";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-admin-indigo">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-soft">{label}</p>
        <p className="text-2xl font-bold text-navy">{value}</p>
        {sub && <p className="text-[11px] text-slate-soft">{sub}</p>}
      </div>
    </Card>
  );
}

export default function OverviewPage() {
  const { data, isLoading, isError } = useAdminStats();

  if (isLoading) return <Spinner />;
  if (isError || !data)
    return <p className="text-sm text-red">Failed to load overview.</p>;

  const { users, jobs, ops } = data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Overview</h1>
        <p className="mt-1 text-sm text-slate-soft">
          Platform-wide activity across all notaries.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={users.total}
          icon={Users}
          sub={`${users.new30d} new in 30 days`}
        />
        <StatCard
          label="Active (30d)"
          value={users.active30d}
          icon={Activity}
          sub={`${users.active7d} active in 7 days`}
        />
        <StatCard
          label="Pro subscribers"
          value={users.proPaid}
          icon={CreditCard}
          sub={`${users.byPlan.FREE} on free`}
        />
        <StatCard
          label="Pro trials"
          value={users.proTrial}
          icon={Hourglass}
          sub={`${users.proTrial + users.proPaid} total on Pro`}
        />
        <StatCard
          label="Total jobs"
          value={jobs.total}
          icon={Briefcase}
          sub={`${jobs.last30d} in last 30 days`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Jobs by status"
            action={
              <Link
                href="/jobs"
                className="text-xs font-semibold text-admin-indigo hover:underline"
              >
                View all →
              </Link>
            }
          />
          <Table>
            <THead>
              <Th>Status</Th>
              <Th className="text-right">Count</Th>
            </THead>
            <tbody>
              {jobs.byStatus.map((row) => (
                <tr key={row.status} className="border-b border-border/60 last:border-0">
                  <Td>
                    <Badge tone={statusTone(row.status)}>
                      {titleCase(row.status)}
                    </Badge>
                  </Td>
                  <Td className="text-right font-semibold text-navy">
                    {row.count}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Operations health" />
          <div className="flex flex-col gap-3">
            <OpRow
              label="Pending booking reviews"
              value={ops.pendingBookings}
              warn={ops.pendingBookings > 0}
            />
            <OpRow
              label="Jobs awaiting review"
              value={ops.pendingReviewJobs}
              warn={ops.pendingReviewJobs > 0}
            />
            <OpRow
              label="Failed email/screenshot imports"
              value={ops.failedImports}
              warn={ops.failedImports > 0}
            />
            <OpRow
              label="Failed invoice emails"
              value={ops.failedInvoices}
              warn={ops.failedInvoices > 0}
            />
            <OpRow
              label="Unprocessed Lemon Squeezy events"
              value={ops.pendingLsEvents}
              warn={ops.pendingLsEvents > 0}
            />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent signups"
          action={
            <Link
              href="/users"
              className="text-xs font-semibold text-admin-indigo hover:underline"
            >
              Manage users →
            </Link>
          }
        />
        <Table>
          <THead>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Plan</Th>
            <Th>Onboarding</Th>
            <Th>Joined</Th>
          </THead>
          <tbody>
            {users.recent.length === 0 && (
              <tr>
                <Td colSpan={5} className="py-8 text-center text-slate-soft">
                  No users yet.
                </Td>
              </tr>
            )}
            {users.recent.map((u) => (
              <tr
                key={u.id}
                className="border-b border-border/60 last:border-0"
              >
                <Td className="font-medium text-navy">
                  <Link href={`/users/${u.id}`} className="hover:underline">
                    {u.full_name || u.username}
                  </Link>
                </Td>
                <Td>{u.email}</Td>
                <Td>
                  <Badge tone={planTone(u.plan)}>{u.plan}</Badge>
                </Td>
                <Td>
                  {u.onboarding_completed ? (
                    <span className="text-teal">Complete</span>
                  ) : (
                    <span className="text-amber">Step {u.onboarding_step}</span>
                  )}
                </Td>
                <Td>{formatDate(u.created_at)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

function OpRow({
  label,
  value,
  warn,
}: {
  label: string;
  value: number;
  warn: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5">
      <span className="flex items-center gap-2 text-sm text-slate-body">
        {warn && <AlertTriangle className="h-4 w-4 text-amber" />}
        {label}
      </span>
      <Badge tone={warn ? "amber" : "teal"}>{value}</Badge>
    </div>
  );
}

function statusTone(status: string): "teal" | "amber" | "red" | "blue" | "slate" | "indigo" {
  switch (status) {
    case "COMPLETE":
      return "teal";
    case "CONFIRMED":
    case "IN_PROGRESS":
      return "blue";
    case "PENDING":
    case "PENDING_REVIEW":
      return "amber";
    case "CANCELLED":
    case "DECLINED":
      return "red";
    case "SCANNING":
      return "indigo";
    default:
      return "slate";
  }
}

function planTone(plan: string): "amber" | "slate" {
  return plan === "PRO" || plan === "PRO_ANNUAL" ? "amber" : "slate";
}

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  Mail,
  MailWarning,
  ShieldAlert,
  Upload,
  Users,
  Send,
} from "lucide-react";
import {
  useMarketingOverview,
  useMarketingProviders,
} from "@/hooks/useMarketing";
import { ComposeModal } from "@/components/marketing/ComposeModal";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, titleCase } from "@/lib/utils";
import type { GroupCount } from "@/types";

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  hint?: string;
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className="rounded-lg bg-indigo-50 p-2.5 text-admin-indigo">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-soft">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-soft">{hint}</p>}
      </div>
    </Card>
  );
}

function BreakdownTable({
  title,
  rows,
  labelMap,
}: {
  title: string;
  rows: GroupCount[];
  labelMap?: Record<string, string>;
}) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  return (
    <Card>
      <CardHeader title={title} />
      {rows.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-soft">No data</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center gap-3">
              <span className="w-36 shrink-0 truncate text-xs font-medium text-slate-body">
                {labelMap?.[r.key] ?? titleCase(r.key)}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-admin-indigo"
                  style={{ width: `${total ? (r.count / total) * 100 : 0}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs font-semibold text-navy">
                {r.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

const TIER_LABELS: Record<string, string> = {
  A_PLUS: "A+ (highest intent)",
  A: "A (strong LSA)",
  B: "B (mobile notary)",
  C: "C (verify LSA)",
};

const WAVE_LABELS: Record<string, string> = {
  WAVE_1: "Wave 1 (A+/A)",
  WAVE_2: "Wave 2 (B)",
  WAVE_3: "Wave 3 (C)",
  SOCIAL_PHONE: "Social/phone track",
  EXCLUDED: "Excluded",
};

function MarketingOverviewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading, isError } = useMarketingOverview();
  const { data: providerList } = useMarketingProviders();
  const [composeOpen, composeOpenSet] = useState(
    searchParams.get("compose") === "1"
  );

  if (isLoading) return <Spinner />;
  if (isError || !data) {
    return (
      <p className="py-8 text-center text-sm text-red">
        Failed to load marketing data. Is the API running?
      </p>
    );
  }

  const { leadStats, recentImports } = data;
  const providers = providerList ?? data.providers;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Marketing</h1>
          <p className="mt-1 text-sm text-slate-soft">
            Lead CRM, email providers, and campaign imports.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => composeOpenSet(true)}
          >
            <Send className="h-3.5 w-3.5" /> Compose direct
          </Button>
          <Button size="sm" onClick={() => router.push("/marketing/campaigns/new")}>
            New campaign
          </Button>
        </div>
      </div>

      <ComposeModal
        open={composeOpen}
        onClose={() => composeOpenSet(false)}
        providers={providers}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total leads" value={leadStats.total} icon={Users} />
        <StatCard
          label="With email"
          value={leadStats.withEmail}
          icon={Mail}
          hint={`${leadStats.total ? Math.round((leadStats.withEmail / leadStats.total) * 100) : 0}% coverage`}
        />
        <StatCard label="Excluded" value={leadStats.excluded} icon={ShieldAlert} />
        <StatCard
          label="Unsubscribed"
          value={leadStats.unsubscribed}
          icon={MailWarning}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownTable title="By fit tier" rows={leadStats.byTier} labelMap={TIER_LABELS} />
        <BreakdownTable title="By campaign wave" rows={leadStats.byWave} labelMap={WAVE_LABELS} />
        <BreakdownTable title="By status" rows={leadStats.byStatus} />
        <BreakdownTable title="By AB group" rows={leadStats.byAbGroup} />
        <BreakdownTable title="By channel" rows={leadStats.byChannel} />
        <BreakdownTable title="Top states" rows={leadStats.byStateTop} />
      </div>

      <Card>
        <CardHeader
          title="Email providers"
          subtitle="Accounts used for campaign sends"
          action={
            <Link
              href="/marketing/providers"
              className="text-xs font-medium text-admin-indigo hover:underline"
            >
              Manage →
            </Link>
          }
        />
        {providers.length === 0 ? (
          <EmptyState
            title="No email providers configured"
            description="Add Brevo, Zoho, Gmail or Resend accounts before sending campaigns."
          />
        ) : (
          <Table>
            <THead>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Sent today</Th>
              <Th>Last success</Th>
              <Th>Last error</Th>
            </THead>
            <tbody>
              {providers.map((p) => (
                <tr key={p._id} className="border-b border-border/60 last:border-0">
                  <Td>
                    <span className="font-medium text-navy">{p.name}</span>
                    {p.isDefault && (
                      <Badge tone="indigo" className="ml-2">
                        Default
                      </Badge>
                    )}
                  </Td>
                  <Td className="uppercase">{p.type}</Td>
                  <Td>
                    <Badge tone={p.status === "ACTIVE" ? "teal" : "amber"}>
                      {p.status}
                    </Badge>
                  </Td>
                  <Td>
                    {p.sentToday} / {p.dailyLimit}
                  </Td>
                  <Td className="text-xs">{formatDateTime(p.healthLastSuccessAt)}</Td>
                  <Td className="text-xs">
                    <span
                      className="block max-w-56 truncate text-red"
                      title={p.healthLastError ?? undefined}
                    >
                      {p.healthLastError ?? "—"}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Recent imports"
          subtitle="Lead spreadsheet processing history"
          action={
            <Link
              href="/marketing/imports"
              className="text-xs font-medium text-admin-indigo hover:underline"
            >
              Import a file →
            </Link>
          }
        />
        {recentImports.length === 0 ? (
          <EmptyState
            title="No imports yet"
            description="Upload the campaign-ready leads spreadsheet (xlsx or csv) to get started."
          />
        ) : (
          <Table>
            <THead>
              <Th>File</Th>
              <Th>Status</Th>
              <Th>Rows</Th>
              <Th>Imported</Th>
              <Th>Updated</Th>
              <Th>Dupes</Th>
              <Th>Errors</Th>
              <Th>Uploaded</Th>
            </THead>
            <tbody>
              {recentImports.map((imp) => (
                <tr key={imp._id} className="border-b border-border/60 last:border-0">
                  <Td>
                    <span className="flex items-center gap-2 font-medium text-navy">
                      <Upload className="h-3.5 w-3.5 text-slate-soft" />
                      {imp.filename}
                    </span>
                  </Td>
                  <Td>
                    <Badge
                      tone={
                        imp.status === "COMPLETED"
                          ? "teal"
                          : imp.status === "COMPLETED_WITH_ERRORS"
                            ? "amber"
                            : imp.status === "FAILED"
                              ? "red"
                              : "slate"
                      }
                    >
                      {titleCase(imp.status)}
                    </Badge>
                  </Td>
                  <Td>{imp.totalRows}</Td>
                  <Td className="text-teal">{imp.importedCount}</Td>
                  <Td>{imp.updatedCount}</Td>
                  <Td>{imp.duplicateCount}</Td>
                  <Td className={imp.errorCount > 0 ? "text-red" : ""}>
                    {imp.errorCount}
                  </Td>
                  <Td className="text-xs">{formatDateTime(imp.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export default function MarketingOverviewPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <MarketingOverviewInner />
    </Suspense>
  );
}

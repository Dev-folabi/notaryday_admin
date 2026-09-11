"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Pause,
  Play,
  Ban,
  RefreshCw,
  Download,
} from "lucide-react";
import { downloadCsv } from "@/api/marketing.api";
import {
  useCampaign,
  useCampaignMutations,
  useCampaignRecipients,
} from "@/hooks/useMarketing";
import { useToastStore } from "@/components/ui/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Input, Select } from "@/components/ui/Input";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, titleCase } from "@/lib/utils";
import type { RecipientStatus } from "@/types";

function statusTone(status: string): "teal" | "blue" | "amber" | "red" | "slate" | "indigo" {
  switch (status) {
    case "RUNNING":
    case "SENT":
      return "teal";
    case "SCHEDULED":
    case "DISPATCHING":
    case "QUEUED":
    case "SENDING":
      return "blue";
    case "PAUSED":
    case "SKIPPED":
    case "NEEDS":
      return "amber";
    case "FAILED":
    case "BOUNCED":
    case "COMPLAINED":
    case "UNSUBSCRIBED":
    case "CANCELLED":
      return "red";
    case "COMPLETED":
      return "indigo";
    default:
      return "slate";
  }
}

const STATUS_OPTIONS: RecipientStatus[] = [
  "QUEUED",
  "SENDING",
  "SENT",
  "FAILED",
  "SKIPPED",
  "CANCELLED",
  "BOUNCED",
  "COMPLAINED",
  "UNSUBSCRIBED",
];

export default function CampaignMonitorPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToastStore((s) => s.push);
  const { data, isLoading, isError, refetch, isRefetching } = useCampaign(id);
  const { pause, resume, cancel } = useCampaignMutations();

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data: recipients } = useCampaignRecipients(id, {
    status: statusFilter || undefined,
    search: search || undefined,
    page,
    limit: 20,
  });

  if (isLoading) return <Spinner />;
  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/marketing/campaigns" className="text-sm text-admin-indigo hover:underline">
          ← Back to campaigns
        </Link>
        <p className="py-8 text-center text-sm text-red">Failed to load campaign.</p>
      </div>
    );
  }

  const { campaign, provider, stats } = data;
  const sent = stats.byStatus.SENT ?? 0;
  const failed = stats.byStatus.FAILED ?? 0;
  const queued = (stats.byStatus.QUEUED ?? 0) + (stats.byStatus.SENDING ?? 0);
  const skipped =
    (stats.byStatus.SKIPPED ?? 0) + (stats.byStatus.CANCELLED ?? 0);
  const progress = stats.total > 0 ? Math.round(((sent + failed + skipped) / stats.total) * 100) : 0;
  const live = ["RUNNING", "SCHEDULED", "DISPATCHING"].includes(campaign.status);

  const act = (
    fn: typeof pause,
    successMsg: string
  ) => {
    fn.mutate(id, {
      onSuccess: () => toast(successMsg, "success"),
      onError: (error) =>
        toast((error as { message?: string })?.message ?? "Action failed", "error"),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/marketing/campaigns"
            className="mb-1 inline-flex items-center gap-1 text-sm text-admin-indigo hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to campaigns
          </Link>
          <h1 className="text-2xl font-bold text-navy">{campaign.name}</h1>
          <p className="mt-1 text-sm text-slate-soft">
            {titleCase(campaign.type)} · {provider?.name ?? "provider removed"} (
            {provider?.type}) · starts {formatDateTime(campaign.schedule.startAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(campaign.status)}>{titleCase(campaign.status)}</Badge>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              downloadCsv(
                `/marketing/campaigns/${id}/recipients/export`,
                `campaign-recipients.csv`
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          {campaign.status === "RUNNING" && (
            <Button variant="secondary" size="sm" onClick={() => act(pause, "Campaign paused")}>
              <Pause className="h-3.5 w-3.5" /> Pause
            </Button>
          )}
          {campaign.status === "PAUSED" && (
            <Button size="sm" onClick={() => act(resume, "Campaign resumed")}>
              <Play className="h-3.5 w-3.5" /> Resume
            </Button>
          )}
          {["SCHEDULED", "RUNNING", "PAUSED"].includes(campaign.status) && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (window.confirm("Cancel this campaign? Queued emails will not be sent.")) {
                  act(cancel, "Campaign cancelled");
                }
              }}
            >
              <Ban className="h-3.5 w-3.5" /> Cancel
            </Button>
          )}
        </div>
      </div>

      {campaign.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red">{campaign.error}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        {[
          { label: "Recipients", value: stats.total, cls: "text-navy" },
          { label: "Sent", value: sent, cls: "text-teal" },
          { label: "Queued/Sending", value: queued, cls: "text-admin-indigo" },
          { label: "Failed", value: failed, cls: "text-red" },
          { label: "Skipped", value: skipped, cls: "text-amber" },
          { label: "Opened", value: stats.opened, cls: "text-teal" },
          { label: "Clicked", value: stats.clicked, cls: "text-teal" },
        ].map((s) => (
          <Card key={s.label} className="text-center">
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-[11px] uppercase tracking-wide text-slate-soft">
              {s.label}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Progress"
          subtitle={`${progress}% settled${live ? " · live-updating every 5s" : ""}`}
        />
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-admin-indigo transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-soft">
          {campaign.schedule.perMinute}/min pacing
          {campaign.schedule.smartSendTimes
            ? " · delivered in each recipient's local 8–11 AM window"
            : ""}
          {campaign.stopOnReply ? " · stops on reply" : ""}
        </p>
      </Card>

      {/* Per-step breakdown (sequences) */}
      {campaign.type === "SEQUENCE" && stats.byStep.length > 0 && (
        <Card>
          <CardHeader title="Sequence steps" subtitle="Day offsets 1→17 at 2-day spacing" />
          <Table>
            <THead>
              <Th>Step</Th>
              <Th>Day</Th>
              <Th>Recipients</Th>
              <Th>Sent</Th>
              <Th>Failed</Th>
              <Th>Skipped</Th>
              <Th>Opened</Th>
              <Th>Open rate</Th>
            </THead>
            <tbody>
              {stats.byStep.map((s) => (
                <tr key={s.step} className="border-b border-border/60 last:border-0">
                  <Td className="font-medium text-navy">Email {s.step}</Td>
                  <Td className="text-xs">d{s.step * 2 - 1}</Td>
                  <Td>{s.total}</Td>
                  <Td className="text-teal">{s.sent}</Td>
                  <Td className={s.failed > 0 ? "text-red" : ""}>{s.failed}</Td>
                  <Td>{s.skipped}</Td>
                  <Td>{s.opened}</Td>
                  <Td>
                    {s.sent > 0 ? `${Math.round((s.opened / s.sent) * 100)}%` : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Recipients */}
      <Card>
        <CardHeader
          title="Recipients"
          subtitle="Every (lead × step) pair with live send status"
        />
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="relative flex-1">
            <Input
              placeholder="Search email or business…"
              defaultValue={search}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch((e.target as HTMLInputElement).value);
                  setPage(1);
                }
              }}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="md:w-48"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
        </div>

        {!recipients || recipients.data.length === 0 ? (
          <EmptyState
            title="No recipients match"
            description="Adjust filters, or the campaign hasn't dispatched yet."
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th>Lead</Th>
                {campaign.type === "SEQUENCE" && <Th>Step</Th>}
                <Th>Email</Th>
                <Th>Status</Th>
                <Th>Scheduled</Th>
                <Th>Sent</Th>
                <Th>Opens</Th>
                <Th>Clicks</Th>
                <Th>Detail</Th>
              </THead>
              <tbody>
                {recipients.data.map((r) => (
                  <tr
                    key={r._id}
                    className="border-b border-border/60 last:border-0 hover:bg-slate-50/60"
                  >
                    <Td>
                      {r.leadRef ? (
                        <Link
                          href={`/marketing/leads/${r.leadRef}`}
                          className="font-medium text-navy hover:underline"
                        >
                          {r.leadName ?? "Lead"}
                        </Link>
                      ) : (
                        r.leadName ?? "—"
                      )}
                      {r.abGroup && (
                        <span className="ml-1.5 text-xs text-slate-soft">
                          AB {r.abGroup}
                        </span>
                      )}
                    </Td>
                    {campaign.type === "SEQUENCE" && <Td>{r.step}</Td>}
                    <Td className="text-xs">{r.email}</Td>
                    <Td>
                      <Badge tone={statusTone(r.status)}>{titleCase(r.status)}</Badge>
                    </Td>
                    <Td className="text-xs">{formatDateTime(r.sendAt)}</Td>
                    <Td className="text-xs">{formatDateTime(r.sentAt)}</Td>
                    <Td>{r.openCount}</Td>
                    <Td>{r.clickCount}</Td>
                    <Td className="max-w-52 text-xs">
                      <span className="block truncate text-red" title={r.error ?? r.skipReason ?? ""}>
                        {r.error ?? r.skipReason ?? (r.subject ? r.subject.slice(0, 48) : "—")}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination meta={recipients.meta} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}

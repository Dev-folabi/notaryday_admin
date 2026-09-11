"use client";

import Link from "next/link";
import { Plus, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCampaigns } from "@/hooks/useMarketing";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, titleCase } from "@/lib/utils";
import type { CampaignListRow } from "@/types";

function statusTone(
  status: string
): "teal" | "blue" | "amber" | "red" | "slate" | "indigo" {
  switch (status) {
    case "RUNNING":
      return "teal";
    case "SCHEDULED":
    case "DISPATCHING":
      return "blue";
    case "PAUSED":
      return "amber";
    case "FAILED":
      return "red";
    case "COMPLETED":
      return "indigo";
    default:
      return "slate";
  }
}

export default function CampaignsPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useCampaigns();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Campaigns</h1>
          <p className="mt-1 text-sm text-slate-soft">
            One-off sends and 9-email sequences, paced by the marketing worker.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/marketing?compose=1")}
          >
            <Send className="h-3.5 w-3.5" /> Compose direct
          </Button>
          <Button size="sm" onClick={() => router.push("/marketing/campaigns/new")}>
            <Plus className="h-3.5 w-3.5" /> New campaign
          </Button>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="py-8 text-center text-sm text-red">
            Failed to load campaigns.
          </p>
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            description="Create a one-off send to selected leads, or run the full 9-email sequence for a wave."
          />
        ) : (
          <Table>
            <THead>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Recipients</Th>
              <Th>Sent</Th>
              <Th>Failed</Th>
              <Th>Opened</Th>
              <Th>Clicked</Th>
              <Th>Starts</Th>
              <Th>Created</Th>
            </THead>
            <tbody>
              {data.map((row: CampaignListRow) => (
                <tr
                  key={row.campaign._id}
                  className="border-b border-border/60 last:border-0 hover:bg-slate-50/60"
                >
                  <Td>
                    <Link
                      href={`/marketing/campaigns/${row.campaign._id}`}
                      className="font-medium text-navy hover:underline"
                    >
                      {row.campaign.name}
                    </Link>
                    {row.campaign.error && (
                      <p
                        className="max-w-64 truncate text-xs text-red"
                        title={row.campaign.error}
                      >
                        {row.campaign.error}
                      </p>
                    )}
                  </Td>
                  <Td>
                    <Badge tone={row.campaign.type === "SEQUENCE" ? "indigo" : "slate"}>
                      {titleCase(row.campaign.type)}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={statusTone(row.campaign.status)}>
                      {titleCase(row.campaign.status)}
                    </Badge>
                  </Td>
                  <Td>{row.stats.total}</Td>
                  <Td className="text-teal">{row.stats.sent}</Td>
                  <Td className={row.stats.failed > 0 ? "text-red" : ""}>
                    {row.stats.failed}
                  </Td>
                  <Td>{row.stats.opened}</Td>
                  <Td>{row.stats.clicked}</Td>
                  <Td className="text-xs">
                    {formatDateTime(row.campaign.schedule.startAt)}
                  </Td>
                  <Td className="text-xs">{formatDateTime(row.campaign.createdAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

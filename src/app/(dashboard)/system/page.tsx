"use client";

import {
  Database,
  Mail,
  Inbox,
  Webhook,
  RefreshCw,
} from "lucide-react";
import { useSystemHealth } from "@/hooks/useAdmin";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import type { QueueCounts } from "@/types";

const QUEUE_LABELS: Record<string, string> = {
  "job-import": "Job Import",
  invoice: "Invoice",
  notification: "Notification",
  "calendar-sync": "Calendar Sync",
  "billing-webhook": "Billing Webhook",
};

function queueTone(queue: QueueCounts): "teal" | "amber" | "red" {
  if (queue.error) return "red";
  const failed = queue.failed ?? 0;
  const waiting = queue.waiting ?? 0;
  if (failed > 0) return "red";
  if (waiting > 0) return "amber";
  return "teal";
}

export default function SystemPage() {
  const { data, isLoading, isError, refetch, isFetching } = useSystemHealth();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">System</h1>
          <p className="mt-1 text-sm text-slate-soft">
            Queues, imports, invoices and webhook processing.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} loading={isFetching}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError || !data ? (
        <p className="text-sm text-red">Failed to load system health.</p>
      ) : (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Background queues"
              action={
                <div className="flex items-center gap-1.5 text-xs text-slate-soft">
                  <Database className="h-3.5 w-3.5" /> BullMQ
                </div>
              }
            />
            <Table>
              <THead>
                <Th>Queue</Th>
                <Th className="text-right">Waiting</Th>
                <Th className="text-right">Active</Th>
                <Th className="text-right">Failed</Th>
                <Th className="text-right">Completed</Th>
                <Th>Status</Th>
              </THead>
              <tbody>
                {Object.entries(data.queues).map(([name, counts]) => (
                  <tr key={name} className="border-b border-border/60 last:border-0">
                    <Td className="font-medium text-navy">
                      {QUEUE_LABELS[name] ?? name}
                    </Td>
                    <Td className="text-right">{counts.waiting ?? 0}</Td>
                    <Td className="text-right">{counts.active ?? 0}</Td>
                    <Td className="text-right">
                      <span
                        className={
                          (counts.failed ?? 0) > 0 ? "font-semibold text-red" : ""
                        }
                      >
                        {counts.failed ?? 0}
                      </span>
                    </Td>
                    <Td className="text-right">{counts.completed ?? 0}</Td>
                    <Td>
                      {counts.error ? (
                        <Badge tone="red">Unavailable</Badge>
                      ) : (
                        <Badge tone={queueTone(counts)}>
                          {(counts.failed ?? 0) > 0
                            ? "Needs attention"
                            : (counts.waiting ?? 0) > 0
                            ? "Processing"
                            : "Healthy"}
                        </Badge>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader
                title="Imports"
                action={<Inbox className="h-4 w-4 text-slate-soft" />}
              />
              <p className="text-3xl font-bold text-navy">
                {data.imports.failed}
              </p>
              <p className="mt-1 text-xs text-slate-soft">
                failed import jobs
              </p>
              {data.imports.byStatus.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {data.imports.byStatus.map((row) => (
                    <Badge key={row.status} tone={row.status === "FAILED" ? "red" : "slate"}>
                      {row.status} {row.count}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Invoice emails"
                action={<Mail className="h-4 w-4 text-slate-soft" />}
              />
              <p className="text-3xl font-bold text-navy">
                {data.invoices.emailFailures}
              </p>
              <p className="mt-1 text-xs text-slate-soft">
                invoices with a failed email delivery
              </p>
            </Card>

            <Card>
              <CardHeader
                title="Lemon Squeezy webhooks"
                action={<Webhook className="h-4 w-4 text-slate-soft" />}
              />
              <p className="text-3xl font-bold text-navy">
                {data.lemonsqueezy.pending}
              </p>
              <p className="mt-1 text-xs text-slate-soft">
                unprocessed of {data.lemonsqueezy.total} total events
              </p>
            </Card>
          </div>

          <Card>
            <CardHeader title="Recent webhook events" />
            {data.lemonsqueezy.recent.length === 0 ? (
              <EmptyState title="No webhook events yet" />
            ) : (
              <Table>
                <THead>
                  <Th>Event</Th>
                  <Th>Status</Th>
                  <Th>Received</Th>
                </THead>
                <tbody>
                  {data.lemonsqueezy.recent.map((event) => (
                    <tr key={event.id} className="border-b border-border/60 last:border-0">
                      <Td className="font-medium text-navy">{event.event_name}</Td>
                      <Td>
                        {event.processed ? (
                          <Badge tone="teal">Processed</Badge>
                        ) : (
                          <Badge tone="amber">Pending</Badge>
                        )}
                      </Td>
                      <Td className="text-xs">
                        {formatDateTime(event.created_at)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

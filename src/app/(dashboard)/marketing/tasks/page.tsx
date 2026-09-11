"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Check, X, Trash2, Download, ExternalLink, Phone } from "lucide-react";
import { useTaskMutations, useTasks } from "@/hooks/useMarketing";
import { downloadCsv } from "@/api/marketing.api";
import { useToastStore } from "@/components/ui/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Input, Select } from "@/components/ui/Input";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

function statusTone(status: string): "teal" | "slate" | "amber" {
  switch (status) {
    case "DONE":
      return "teal";
    case "SKIPPED":
      return "amber";
    default:
      return "slate";
  }
}

export default function TasksPage() {
  const toast = useToastStore((s) => s.push);
  const { update, remove } = useTaskMutations();

  const [status, setStatus] = useState("TODO");
  const [channel, setChannel] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useTasks({
    status: status || undefined,
    channel: channel || undefined,
    search: search || undefined,
    page,
    limit: 20,
  });

  const setStatusFor = (id: string, next: string) => {
    update.mutate(
      { id, data: { status: next } },
      {
        onSuccess: () => toast(`Task marked ${next.toLowerCase()}`, "success"),
        onError: (error) =>
          toast((error as { message?: string })?.message ?? "Update failed", "error"),
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Outreach tasks</h1>
          <p className="mt-1 text-sm text-slate-soft">
            The parallel social/phone track — leads without email, with their
            pre-written DM message from the import.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => downloadCsv("/marketing/tasks/export", "outreach-tasks.csv")}
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader
          title="Task queue"
          subtitle="Work through Instagram DMs, Facebook messages and phone calls"
        />
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-soft" />
            <Input
              className="pl-9"
              placeholder="Search business…"
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
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="md:w-40"
          >
            <option value="">Any status</option>
            <option value="TODO">To do</option>
            <option value="DONE">Done</option>
            <option value="SKIPPED">Skipped</option>
          </Select>
          <Select
            value={channel}
            onChange={(e) => {
              setChannel(e.target.value);
              setPage(1);
            }}
            className="md:w-48"
          >
            <option value="">All channels</option>
            <option value="Instagram DM">Instagram DM</option>
            <option value="Facebook message">Facebook message</option>
            <option value="Phone/website">Phone/website</option>
          </Select>
        </div>

        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="py-8 text-center text-sm text-red">
            Failed to load tasks.
          </p>
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title="No tasks match"
            description="Tasks are created automatically on import for social/phone leads."
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th>Lead</Th>
                <Th>Channel</Th>
                <Th>Status</Th>
                <Th>Message / contact</Th>
                <Th>Due</Th>
                <Th className="text-right">Actions</Th>
              </THead>
              <tbody>
                {data.data.map((task) => (
                  <tr
                    key={task._id}
                    className="border-b border-border/60 last:border-0 hover:bg-slate-50/60"
                  >
                    <Td>
                      {task.lead ? (
                        <Link
                          href={`/marketing/leads/${task.lead._id}`}
                          className="font-medium text-navy hover:underline"
                        >
                          {task.lead.businessName ?? "Lead"}
                        </Link>
                      ) : (
                        "—"
                      )}
                      <p className="text-xs text-slate-soft">
                        {task.lead?.leadId ?? ""}
                        {task.lead?.state ? ` · ${task.lead.state}` : ""}
                      </p>
                    </Td>
                    <Td>
                      <Badge tone={task.channel === "Phone/website" ? "amber" : "indigo"}>
                        {task.channel}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge tone={statusTone(task.status)}>{task.status}</Badge>
                    </Td>
                    <Td className="max-w-80">
                      {task.channel === "Phone/website" ? (
                        <span className="flex items-center gap-1.5 text-sm">
                          <Phone className="h-3.5 w-3.5 text-slate-soft" />
                          {task.lead?.phone ?? "—"}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="max-w-64 truncate text-xs text-slate-body" title={task.message ?? ""}>
                            {task.message ? `${task.message.slice(0, 70)}…` : "No message"}
                          </p>
                          {task.message && (
                            <button
                              className="shrink-0 text-xs font-medium text-admin-indigo hover:underline"
                              onClick={() => {
                                void navigator.clipboard.writeText(task.message ?? "");
                                toast("Message copied", "success");
                              }}
                            >
                              Copy
                            </button>
                          )}
                        </div>
                      )}
                      {task.lead?.instagramUrl && (
                        <a
                          href={task.lead.instagramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-soft hover:text-admin-indigo"
                        >
                          <ExternalLink className="h-3 w-3" /> Instagram
                        </a>
                      )}
                      {task.lead?.facebookUrl && (
                        <a
                          href={task.lead.facebookUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 inline-flex items-center gap-1 text-[11px] text-slate-soft hover:text-admin-indigo"
                        >
                          <ExternalLink className="h-3 w-3" /> Facebook
                        </a>
                      )}
                    </Td>
                    <Td className="text-xs">{formatDate(task.dueDate)}</Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        {task.status !== "DONE" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Mark done"
                            onClick={() => setStatusFor(task._id, "DONE")}
                          >
                            <Check className="h-3.5 w-3.5 text-teal" />
                          </Button>
                        )}
                        {task.status !== "SKIPPED" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Skip"
                            onClick={() => setStatusFor(task._id, "SKIPPED")}
                          >
                            <X className="h-3.5 w-3.5 text-amber" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete"
                          className="text-red hover:bg-red-50"
                          onClick={() => {
                            if (window.confirm("Delete this task?")) {
                              remove.mutate(task._id, {
                                onSuccess: () => toast("Task deleted", "success"),
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}

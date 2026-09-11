"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, RotateCcw, Ban } from "lucide-react";
import { useSuppressions, useSuppressionMutations } from "@/hooks/useMarketing";
import { useToastStore } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, titleCase } from "@/lib/utils";

function typeTone(type: string): "red" | "amber" | "slate" {
  switch (type) {
    case "UNSUBSCRIBE":
      return "red";
    case "BOUNCE":
    case "COMPLAINT":
      return "amber";
    default:
      return "slate";
  }
}

export default function UnsubscribesPage() {
  const toast = useToastStore((s) => s.push);
  const { create, remove } = useSuppressionMutations();

  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newReason, setNewReason] = useState("");

  const { data, isLoading, isError } = useSuppressions({
    search: search || undefined,
    type: type || undefined,
    page,
    limit: 20,
  });

  const submitAdd = () => {
    if (!newEmail.trim()) return;
    create.mutate(
      {
        email: newEmail.trim(),
        type: "MANUAL",
        reason: newReason.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast(`${newEmail.trim()} suppressed`, "success");
          setAddOpen(false);
          setNewEmail("");
          setNewReason("");
        },
        onError: (error) =>
          toast((error as { message?: string })?.message ?? "Failed", "error"),
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Unsubscribes & suppressions</h1>
          <p className="mt-1 text-sm text-slate-soft">
            Emails that will never receive campaigns — unsubscribes, bounces,
            spam complaints and manual blocks. Campaign previews exclude these
            automatically.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Suppress an email
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <Input
              placeholder="Search email…"
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
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
            className="md:w-48"
          >
            <option value="">All types</option>
            <option value="UNSUBSCRIBE">Unsubscribe</option>
            <option value="BOUNCE">Bounce</option>
            <option value="COMPLAINT">Complaint</option>
            <option value="MANUAL">Manual</option>
          </Select>
        </div>

        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="py-8 text-center text-sm text-red">
            Failed to load suppressions.
          </p>
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title="Nothing suppressed yet"
            description="Unsubscribes and bounces from campaigns will appear here."
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th>Email</Th>
                <Th>Type</Th>
                <Th>Reason</Th>
                <Th>Lead</Th>
                <Th>Since</Th>
                <Th className="text-right">Actions</Th>
              </THead>
              <tbody>
                {data.data.map((s) => (
                  <tr key={s._id} className="border-b border-border/60 last:border-0">
                    <Td className="font-medium text-navy">{s.email}</Td>
                    <Td>
                      <Badge tone={typeTone(s.type)}>
                        {s.type === "UNSUBSCRIBE" ? (
                          <Ban className="h-3 w-3" />
                        ) : null}
                        {titleCase(s.type)}
                      </Badge>
                    </Td>
                    <Td className="text-xs">
                      <span
                        className="block max-w-56 truncate text-slate-soft"
                        title={s.reason ?? ""}
                      >
                        {s.reason ?? "—"}
                      </span>
                    </Td>
                    <Td className="text-xs">
                      {s.leadRef ? (
                        <Link
                          href={`/marketing/leads/${s.leadRef}`}
                          className="text-admin-indigo hover:underline"
                        >
                          View lead
                        </Link>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="text-xs">{formatDateTime(s.createdAt)}</Td>
                    <Td>
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Remove suppression (re-subscribe)"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Re-subscribe ${s.email}? Future campaigns will include them again.`
                              )
                            ) {
                              remove.mutate(s._id, {
                                onSuccess: () =>
                                  toast(`${s.email} re-subscribed`, "success"),
                              });
                            }
                          }}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
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

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Suppress an email"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button loading={create.isPending} onClick={submitAdd} disabled={!newEmail.trim()}>
              Suppress
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Email *"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="stop@example.com"
          />
          <Input
            label="Reason (optional)"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Requested via phone"
          />
          <p className="text-xs text-slate-soft">
            If a CRM lead exists with this email it will be marked UNSUBSCRIBED
            and its queued campaign emails will be skipped.
          </p>
        </div>
      </Modal>
    </div>
  );
}

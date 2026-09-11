"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Pencil, Send } from "lucide-react";
import { useWaveMutations, useWaves } from "@/hooks/useMarketing";
import { useToastStore } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import type { WaveRow } from "@/types";

function statusTone(status: string): "teal" | "blue" | "slate" {
  switch (status) {
    case "ACTIVE":
      return "teal";
    case "COMPLETED":
      return "blue";
    default:
      return "slate";
  }
}

function toLocalDateInput(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function WavesPage() {
  const toast = useToastStore((s) => s.push);
  const { data, isLoading, isError } = useWaves();
  const { update } = useWaveMutations();

  const [editing, setEditing] = useState<WaveRow | null>(null);
  const [name, setName] = useState("");
  const [plannedStart, setPlannedStart] = useState("");
  const [status, setStatus] = useState("PLANNED");
  const [notes, setNotes] = useState("");

  const openEdit = (row: WaveRow) => {
    setEditing(row);
    setName(row.wave.name);
    setPlannedStart(toLocalDateInput(row.wave.plannedStart));
    setStatus(row.wave.status);
    setNotes(row.wave.notes ?? "");
  };

  const save = () => {
    if (!editing) return;
    update.mutate(
      {
        id: editing.wave._id,
        data: {
          name: name.trim(),
          plannedStart: plannedStart || null,
          status,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast("Wave updated", "success");
          setEditing(null);
        },
        onError: (error) =>
          toast((error as { message?: string })?.message ?? "Update failed", "error"),
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Waves</h1>
        <p className="mt-1 text-sm text-slate-soft">
          Plan and track the campaign waves (from the campaign spreadsheet).
          Start a sequence campaign per wave from the campaign wizard.
        </p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p className="py-8 text-center text-sm text-red">Failed to load waves.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {(data ?? []).map((row) => {
            const { wave, progress } = row;
            const sendRate =
              progress.withEmail > 0
                ? Math.round((progress.sent / progress.withEmail) * 100)
                : 0;
            return (
              <Card key={wave._id}>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-navy">
                        {wave.name}
                      </h3>
                      <Badge tone={statusTone(wave.status)}>{wave.status}</Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-soft">
                      <Calendar className="h-3 w-3" />
                      {wave.plannedStart
                        ? `Planned start ${formatDate(wave.plannedStart)}`
                        : "No planned start"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Link
                      href={`/marketing/campaigns/new?wave=${wave.waveKey}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-admin-indigo hover:bg-indigo-50"
                    >
                      <Send className="h-3.5 w-3.5" /> Campaign
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center md:grid-cols-6">
                  {[
                    { label: "Leads", value: progress.leads },
                    { label: "Emails", value: progress.withEmail },
                    { label: "Sent", value: progress.sent },
                    { label: "Opened", value: progress.opened },
                    { label: "Queued", value: progress.queued },
                    { label: "Failed", value: progress.failed },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-slate-50 p-2">
                      <p className="text-lg font-bold text-navy">{s.value}</p>
                      <p className="text-[10px] uppercase text-slate-soft">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[11px] text-slate-soft">
                    <span>Send progress</span>
                    <span>{sendRate}% of emailable leads</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-admin-indigo"
                      style={{ width: `${Math.min(100, sendRate)}%` }}
                    />
                  </div>
                </div>

                {wave.notes && (
                  <p className="mt-3 text-xs text-slate-soft">{wave.notes}</p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.wave.name ?? "wave"}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={update.isPending} onClick={save}>
              Save wave
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Planned start"
            type="date"
            value={plannedStart}
            onChange={(e) => setPlannedStart(e.target.value)}
          />
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="PLANNED">Planned</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </Select>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-body">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-admin-indigo focus:ring-2 focus:ring-indigo-100"
              placeholder="Qualification-first approach for C tier…"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

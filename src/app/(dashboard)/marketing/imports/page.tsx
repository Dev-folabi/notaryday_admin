"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Upload, FileSpreadsheet, Play, Save } from "lucide-react";
import {
  useImportMutations,
  useMappingPresets,
  useMarketingImport,
  useMarketingImports,
} from "@/hooks/useMarketing";
import { useToastStore } from "@/components/ui/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Input, Select } from "@/components/ui/Input";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, titleCase } from "@/lib/utils";
import { IMPORT_TARGET_FIELDS } from "@/types";
import type { ImportJob } from "@/types";

function statusTone(status: string): "teal" | "amber" | "red" | "slate" {
  switch (status) {
    case "COMPLETED":
      return "teal";
    case "COMPLETED_WITH_ERRORS":
    case "QUEUED":
    case "PROCESSING":
      return "amber";
    case "FAILED":
      return "red";
    default:
      return "slate";
  }
}

function ImportsInner() {
  const toast = useToastStore((s) => s.push);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: importHistory, isLoading: historyLoading } =
    useMarketingImports();
  const { data: presets } = useMappingPresets();
  const { upload, saveMapping, start } = useImportMutations();

  const [activeId, setActiveId] = useState<string | null>(
    searchParams.get("focus")
  );
  const { data: activeImport } = useMarketingImport(activeId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Draft mapping overrides; null = use the server-saved mapping
  const [draft, setDraft] = useState<Record<string, number> | null>(null);
  const [presetName, setPresetName] = useState("");

  const mapping: Record<string, number> =
    draft ?? activeImport?.mapping ?? {};
  const setField = (fieldKey: string, value: string) => {
    setDraft((prev) => {
      const base = prev ?? activeImport?.mapping ?? {};
      const next = { ...base };
      if (value === "") delete next[fieldKey];
      else next[fieldKey] = Number(value);
      return next;
    });
  };

  const onFileSelected = (file: File | null) => {
    if (!file) return;
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      toast("Only .xlsx and .csv files are supported", "error");
      return;
    }
    upload.mutate(file, {
      onSuccess: (result) => {
        toast(
          `Uploaded "${file.name}" — ${result.import.totalRows} rows detected`,
          "success"
        );
        setActiveId(result.import._id);
        setDraft(result.suggestedMapping ?? {});
      },
      onError: (error) =>
        toast((error as { message?: string })?.message ?? "Upload failed", "error"),
    });
  };

  const openImport = (importId: string) => {
    setActiveId(importId);
    setDraft(null);
  };

  const applyPreset = (presetId: string) => {
    const preset = presets?.find((p) => p._id === presetId);
    if (!preset || !activeId) return;
    setDraft(preset.mapping);
  };

  const saveAndStart = (startNow: boolean) => {
    if (!activeId) return;
    const mappedFields = Object.keys(mapping).length;
    if (mappedFields === 0) {
      toast("Map at least one column first", "error");
      return;
    }
    saveMapping.mutate(
      {
        id: activeId,
        mapping,
        saveAsPreset: presetName.trim() || undefined,
      },
      {
        onSuccess: () => {
          if (startNow) {
            start.mutate(
              { id: activeId },
              {
                onSuccess: () =>
                  toast("Import queued — processing in the marketing worker", "success"),
                onError: (error) =>
                  toast((error as { message?: string })?.message ?? "Start failed", "error"),
              }
            );
          } else {
            toast("Mapping saved", "success");
          }
        },
        onError: (error) =>
          toast((error as { message?: string })?.message ?? "Save failed", "error"),
      }
    );
  };

  const busy =
    activeImport?.status === "QUEUED" || activeImport?.status === "PROCESSING";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Imports</h1>
        <p className="mt-1 text-sm text-slate-soft">
          Upload lead spreadsheets (.xlsx / .csv), map columns, and process them
          into the CRM.
        </p>
      </div>

      {/* Upload */}
      <Card>
        <CardHeader
          title="Upload a spreadsheet"
          subtitle="Max 15MB · .xlsx or .csv · the 9-email sequence columns are detected automatically"
        />
        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-slate-50/50 px-6 py-10 text-center transition-colors hover:border-admin-indigo hover:bg-indigo-50/30"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFileSelected(e.dataTransfer.files?.[0] ?? null);
          }}
        >
          <FileSpreadsheet className="h-8 w-8 text-slate-soft" />
          <p className="mt-3 text-sm font-medium text-slate-body">
            {upload.isPending
              ? "Uploading & reading headers…"
              : "Drop a file here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-slate-soft">
            e.g. notaryday_leads_campaign_ready_v4.xlsx
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(e) => {
              onFileSelected(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
        </div>
      </Card>

      {/* Mapping / active import */}
      {activeImport && (
        <Card>
          <CardHeader
            title={`Mapping — ${activeImport.filename}`}
            subtitle={`${activeImport.totalRows} data rows · ${activeImport.headers.length} columns · status: ${titleCase(activeImport.status)}`}
            action={
              <Badge tone={statusTone(activeImport.status)}>
                {titleCase(activeImport.status)}
              </Badge>
            }
          />

          {busy ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <Spinner />
              <p className="text-sm text-slate-body">
                Processing import in the marketing worker…
              </p>
              <p className="text-xs text-slate-soft">
                This page refreshes automatically.
              </p>
            </div>
          ) : ["COMPLETED", "COMPLETED_WITH_ERRORS", "FAILED"].includes(
              activeImport.status
            ) ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-xl font-bold text-navy">
                    {activeImport.totalRows}
                  </p>
                  <p className="text-[11px] uppercase text-slate-soft">Rows</p>
                </div>
                <div className="rounded-lg bg-teal-50 p-3 text-center">
                  <p className="text-xl font-bold text-teal">
                    {activeImport.importedCount}
                  </p>
                  <p className="text-[11px] uppercase text-slate-soft">New</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-3 text-center">
                  <p className="text-xl font-bold text-admin-indigo">
                    {activeImport.updatedCount}
                  </p>
                  <p className="text-[11px] uppercase text-slate-soft">Updated</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-center">
                  <p className="text-xl font-bold text-amber">
                    {activeImport.duplicateCount}
                  </p>
                  <p className="text-[11px] uppercase text-slate-soft">Dupes</p>
                </div>
                <div className="rounded-lg bg-red-50 p-3 text-center">
                  <p className="text-xl font-bold text-red">
                    {activeImport.errorCount}
                  </p>
                  <p className="text-[11px] uppercase text-slate-soft">Errors</p>
                </div>
              </div>

              {activeImport.status === "FAILED" && activeImport.error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red">
                  {activeImport.error}
                </p>
              )}

              {activeImport.rowErrors && activeImport.rowErrors.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                  <Table>
                    <THead>
                      <Th>Row</Th>
                      <Th>Error</Th>
                      <Th>Lead ID</Th>
                    </THead>
                    <tbody>
                      {activeImport.rowErrors.map((e, i) => (
                        <tr key={i} className="border-b border-border/60 last:border-0">
                          <Td>{e.row}</Td>
                          <Td className="text-red">{e.error}</Td>
                          <Td>{e.leadId ?? "—"}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              <div className="flex gap-2">
                {activeImport.status === "FAILED" && (
                  <Button
                    size="sm"
                    loading={start.isPending}
                    onClick={() =>
                      start.mutate(
                        { id: activeImport._id },
                        {
                          onSuccess: () => toast("Import re-queued", "success"),
                          onError: (error) =>
                            toast(
                              (error as { message?: string })?.message ??
                                "Retry failed",
                              "error"
                            ),
                        }
                      )
                    }
                  >
                    <Play className="h-3.5 w-3.5" /> Retry import
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push("/marketing/leads")}
                >
                  View leads →
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setActiveId(null)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Sample preview */}
              {activeImport.sampleRows.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50/80">
                        {activeImport.headers.map((h, i) => (
                          <th
                            key={i}
                            className="whitespace-nowrap border-b border-border px-2 py-1.5 text-left font-semibold text-slate-body"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeImport.sampleRows.slice(0, 2).map((row, ri) => (
                        <tr key={ri}>
                          {activeImport.headers.map((_, ci) => (
                            <td
                              key={ci}
                              className="max-w-40 truncate border-b border-border/40 px-2 py-1.5 text-slate-body"
                              title={row[ci]}
                            >
                              {row[ci]?.slice(0, 40) ?? ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mapping editor */}
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-soft">
                    Column mapping ({Object.keys(mapping).length} fields mapped)
                  </p>
                  {presets && presets.length > 0 && (
                    <Select
                      className="w-56 text-xs"
                      value=""
                      onChange={(e) => e.target.value && applyPreset(e.target.value)}
                    >
                      <option value="">Apply saved preset…</option>
                      {presets.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {IMPORT_TARGET_FIELDS.map((field) => (
                    <label key={field.key} className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-slate-body">
                        {field.label}
                      </span>
                      <Select
                        value={
                          mapping[field.key] !== undefined
                            ? String(mapping[field.key])
                            : ""
                        }
                        onChange={(e) => setField(field.key, e.target.value)}
                        className="text-xs"
                      >
                        <option value="">— not mapped —</option>
                        {activeImport.headers.map((h, i) => (
                          <option key={i} value={i}>
                            {h}
                          </option>
                        ))}
                      </Select>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <Input
                  label="Save mapping as preset (optional)"
                  className="w-56"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="notaryday_leads_v4"
                />
                <div className="flex flex-1 justify-end gap-2">
                  <Button
                    variant="secondary"
                    loading={saveMapping.isPending}
                    onClick={() => saveAndStart(false)}
                  >
                    <Save className="h-3.5 w-3.5" /> Save mapping
                  </Button>
                  <Button
                    loading={start.isPending || saveMapping.isPending}
                    onClick={() => saveAndStart(true)}
                  >
                    <Play className="h-3.5 w-3.5" /> Save & start import
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader title="Import history" />
        {historyLoading ? (
          <Spinner />
        ) : !importHistory || importHistory.length === 0 ? (
          <EmptyState
            title="No imports yet"
            description="Upload your first lead spreadsheet above."
          />
        ) : (
          <Table>
            <THead>
              <Th>File</Th>
              <Th>Status</Th>
              <Th>Rows</Th>
              <Th>New</Th>
              <Th>Updated</Th>
              <Th>Dupes</Th>
              <Th>Errors</Th>
              <Th>Uploaded</Th>
              <Th />
            </THead>
            <tbody>
              {importHistory.map((imp: ImportJob) => (
                <tr key={imp._id} className="border-b border-border/60 last:border-0">
                  <Td>
                    <span className="flex items-center gap-2 font-medium text-navy">
                      <Upload className="h-3.5 w-3.5 text-slate-soft" />
                      {imp.filename}
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={statusTone(imp.status)}>
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
                  <Td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openImport(imp._id)}
                    >
                      {["UPLOADED", "MAPPED"].includes(imp.status)
                        ? "Continue →"
                        : imp.status === "FAILED"
                          ? "Retry →"
                          : "Details"}
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export default function MarketingImportsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ImportsInner />
    </Suspense>
  );
}

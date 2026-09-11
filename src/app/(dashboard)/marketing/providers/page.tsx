"use client";

import { useState } from "react";
import {
  Plus,
  Send,
  Trash2,
  PauseCircle,
  PlayCircle,
  KeyRound,
} from "lucide-react";
import { useMarketingProviders, useProviderMutations } from "@/hooks/useMarketing";
import { useToastStore } from "@/components/ui/Toast";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime } from "@/lib/utils";
import type { EmailProvider, ProviderType } from "@/types";

const PROVIDER_TYPE_OPTIONS: { value: ProviderType; label: string; hint: string }[] = [
  { value: "brevo", label: "Brevo (API)", hint: "Transactional API + delivery webhooks" },
  { value: "resend", label: "Resend (API)", hint: "Existing NotaryDay email provider" },
  { value: "zoho", label: "Zoho Mail (SMTP)", hint: "smtp.zoho.com — user + password" },
  { value: "gmail", label: "Gmail (SMTP)", hint: "smtp.gmail.com — user + app password" },
];

const CREDENTIAL_FIELDS: Record<ProviderType, { key: string; label: string; secret: boolean; placeholder?: string }[]> = {
  resend: [{ key: "apiKey", label: "API key", secret: true, placeholder: "re_..." }],
  brevo: [{ key: "apiKey", label: "API key", secret: true, placeholder: "xkeys-ib-..." }],
  zoho: [
    { key: "user", label: "Zoho email", secret: false, placeholder: "you@zoho.com" },
    { key: "password", label: "Password / app password", secret: true },
    { key: "host", label: "SMTP host (optional)", secret: false, placeholder: "smtp.zoho.com" },
    { key: "port", label: "SMTP port (optional)", secret: false, placeholder: "587" },
  ],
  gmail: [
    { key: "user", label: "Gmail address", secret: false, placeholder: "you@gmail.com" },
    { key: "appPassword", label: "App password", secret: true, placeholder: "16-char app password" },
    { key: "host", label: "SMTP host (optional)", secret: false, placeholder: "smtp.gmail.com" },
    { key: "port", label: "SMTP port (optional)", secret: false, placeholder: "465" },
  ],
};

interface ProviderFormState {
  name: string;
  type: ProviderType;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  perMinuteLimit: string;
  dailyLimit: string;
  warmupEnabled: boolean;
  notes: string;
  credentials: Record<string, string>;
}

const emptyForm = (type: ProviderType): ProviderFormState => ({
  name: "",
  type,
  fromName: "",
  fromEmail: "",
  replyTo: "",
  perMinuteLimit: "30",
  dailyLimit: "100",
  warmupEnabled: false,
  notes: "",
  credentials: {},
});

export default function MarketingProvidersPage() {
  const toast = useToastStore((s) => s.push);
  const { data: providers, isLoading, isError } = useMarketingProviders();
  const { create, update, remove, test } = useProviderMutations();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EmailProvider | null>(null);
  const [form, setForm] = useState<ProviderFormState>(emptyForm("brevo"));
  const [testModalFor, setTestModalFor] = useState<EmailProvider | null>(null);
  const [testTo, setTestTo] = useState("");

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm("brevo"));
    setModalOpen(true);
  };

  const openEdit = (provider: EmailProvider) => {
    setEditing(provider);
    setForm({
      name: provider.name,
      type: provider.type,
      fromName: provider.fromName,
      fromEmail: provider.fromEmail,
      replyTo: provider.replyTo ?? "",
      perMinuteLimit: String(provider.perMinuteLimit),
      dailyLimit: String(provider.dailyLimit),
      warmupEnabled: provider.warmupEnabled,
      notes: provider.notes ?? "",
      credentials: {},
    });
    setModalOpen(true);
  };

  const submit = () => {
    if (!form.name.trim() || !form.fromName.trim() || !form.fromEmail.trim()) {
      toast("Name, from name and from email are required", "error");
      return;
    }
    if (!editing) {
      const required = CREDENTIAL_FIELDS[form.type].filter((f) => !["host", "port"].includes(f.key));
      const missing = required.filter((f) => !(form.credentials[f.key] ?? "").trim());
      if (missing.length > 0) {
        toast(`Missing credentials: ${missing.map((f) => f.label).join(", ")}`, "error");
        return;
      }
    }

    const base = {
      name: form.name.trim(),
      type: form.type,
      fromName: form.fromName.trim(),
      fromEmail: form.fromEmail.trim().toLowerCase(),
      replyTo: form.replyTo.trim().toLowerCase() || undefined,
      perMinuteLimit: Number(form.perMinuteLimit) || 30,
      dailyLimit: Number(form.dailyLimit) || 100,
      warmupEnabled: form.warmupEnabled,
      notes: form.notes.trim() || undefined,
    };

    if (editing) {
      const payload: Record<string, unknown> = { ...base };
      const hasNewCreds = Object.values(form.credentials).some((v) => (v ?? "").trim());
      if (hasNewCreds) payload.credentials = form.credentials;
      update.mutate(
        { id: editing._id, data: payload },
        {
          onSuccess: () => {
            toast("Provider updated", "success");
            setModalOpen(false);
          },
          onError: (error) =>
            toast((error as { message?: string })?.message ?? "Update failed", "error"),
        }
      );
    } else {
      create.mutate(
        { ...base, credentials: form.credentials },
        {
          onSuccess: () => {
            toast("Provider added", "success");
            setModalOpen(false);
          },
          onError: (error) =>
            toast((error as { message?: string })?.message ?? "Create failed", "error"),
        }
      );
    }
  };

  const runTest = () => {
    if (!testModalFor || !testTo.trim()) return;
    test.mutate(
      { id: testModalFor._id, to: testTo.trim() },
      {
        onSuccess: () => {
          toast(`Test email sent to ${testTo}`, "success");
          setTestModalFor(null);
          setTestTo("");
        },
        onError: (error) =>
          toast((error as { message?: string })?.message ?? "Test send failed", "error"),
      }
    );
  };

  const toggleStatus = (provider: EmailProvider) => {
    update.mutate(
      {
        id: provider._id,
        data: { status: provider.status === "ACTIVE" ? "PAUSED" : "ACTIVE" },
      },
      { onError: (error) => toast((error as { message?: string })?.message ?? "Failed", "error") }
    );
  };

  const credFields = CREDENTIAL_FIELDS[form.type];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Email providers</h1>
          <p className="mt-1 text-sm text-slate-soft">
            Accounts used to send marketing campaigns. Credentials are encrypted at rest.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> Add provider
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="py-8 text-center text-sm text-red">
            Failed to load providers.
          </p>
        ) : !providers || providers.length === 0 ? (
          <EmptyState
            title="No email providers yet"
            description="Add a Brevo, Resend, Zoho Mail or Gmail account to power campaign sending."
          />
        ) : (
          <Table>
            <THead>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>From</Th>
              <Th>Status</Th>
              <Th>Limits</Th>
              <Th>Sent today</Th>
              <Th>Health</Th>
              <Th className="text-right">Actions</Th>
            </THead>
            <tbody>
              {providers.map((p) => (
                <tr key={p._id} className="border-b border-border/60 last:border-0">
                  <Td>
                    <button
                      className="font-medium text-navy hover:underline"
                      onClick={() => openEdit(p)}
                    >
                      {p.name}
                    </button>
                    {p.isDefault && (
                      <Badge tone="indigo" className="ml-2">
                        Default
                      </Badge>
                    )}
                    <p className="text-xs text-slate-soft">
                      <KeyRound className="mr-0.5 inline h-3 w-3" />
                      {p.credentialsSet.join(", ") || "no credentials"}
                    </p>
                  </Td>
                  <Td className="uppercase">{p.type}</Td>
                  <Td className="text-xs">
                    {p.fromName}
                    <br />
                    <span className="text-slate-soft">{p.fromEmail}</span>
                  </Td>
                  <Td>
                    <Badge tone={p.status === "ACTIVE" ? "teal" : "amber"}>
                      {p.status}
                    </Badge>
                  </Td>
                  <Td className="text-xs">
                    {p.perMinuteLimit}/min
                    <br />
                    {p.dailyLimit}/day
                  </Td>
                  <Td className="text-xs">{p.sentToday}</Td>
                  <Td className="max-w-44 text-xs">
                    {p.healthLastError ? (
                      <span className="text-red" title={p.healthLastError}>
                        {formatDateTime(p.healthLastErrorAt)}:{" "}
                        {p.healthLastError.slice(0, 60)}
                      </span>
                    ) : p.healthLastSuccessAt ? (
                      <span className="text-teal">
                        OK · {formatDateTime(p.healthLastSuccessAt)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Send test email"
                        onClick={() => setTestModalFor(p)}
                      >
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title={p.status === "ACTIVE" ? "Pause" : "Activate"}
                        onClick={() => toggleStatus(p)}
                      >
                        {p.status === "ACTIVE" ? (
                          <PauseCircle className="h-3.5 w-3.5" />
                        ) : (
                          <PlayCircle className="h-3.5 w-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete"
                        className="text-red hover:bg-red-50"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete provider "${p.name}"? Campaigns using it will need reassignment.`
                            )
                          ) {
                            remove.mutate(p._id);
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
        )}
      </Card>

      <p className="text-xs text-slate-soft">
        Deliverability tip: send marketing from a dedicated subdomain (e.g.
        go.notaryday.app) with its own SPF/DKIM/DMARC so cold outreach cannot
        hurt the primary domain reputation. Gmail accounts are limited to ~500
        sends/day and should be used as a trickle channel only.
      </p>

      {/* Create / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.name}` : "Add email provider"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={create.isPending || update.isPending}
              onClick={submit}
            >
              {editing ? "Save changes" : "Add provider"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input
              label="Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Brevo main"
            />
          </div>
          <Select
            label="Type *"
            value={form.type}
            disabled={!!editing}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as ProviderType, credentials: {} })
            }
          >
            {PROVIDER_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input
            label="From name *"
            value={form.fromName}
            onChange={(e) => setForm({ ...form, fromName: e.target.value })}
            placeholder="Yusuf"
          />
          <Input
            label="From email *"
            type="email"
            value={form.fromEmail}
            onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
            placeholder="yusuf@go.notaryday.app"
          />
          <Input
            label="Reply-to"
            type="email"
            value={form.replyTo}
            onChange={(e) => setForm({ ...form, replyTo: e.target.value })}
            placeholder="yusuf@notaryday.app"
          />
          <Input
            label="Per-minute limit"
            type="number"
            value={form.perMinuteLimit}
            onChange={(e) => setForm({ ...form, perMinuteLimit: e.target.value })}
          />
          <Input
            label="Daily limit"
            type="number"
            value={form.dailyLimit}
            onChange={(e) => setForm({ ...form, dailyLimit: e.target.value })}
          />
          <label className="col-span-2 flex items-center gap-2 text-sm text-slate-body">
            <input
              type="checkbox"
              checked={form.warmupEnabled}
              onChange={(e) => setForm({ ...form, warmupEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300"
            />
            Enable warmup (gradually raise daily volume)
          </label>
          <div className="col-span-2 mt-1">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-soft">
              Credentials {editing && "(leave blank to keep current)"}
            </p>
            <p className="mb-3 text-[11px] text-slate-soft">
              {PROVIDER_TYPE_OPTIONS.find((o) => o.value === form.type)?.hint}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {credFields.map((f) => (
                <Input
                  key={f.key}
                  label={f.label}
                  type={f.secret ? "password" : "text"}
                  value={form.credentials[f.key] ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      credentials: {
                        ...form.credentials,
                        [f.key]: e.target.value,
                      },
                    })
                  }
                  placeholder={
                    editing && f.secret ? "•••• (unchanged)" : (f.placeholder ?? "")
                  }
                />
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <Input
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="DNS verified, warmed up since…"
            />
          </div>
        </div>
      </Modal>

      {/* Test send modal */}
      <Modal
        open={!!testModalFor}
        onClose={() => setTestModalFor(null)}
        title={`Test send — ${testModalFor?.name ?? ""}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTestModalFor(null)}>
              Cancel
            </Button>
            <Button
              loading={test.isPending}
              onClick={runTest}
              disabled={!testTo.trim()}
            >
              <Send className="h-3.5 w-3.5" /> Send test
            </Button>
          </>
        }
      >
        <Input
          label="Send test email to"
          type="email"
          value={testTo}
          onChange={(e) => setTestTo(e.target.value)}
          placeholder="admin@notaryday.app"
        />
        <p className="mt-2 text-xs text-slate-soft">
          Sends a short plain message through the provider&apos;s real
          credentials and records success/failure in provider health.
        </p>
      </Modal>
    </div>
  );
}

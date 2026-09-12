"use client";

import { useState } from "react";
import { Send, RefreshCw } from "lucide-react";
import { useEmailProviders, useEmailProviderMutations } from "@/hooks/useAdmin";
import { useToastStore } from "@/components/ui/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { TransactionalProviderType } from "@/types";

const PROVIDER_OPTIONS: {
  value: TransactionalProviderType;
  label: string;
  envVar: string;
  fromEnvVar: string;
}[] = [
  {
    value: "resend",
    label: "Resend",
    envVar: "RESEND_API_KEY",
    fromEnvVar: "RESEND_FROM_ADDRESS",
  },
  {
    value: "brevo",
    label: "Brevo",
    envVar: "BREVO_API_KEY",
    fromEnvVar: "BREVO_FROM_ADDRESS",
  },
];

export default function EmailProvidersPage() {
  const toast = useToastStore((s) => s.push);
  const { data, isLoading, isError, refetch } = useEmailProviders();
  const { toggle, test } = useEmailProviderMutations();

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testProvider, setTestProvider] = useState<TransactionalProviderType>("resend");
  const [testTo, setTestTo] = useState("");
  const [testSubject, setTestSubject] = useState("Notary Day test email");
  const testHtml = "<p>This is a test email from Notary Day.</p>";
  const activeProvider = data?.active ?? "resend";

  const switchProvider = (provider: TransactionalProviderType) => {
    toggle.mutate(provider, {
      onSuccess: () => {
        toast(`Active provider changed to ${provider}`, "success");
        refetch();
      },
      onError: (error) =>
        toast(
          (error as { message?: string })?.message ?? "Failed to update provider",
          "error"
        ),
    });
  };

  const runTest = () => {
    if (!testTo.trim()) return;
    test.mutate(
      {
        provider: testProvider,
        to: testTo,
        subject: testSubject,
        html: testHtml,
      },
      {
        onSuccess: (result) => {
          toast(
            `Test email sent via ${result.provider || testProvider} · ${result.messageId ?? ""}`,
            "success"
          );
          setTestModalOpen(false);
        },
        onError: (error) =>
          toast(
            (error as { message?: string })?.message ?? "Test send failed",
            "error"
          ),
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Transactional email providers</h1>
          <p className="mt-1 text-sm text-slate-soft">
            Choose which provider (Resend or Brevo) handles all transactional
            emails — welcome, invoice, reminder, and password-reset sends.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()} loading={isLoading}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError || !data ? (
        <p className="text-sm text-red">Failed to load provider settings.</p>
      ) : (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Active provider"
              subtitle="All transactional sends go through this provider. If it fails, sends automatically fall back to the other provider."
            />
            <div className="flex items-center gap-4">
              <Badge tone="indigo" className="font-mono text-sm">
                {activeProvider}
              </Badge>
              <span className="text-sm text-slate-soft">
                Changes take effect within 30 seconds across API and worker
                processes.
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              {data.providers.map((p) => {
                const selected = activeProvider === p.type;
                const option = PROVIDER_OPTIONS.find((o) => o.value === p.type);
                return (
                  <div
                    key={p.type}
                    className="flex items-center gap-2 rounded-lg border border-border p-3"
                  >
                    <input
                      type="radio"
                      name="provider"
                      checked={selected}
                      onChange={() => switchProvider(p.type)}
                      disabled={toggle.isPending || !p.configured}
                      className="h-4 w-4 text-navy focus:ring-navy"
                    />
                    <div>
                      <p className="font-medium text-navy">{p.label}</p>
                      <p className="text-xs text-slate-soft">
                        {p.configured
                          ? `Configured · ${p.fromEmail}`
                          : `Not configured — set ${option?.envVar} to enable`}
                      </p>
                    </div>
                    {!p.configured && (
                      <Badge tone="slate" className="ml-2">
                        Unavailable
                      </Badge>
                    )}
                    {selected && (
                      <Badge tone="teal" className="ml-2">
                        Active
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="Send a test email" subtitle="Verify a provider can deliver mail." />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Select
                label="Provider"
                value={testProvider}
                onChange={(e) => setTestProvider(e.target.value as TransactionalProviderType)}
              >
                {data.providers.map((p) => (
                  <option key={p.type} value={p.type} disabled={!p.configured}>
                    {p.label} {p.configured ? "" : "(not configured)"}
                  </option>
                ))}
              </Select>
              <Input
                label="Send to"
                type="email"
                placeholder="admin@notaryday.app"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
              />
              <Input
                label="Subject"
                placeholder="Email subject"
                value={testSubject}
                onChange={(e) => setTestSubject(e.target.value)}
              />
              <Button
                size="sm"
                onClick={() => setTestModalOpen(true)}
                disabled={!testTo.trim() || test.isPending}
              >
                Send
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Provider details" subtitle="Environment variables" />
            <table className="w-full text-sm">
              <tbody>
                {data.providers.map((p) => {
                  const option = PROVIDER_OPTIONS.find((o) => o.value === p.type);
                  return (
                    <tr key={p.type} className="border-b border-border/60 last:border-0">
                      <td className="py-2 font-medium text-navy">{p.label}</td>
                      <td className="py-2 text-slate-soft">
                        {option?.envVar}={p.configured ? "set" : "—"}
                      </td>
                      <td className="py-2 text-slate-soft">
                        {option?.fromEnvVar}={p.fromEmail || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      <Modal
        open={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title="Test email confirmation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTestModalOpen(false)} disabled={test.isPending}>
              Cancel
            </Button>
            <Button loading={test.isPending} onClick={runTest} disabled={!testTo.trim()}>
              <Send className="h-3.5 w-3.5" /> Send test via {testProvider}
            </Button>
          </>
        }
      >
        <p>
          Send a test email to <strong>{testTo || "…"}</strong> via{" "}
          <strong>{testProvider}</strong>?
        </p>
        <p className="mt-2 text-xs text-slate-soft">
          If the send succeeds, the provider is healthy. Results appear in
          server logs.
        </p>
      </Modal>
    </div>
  );
}

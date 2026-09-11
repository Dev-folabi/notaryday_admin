"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useCampaignMutations, useMarketingLeads } from "@/hooks/useMarketing";
import { fetchUsers } from "@/api/admin.api";
import { useToastStore } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type { EmailProvider, MarketingLead } from "@/types";

type TargetType = "LEAD" | "USER" | "EMAIL";

interface AdminUserLite {
  id: string;
  email: string;
  full_name?: string | null;
  username: string;
  plan: string;
}

export function ComposeModal({
  open,
  onClose,
  providers,
  presetLead,
}: {
  open: boolean;
  onClose: () => void;
  providers: EmailProvider[];
  presetLead?: MarketingLead | null;
}) {
  const toast = useToastStore((s) => s.push);
  const { sendDirect } = useCampaignMutations();

  const [tab, setTab] = useState<TargetType>(presetLead ? "LEAD" : "EMAIL");
  const [lead, setLead] = useState<MarketingLead | null>(presetLead ?? null);
  const [leadSearch, setLeadSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<AdminUserLite[] | null>(null);
  const [user, setUser] = useState<AdminUserLite | null>(null);
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [providerId, setProviderId] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");

  const activeProviders = providers.filter((p) => p.status === "ACTIVE");
  const effectiveProvider =
    providerId ||
    (activeProviders.find((p) => p.isDefault) ?? activeProviders[0])?._id ||
    "";

  const { data: leadResults, isLoading: leadsLoading } = useMarketingLeads({
    search: leadSearch || undefined,
    hasEmail: "true",
    limit: 5,
    page: 1,
  });

  const searchUsers = async (value: string) => {
    setUserSearch(value);
    if (value.trim().length < 2) {
      setUsers(null);
      return;
    }
    try {
      const res = await fetchUsers({ search: value.trim(), limit: 5 });
      setUsers(res.data);
    } catch {
      setUsers([]);
    }
  };

  const canSend =
    !!subject.trim() &&
    !!body.trim() &&
    !!effectiveProvider &&
    (tab === "LEAD" ? !!lead : tab === "USER" ? !!user : !!email.trim());

  const submit = () => {
    sendDirect.mutate(
      {
        targetType: tab,
        leadId: tab === "LEAD" ? lead?._id : undefined,
        userId: tab === "USER" ? user?.id : undefined,
        email: tab === "EMAIL" ? email.trim() : undefined,
        subject: subject.trim(),
        body,
        providerId: effectiveProvider,
        scheduleAt: scheduleAt ? new Date(scheduleAt).toISOString() : undefined,
      },
      {
        onSuccess: (result) => {
          toast(
            `Queued to ${result.email} via ${result.provider}${result.sendAt ? ` for ${new Date(result.sendAt).toLocaleString()}` : ""}`,
            "success"
          );
          onClose();
          setSubject("");
          setBody("");
          setScheduleAt("");
        },
        onError: (error) =>
          toast((error as { message?: string })?.message ?? "Send failed", "error"),
      }
    );
  };

  const tabButton = (value: TargetType, label: string) => (
    <button
      onClick={() => setTab(value)}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        tab === value
          ? "bg-admin-indigo text-white"
          : "text-slate-soft hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Compose direct email"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={sendDirect.isPending} disabled={!canSend} onClick={submit}>
            <Send className="h-3.5 w-3.5" /> Send
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex gap-1 rounded-lg bg-slate-50 p-1">
          {tabButton("LEAD", "CRM lead")}
          {tabButton("USER", "Platform user")}
          {tabButton("EMAIL", "Raw email")}
        </div>

        {tab === "LEAD" && (
          <div className="flex flex-col gap-2">
            {lead ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-slate-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">
                    {lead.businessName}
                  </p>
                  <p className="truncate text-xs text-slate-soft">{lead.email}</p>
                </div>
                <button
                  className="text-xs text-admin-indigo hover:underline"
                  onClick={() => setLead(null)}
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Search leads by business or email…"
                  defaultValue={leadSearch}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      setLeadSearch((e.target as HTMLInputElement).value);
                  }}
                />
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                  {leadsLoading ? (
                    <p className="p-3 text-xs text-slate-soft">Searching…</p>
                  ) : (leadResults?.data ?? []).length === 0 ? (
                    <p className="p-3 text-xs text-slate-soft">
                      No leads with email found.
                    </p>
                  ) : (
                    (leadResults?.data ?? []).map((l) => (
                      <button
                        key={l._id}
                        className="block w-full border-b border-border/50 px-3 py-2 text-left last:border-0 hover:bg-slate-50"
                        onClick={() => setLead(l)}
                      >
                        <span className="block truncate text-sm font-medium text-navy">
                          {l.businessName}
                        </span>
                        <span className="block truncate text-xs text-slate-soft">
                          {l.email}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {tab === "USER" && (
          <div className="flex flex-col gap-2">
            {user ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-slate-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">
                    {user.full_name || user.username}
                  </p>
                  <p className="truncate text-xs text-slate-soft">
                    {user.email} · {user.plan}
                  </p>
                </div>
                <button
                  className="text-xs text-admin-indigo hover:underline"
                  onClick={() => setUser(null)}
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Search platform users by email or name…"
                  defaultValue={userSearch}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void searchUsers((e.target as HTMLInputElement).value);
                  }}
                />
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                  {users === null ? (
                    <p className="p-3 text-xs text-slate-soft">
                      Type at least 2 characters and press Enter.
                    </p>
                  ) : users.length === 0 ? (
                    <p className="p-3 text-xs text-slate-soft">No users found.</p>
                  ) : (
                    users.map((u) => (
                      <button
                        key={u.id}
                        className="block w-full border-b border-border/50 px-3 py-2 text-left last:border-0 hover:bg-slate-50"
                        onClick={() => setUser(u)}
                      >
                        <span className="block truncate text-sm font-medium text-navy">
                          {u.full_name || u.username}
                        </span>
                        <span className="block truncate text-xs text-slate-soft">
                          {u.email} · {u.plan}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {tab === "EMAIL" && (
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="someone@example.com"
          />
        )}

        <Input
          label="Subject *"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Quick question about your booking page"
        />
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-body">
            Body *
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={7}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm leading-relaxed focus:border-admin-indigo focus:ring-2 focus:ring-indigo-100"
            placeholder="Write the email… an unsubscribe footer and tracking are added automatically."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Provider"
            value={effectiveProvider}
            onChange={(e) => setProviderId(e.target.value)}
          >
            {activeProviders.length === 0 && <option value="">No active providers</option>}
            {activeProviders.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.type})
              </option>
            ))}
          </Select>
          <Input
            label="Schedule (optional)"
            type="datetime-local"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
          />
        </div>
        <p className="text-[11px] text-slate-soft">
          Direct emails go through the tracked pipeline: open pixel, click
          tracking and one-click unsubscribe are applied, and the send appears
          in campaign monitoring as a DIRECT campaign.
        </p>
      </div>
    </Modal>
  );
}

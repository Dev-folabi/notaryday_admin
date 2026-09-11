"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Mail,
  MessageSquare,
  Ban,
  Pencil,
  Send,
  History,
} from "lucide-react";
import {
  useLeadTimeline,
  useMarketingLead,
  useLeadMutations,
  useMarketingProviders,
} from "@/hooks/useMarketing";
import { ComposeModal } from "@/components/marketing/ComposeModal";
import { useToastStore } from "@/components/ui/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, titleCase } from "@/lib/utils";
import type { LeadMessage, MarketingLead } from "@/types";

function tierTone(tier?: string | null): "teal" | "blue" | "amber" | "slate" {
  switch (tier) {
    case "A_PLUS":
      return "teal";
    case "A":
      return "blue";
    case "B":
      return "amber";
    default:
      return "slate";
  }
}

const STEP_TITLES = [
  "Email 1 · Day 1 — opener",
  "Email 2 · Day 3",
  "Email 3 · Day 5 — story",
  "Email 4 · Day 7",
  "Email 5 · Day 9 — objection",
  "Email 6 · Day 11 — cost",
  "Email 7 · Day 13",
  "Email 8 · Day 15 — social proof",
  "Email 9 · Day 17 — last note",
  "DM message (social / phone track)",
];

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex gap-2 py-1.5 text-sm">
      <span className="w-44 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-soft">
        {label}
      </span>
      <span className="min-w-0 flex-1 break-words text-slate-body">
        {value || "—"}
      </span>
    </div>
  );
}

function profileFromLead(lead: MarketingLead): Record<string, string> {
  return {
    businessName: lead.businessName ?? "",
    leadId: lead.leadId ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    professionalName: lead.professionalName ?? "",
    website: lead.website ?? "",
    address: lead.address ?? "",
    city: lead.city ?? "",
    state: lead.state ?? "",
    fitTier: lead.fitTier ?? "",
    abGroup: lead.abGroup ?? "",
    campaignWave: lead.campaignWave ?? "",
    recommendedChannel: lead.recommendedChannel ?? "",
    bestAngle: lead.bestAngle ?? "",
    personalizationHook: lead.personalizationHook ?? "",
    qualificationEvidence: lead.qualificationEvidence ?? "",
    verificationStatus: lead.verificationStatus ?? "",
    notes: lead.notes ?? "",
  };
}

interface MessageDraft {
  subject: string;
  body: string;
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToastStore((s) => s.push);
  const { data, isLoading, isError } = useMarketingLead(id);
  const { data: timeline } = useLeadTimeline(id);
  const { data: providers } = useMarketingProviders();
  const { update, updateMessage, remove } = useLeadMutations();
  const [composeOpen, setComposeOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [profile, setProfile] = useState<Record<string, string>>({});
  // Draft overrides per step, merged over the server copy (avoids state sync effects)
  const [drafts, setDrafts] = useState<Record<number, MessageDraft>>({});
  const [openStep, setOpenStep] = useState<number | null>(null);

  if (isLoading) return <Spinner />;
  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/marketing/leads" className="text-sm text-admin-indigo hover:underline">
          ← Back to leads
        </Link>
        <p className="py-8 text-center text-sm text-red">Failed to load lead.</p>
      </div>
    );
  }

  const lead = data.lead;
  const byStep = new Map<number, LeadMessage>(data.messages.map((m) => [m.step, m]));

  const messageAt = (step: number) => {
    const server = byStep.get(step);
    const draft = drafts[step];
    return {
      step,
      kind: (step === 10 ? "DM" : "EMAIL") as "DM" | "EMAIL",
      subject: draft?.subject ?? server?.subject ?? "",
      body: draft?.body ?? server?.body ?? "",
      dayOffset: server?.dayOffset ?? (step === 10 ? null : step * 2 - 1),
      edited: server?.edited ?? false,
      exists: !!server,
      dirty: !!draft,
    };
  };
  const messages = Array.from({ length: 10 }, (_, i) => messageAt(i + 1));
  const dirtyCount = Object.keys(drafts).length;

  const setDraft = (step: number, patch: Partial<MessageDraft>) => {
    setDrafts((prev) => {
      const current = prev[step] ?? {
        subject: messageAt(step).subject,
        body: messageAt(step).body,
      };
      return { ...prev, [step]: { ...current, ...patch } };
    });
  };

  const saveMessage = (step: number) => {
    const msg = messageAt(step);
    const payload: { subject?: string; body?: string } = { body: msg.body };
    if (msg.kind === "EMAIL") payload.subject = msg.subject;
    updateMessage.mutate(
      { leadId: id, step, data: payload, force: msg.edited },
      {
        onSuccess: () => {
          toast(`Step ${step} message saved`, "success");
          setDrafts((prev) => {
            const next = { ...prev };
            delete next[step];
            return next;
          });
        },
        onError: (error) => {
          const message = (error as { message?: string })?.message ?? "Save failed";
          toast(message, "error");
        },
      }
    );
  };

  const openEdit = () => {
    setProfile(profileFromLead(lead));
    setEditOpen(true);
  };

  const saveProfile = () => {
    const payload: Record<string, unknown> = {};
    const textFields = [
      "businessName",
      "leadId",
      "professionalName",
      "website",
      "address",
      "city",
      "bestAngle",
      "personalizationHook",
      "qualificationEvidence",
      "verificationStatus",
      "notes",
    ];
    for (const field of textFields) {
      const value = (profile[field] ?? "").trim();
      payload[field] = value === "" ? undefined : value;
    }
    for (const field of ["email", "phone"]) {
      const value = (profile[field] ?? "").trim();
      payload[field] = value === "" ? undefined : value;
    }
    if ((profile.state ?? "").trim()) payload.state = profile.state.trim().toUpperCase();
    else payload.state = undefined;
    if (profile.fitTier) payload.fitTier = profile.fitTier;
    if (profile.abGroup) payload.abGroup = profile.abGroup;
    if ((profile.campaignWave ?? "").trim()) payload.campaignWave = profile.campaignWave.trim();
    if ((profile.recommendedChannel ?? "").trim()) payload.recommendedChannel = profile.recommendedChannel.trim();

    update.mutate(
      { id, data: payload },
      {
        onSuccess: () => {
          toast("Lead updated", "success");
          setEditOpen(false);
        },
        onError: (error) => {
          const message = (error as { message?: string })?.message ?? "Update failed";
          toast(message, "error");
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/marketing/leads"
            className="mb-1 inline-flex items-center gap-1 text-sm text-admin-indigo hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to leads
          </Link>
          <h1 className="text-2xl font-bold text-navy">
            {lead.businessName ?? "Lead"}
          </h1>
          <p className="mt-1 text-sm text-slate-soft">
            {lead.leadId ?? "no lead ID"}
            {lead.email ? ` · ${lead.email}` : " · no email"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setComposeOpen(true)}
            disabled={!lead.email}
            title={lead.email ? "Send a direct email" : "Lead has no email"}
          >
            <Send className="h-3.5 w-3.5" /> Compose
          </Button>
          <Button variant="secondary" size="sm" onClick={openEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit lead
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (window.confirm("Delete this lead and all its messages?")) {
                remove.mutate(id, {
                  onSuccess: () => {
                    toast("Lead deleted", "success");
                    router.push("/marketing/leads");
                  },
                });
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {lead.fitTier && (
          <Badge tone={tierTone(lead.fitTier)}>
            Tier {lead.fitTier === "A_PLUS" ? "A+" : lead.fitTier}
            {typeof lead.prospectScore === "number" ? ` · ${lead.prospectScore}` : ""}
          </Badge>
        )}
        {lead.waveKey && <Badge tone="slate">{titleCase(lead.waveKey)}</Badge>}
        {lead.abGroup && <Badge tone="indigo">AB {lead.abGroup}</Badge>}
        <Badge tone={lead.status === "UNSUBSCRIBED" ? "red" : "blue"}>
          {titleCase(lead.status)}
        </Badge>
        {lead.excludeFromSend && <Badge tone="red">Excluded from send</Badge>}
        {data.suppression && (
          <Badge tone="red">
            <Ban className="h-3 w-3" /> Suppressed ({titleCase(data.suppression.type)})
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Contact" />
          <Row label="Business" value={lead.businessName} />
          <Row label="Contact name" value={lead.professionalName} />
          <Row label="Email" value={lead.email} />
          <Row label="Email verification" value={lead.emailVerification} />
          <Row label="Phone" value={lead.phone} />
          <Row label="Website" value={lead.website} />
          <Row label="Facebook" value={lead.facebookUrl} />
          <Row label="Instagram" value={lead.instagramUrl} />
        </Card>
        <Card>
          <CardHeader title="Location & campaign" />
          <Row label="Address" value={lead.address} />
          <Row label="City" value={lead.city} />
          <Row label="State" value={lead.state} />
          <Row label="Wave" value={lead.campaignWave ?? lead.waveKey} />
          <Row label="Channel" value={lead.recommendedChannel} />
          <Row label="Verification" value={lead.verificationStatus} />
          <Row label="Added" value={formatDateTime(lead.createdAt)} />
        </Card>
      </div>

      <Card>
        <CardHeader title="Outreach context" />
        <Row label="Best angle" value={lead.bestAngle} />
        <Row label="Personalization hook" value={lead.personalizationHook} />
        <Row label="Qualification evidence" value={lead.qualificationEvidence} />
        <Row label="Notes" value={lead.notes} />
        {lead.tags && lead.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {lead.tags.map((t) => (
              <Badge key={t} tone="slate">
                {t}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Engagement timeline"
          subtitle="Every recorded event for this lead (sends, opens, clicks, conversions)"
        />
        {!timeline || timeline.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-soft">
            No engagement recorded yet.
          </p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {timeline.map((event) => (
              <div
                key={event._id}
                className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2 text-xs"
              >
                <History className="h-3.5 w-3.5 shrink-0 text-slate-soft" />
                <span className="font-semibold text-navy">{event.type}</span>
                {event.source && (
                  <span className="text-slate-soft">via {event.source}</span>
                )}
                {typeof event.meta?.kind === "string" && (
                  <Badge tone="teal">{String(event.meta.kind)}</Badge>
                )}
                <span className="ml-auto text-slate-soft">
                  {formatDateTime(event.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Sequence messages"
          subtitle="9-email sequence (day 1–17) + DM message. Edits apply to future sends only."
          action={
            dirtyCount > 0 ? (
              <span className="text-xs font-medium text-amber">
                {dirtyCount} unsaved
              </span>
            ) : undefined
          }
        />
        {messages.every((m) => !m.exists && !m.body) ? (
          <EmptyState
            title="No messages for this lead"
            description="Messages are created on import; you can also write them manually below."
          />
        ) : (
          <div className="divide-y divide-border/60">
            {messages.map((m) => {
              const open = openStep === m.step;
              return (
                <div key={m.step}>
                  <button
                    className="flex w-full items-center gap-3 py-3 text-left"
                    onClick={() => setOpenStep(open ? null : m.step)}
                  >
                    {m.kind === "DM" ? (
                      <MessageSquare className="h-4 w-4 shrink-0 text-teal" />
                    ) : (
                      <Mail className="h-4 w-4 shrink-0 text-admin-indigo" />
                    )}
                    <span className="flex-1 text-sm font-medium text-navy">
                      {STEP_TITLES[m.step - 1]}
                    </span>
                    {m.edited && m.exists && <Badge tone="amber">Edited</Badge>}
                    {m.dirty && <Badge tone="red">Unsaved</Badge>}
                    <span className="hidden truncate text-xs text-slate-soft md:block md:max-w-64">
                      {m.subject || (m.body ? m.body.slice(0, 80) : "—")}
                    </span>
                  </button>
                  {open && (
                    <div className="pb-4">
                      <div className="flex flex-col gap-3">
                        {m.kind === "EMAIL" && (
                          <Input
                            label="Subject"
                            value={m.subject}
                            onChange={(e) => setDraft(m.step, { subject: e.target.value })}
                          />
                        )}
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-body">
                            Body
                          </label>
                          <textarea
                            value={m.body}
                            onChange={(e) => setDraft(m.step, { body: e.target.value })}
                            rows={10}
                            className="w-full rounded-lg border border-border px-3 py-2 text-sm leading-relaxed focus:border-admin-indigo focus:ring-2 focus:ring-indigo-100"
                            placeholder="Write the email body…"
                          />
                          <p className="mt-1 text-[11px] text-slate-soft">
                            {m.body.length} chars · send offset day {m.dayOffset ?? "—"}
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            disabled={!m.dirty}
                            loading={
                              updateMessage.isPending &&
                              updateMessage.variables?.step === m.step
                            }
                            onClick={() => saveMessage(m.step)}
                          >
                            <Save className="h-3.5 w-3.5" /> Save message
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Compose direct email */}
      <ComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        providers={providers ?? []}
        presetLead={lead}
      />

      {/* Edit lead modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit lead"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button loading={update.isPending} onClick={saveProfile}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="grid max-h-[70vh] grid-cols-2 gap-3 overflow-y-auto pr-1">
          <div className="col-span-2">
            <Input
              label="Business name"
              value={profile.businessName ?? ""}
              onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
            />
          </div>
          <Input
            label="Lead ID"
            value={profile.leadId ?? ""}
            onChange={(e) => setProfile({ ...profile, leadId: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={profile.email ?? ""}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
          <Input
            label="Phone"
            value={profile.phone ?? ""}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          />
          <Input
            label="Contact name"
            value={profile.professionalName ?? ""}
            onChange={(e) => setProfile({ ...profile, professionalName: e.target.value })}
          />
          <Input
            label="Website"
            value={profile.website ?? ""}
            onChange={(e) => setProfile({ ...profile, website: e.target.value })}
          />
          <Input
            label="City"
            value={profile.city ?? ""}
            onChange={(e) => setProfile({ ...profile, city: e.target.value })}
          />
          <Input
            label="State"
            maxLength={2}
            value={profile.state ?? ""}
            onChange={(e) => setProfile({ ...profile, state: e.target.value })}
          />
          <Input
            label="Address"
            value={profile.address ?? ""}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
          />
          <Select
            label="Fit tier"
            value={profile.fitTier ?? ""}
            onChange={(e) => setProfile({ ...profile, fitTier: e.target.value })}
          >
            <option value="">—</option>
            <option value="A_PLUS">A+ (highest intent)</option>
            <option value="A">A (strong LSA)</option>
            <option value="B">B (mobile notary)</option>
            <option value="C">C (verify LSA)</option>
          </Select>
          <Select
            label="AB group"
            value={profile.abGroup ?? ""}
            onChange={(e) => setProfile({ ...profile, abGroup: e.target.value })}
          >
            <option value="">—</option>
            <option value="A">A</option>
            <option value="B">B</option>
          </Select>
          <Input
            label="Campaign wave (raw)"
            value={profile.campaignWave ?? ""}
            onChange={(e) => setProfile({ ...profile, campaignWave: e.target.value })}
          />
          <Input
            label="Recommended channel"
            value={profile.recommendedChannel ?? ""}
            onChange={(e) => setProfile({ ...profile, recommendedChannel: e.target.value })}
          />
          <div className="col-span-2">
            <Input
              label="Best Notary Day angle"
              value={profile.bestAngle ?? ""}
              onChange={(e) => setProfile({ ...profile, bestAngle: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Personalization hook"
              value={profile.personalizationHook ?? ""}
              onChange={(e) => setProfile({ ...profile, personalizationHook: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-body">
              Notes
            </label>
            <textarea
              value={profile.notes ?? ""}
              onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-admin-indigo focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

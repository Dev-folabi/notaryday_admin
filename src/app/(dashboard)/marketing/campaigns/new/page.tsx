"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Search, Users, X } from "lucide-react";
import {
  useCampaignMutations,
  useMarketingLeads,
  useMarketingProviders,
  usePlaybooks,
} from "@/hooks/useMarketing";
import { useToastStore } from "@/components/ui/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  TEMPLATE_VARIABLES,
  type CampaignType,
  type MarketingLead,
} from "@/types";

const WAVE_OPTIONS = [
  { value: "", label: "Any wave" },
  { value: "WAVE_1", label: "Wave 1 (A+/A — first)" },
  { value: "WAVE_2", label: "Wave 2 (B)" },
  { value: "WAVE_3", label: "Wave 3 (C — verify first)" },
  { value: "SOCIAL_PHONE", label: "Social/phone track" },
];

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function WizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToastStore((s) => s.push);
  const { data: providers } = useMarketingProviders();
  const { create, schedule, preview } = useCampaignMutations();

  const preselected = useMemo(
    () =>
      (searchParams.get("leadIds") ?? "")
        .split(",")
        .filter(Boolean),
    [searchParams]
  );

  const waveParam = searchParams.get("wave") ?? "";

  const { data: playbooks } = usePlaybooks();

  const [name, setName] = useState("");
  const [type, setType] = useState<CampaignType>("ONE_OFF");
  const [providerId, setProviderId] = useState("");

  // Audience
  const [audienceMode, setAudienceMode] = useState<"FILTER" | "IDS" | "USERS">(
    preselected.length > 0 ? "IDS" : "FILTER"
  );
  const [fTier, setFTier] = useState("");
  const [fWave, setFWave] = useState(waveParam);
  const [fState, setFState] = useState("");
  const [fAb, setFAb] = useState("");
  const [fChannel, setFChannel] = useState("");
  const [uPlan, setUPlan] = useState("FREE");
  const [uInactiveDays, setUInactiveDays] = useState("");
  const [uOnboarding, setUOnboarding] = useState("");
  const [pickedLeads, setPickedLeads] = useState<MarketingLead[]>(
    []
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerSelection, setPickerSelection] = useState<Set<string>>(
    new Set(preselected)
  );

  // Content
  const [contentMode, setContentMode] = useState<"LEAD_DRAFTS" | "TEMPLATE">(
    "LEAD_DRAFTS"
  );
  const [step, setStep] = useState(1);
  const [steps, setSteps] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Schedule
  const [startAt, setStartAt] = useState(toLocalInputValue(new Date()));
  const [perMinute, setPerMinute] = useState(15);
  const [smartSendTimes, setSmartSendTimes] = useState(false);
  const [stopOnReply, setStopOnReply] = useState(true);

  const activeProviders = (providers ?? []).filter((p) => p.status === "ACTIVE");
  const effectiveProviderId =
    providerId ||
    (activeProviders.find((p) => p.isDefault) ?? activeProviders[0])?._id ||
    "";

  const audiencePayload = useMemo(() => {
    if (audienceMode === "IDS") {
      return {
        mode: "IDS" as const,
        leadIds: [...pickerSelection],
      };
    }
    if (audienceMode === "USERS") {
      return {
        mode: "USERS" as const,
        userFilters: {
          plan: uPlan || undefined,
          inactiveDays: uInactiveDays ? Number(uInactiveDays) : undefined,
          onboardingCompleted:
            uOnboarding === "" ? undefined : uOnboarding === "true",
        },
      };
    }
    const filters: Record<string, string | string[]> = {};
    if (fTier) filters.tier = fTier;
    if (fWave) filters.wave = fWave;
    if (fState.trim()) filters.state = fState.trim().toUpperCase();
    if (fAb) filters.abGroup = fAb;
    if (fChannel) filters.channel = fChannel;
    return { mode: "FILTER" as const, filters };
  }, [audienceMode, pickerSelection, fTier, fWave, fState, fAb, fChannel, uPlan, uInactiveDays, uOnboarding]);

  const contentPayload = useMemo(() => {
    if (contentMode === "TEMPLATE") {
      return { mode: "TEMPLATE" as const, subject, body };
    }
    return type === "SEQUENCE"
      ? { mode: "LEAD_DRAFTS" as const, steps }
      : { mode: "LEAD_DRAFTS" as const, step };
  }, [contentMode, subject, body, type, steps, step]);

  const { data: pickerData, isLoading: pickerLoading } = useMarketingLeads({
    search: pickerSearch || undefined,
    hasEmail: "true",
    page: pickerPage,
    limit: 10,
  });

  const runPreview = () => {
    preview.mutate(
      { type, audience: audiencePayload as never, content: contentPayload as never },
      {
        onError: (error) =>
          toast(
            (error as { message?: string })?.message ?? "Preview failed",
            "error"
          ),
      }
    );
  };

  const submit = () => {
    if (!name.trim()) return toast("Campaign name is required", "error");
    if (!effectiveProviderId)
      return toast("Select an email provider (add one first if none)", "error");
    if (contentMode === "TEMPLATE" && (!subject.trim() || !body.trim()))
      return toast("Template content needs a subject and body", "error");
    if (audienceMode === "IDS" && pickerSelection.size === 0)
      return toast("Pick at least one lead", "error");
    if (type === "SEQUENCE" && steps.length === 0)
      return toast("Select at least one sequence step", "error");
    if (audienceMode === "USERS" && contentMode !== "TEMPLATE")
      return toast(
        "Platform-user campaigns use TEMPLATE content (no lead drafts)",
        "error"
      );

    create.mutate(
      {
        name: name.trim(),
        type,
        providerId: effectiveProviderId,
        audience: audiencePayload,
        content: contentPayload,
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
        perMinute,
        smartSendTimes,
        stopOnReply,
      },
      {
        onSuccess: (campaign) => {
          schedule.mutate(
            {
              id: campaign._id,
              startAt: startAt ? new Date(startAt).toISOString() : undefined,
            },
            {
              onSuccess: () => {
                toast("Campaign scheduled — dispatching now", "success");
                router.push(`/marketing/campaigns/${campaign._id}`);
              },
              onError: (error) => {
                toast(
                  (error as { message?: string })?.message ??
                    "Created but scheduling failed — open the campaign to schedule it",
                  "error"
                );
                router.push(`/marketing/campaigns/${campaign._id}`);
              },
            }
          );
        },
        onError: (error) =>
          toast((error as { message?: string })?.message ?? "Create failed", "error"),
      }
    );
  };

  const toggleStep = (n: number) => {
    setSteps((prev) =>
      prev.includes(n) ? prev.filter((s) => s !== n) : [...prev, n].sort((a, b) => a - b)
    );
  };

  const insertVariable = (v: string) => {
    setBody((prev) => `${prev}{{${v}}}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">New campaign</h1>
        <p className="mt-1 text-sm text-slate-soft">
          Choose an audience, content, provider and pacing. Sends run in the
          marketing worker with unsubscribe + tracking applied automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="flex flex-col gap-4 xl:col-span-2">
          {/* Basics */}
          <Card>
            <CardHeader title="Basics" />
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input
                  label="Campaign name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Wave 1 — full sequence"
                />
              </div>
              <Select
                label="Type"
                value={type}
                disabled={audienceMode === "USERS"}
                onChange={(e) => setType(e.target.value as CampaignType)}
              >
                <option value="ONE_OFF">One-off send (single email)</option>
                <option value="SEQUENCE" disabled={audienceMode === "USERS"}>
                  Sequence (9-email drip)
                </option>
              </Select>
              <Select
                label="Email provider *"
                value={effectiveProviderId}
                onChange={(e) => setProviderId(e.target.value)}
              >
                {activeProviders.length === 0 && <option value="">No active providers</option>}
                {activeProviders.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.type}) — {p.perMinuteLimit}/min, {p.dailyLimit}/day
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Audience */}
          <Card>
            <CardHeader
              title="Audience"
              subtitle={
                type === "SEQUENCE"
                  ? "Sequence leads are usually selected per wave (e.g. Wave 1 = A+/A tier)"
                  : "Filter the lead base or pick specific leads"
              }
            />
            <div className="mb-3 flex flex-wrap gap-2">
              <Button
                variant={audienceMode === "FILTER" ? "primary" : "secondary"}
                size="sm"
                onClick={() => setAudienceMode("FILTER")}
              >
                Lead filters
              </Button>
              <Button
                variant={audienceMode === "IDS" ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  setAudienceMode("IDS");
                  setPickerOpen(true);
                }}
              >
                <Users className="h-3.5 w-3.5" /> Pick leads ({pickerSelection.size})
              </Button>
              <Button
                variant={audienceMode === "USERS" ? "primary" : "secondary"}
                size="sm"
                title="Re-engagement emails to existing platform users"
                onClick={() => {
                  setAudienceMode("USERS");
                  setType("ONE_OFF");
                  setContentMode("TEMPLATE");
                }}
              >
                Platform users
              </Button>
            </div>

            {audienceMode === "USERS" ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-soft">
                  Re-engagement campaigns email existing platform users
                  (resolved from Postgres when scheduled, one-off template
                  sends). Suppressed users are excluded automatically.
                </p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  <Select label="Plan" value={uPlan} onChange={(e) => setUPlan(e.target.value)}>
                    <option value="FREE">Free</option>
                    <option value="PRO">Pro</option>
                    <option value="PRO_ANNUAL">Pro Annual</option>
                    <option value="">Any plan</option>
                  </Select>
                  <Input
                    label="Inactive ≥ days"
                    type="number"
                    min={1}
                    value={uInactiveDays}
                    onChange={(e) => setUInactiveDays(e.target.value)}
                    placeholder="30"
                  />
                  <Select
                    label="Onboarding"
                    value={uOnboarding}
                    onChange={(e) => setUOnboarding(e.target.value)}
                  >
                    <option value="">Any</option>
                    <option value="true">Completed</option>
                    <option value="false">Not completed</option>
                  </Select>
                </div>
              </div>
            ) : audienceMode === "FILTER" ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <Select label="Fit tier" value={fTier} onChange={(e) => setFTier(e.target.value)}>
                  <option value="">Any tier</option>
                  <option value="A_PLUS">A+</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </Select>
                <Select label="Campaign wave" value={fWave} onChange={(e) => setFWave(e.target.value)}>
                  {WAVE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <Input
                  label="State (2-letter)"
                  maxLength={2}
                  value={fState}
                  onChange={(e) => setFState(e.target.value)}
                  placeholder="TX"
                />
                <Select label="AB group" value={fAb} onChange={(e) => setFAb(e.target.value)}>
                  <option value="">Any</option>
                  <option value="A">Group A</option>
                  <option value="B">Group B</option>
                </Select>
                <Select
                  label="Channel"
                  value={fChannel}
                  onChange={(e) => setFChannel(e.target.value)}
                >
                  <option value="">Any</option>
                  <option value="Email">Email</option>
                  <option value="Instagram DM">Instagram DM</option>
                  <option value="Facebook message">Facebook message</option>
                  <option value="Phone/website">Phone/website</option>
                </Select>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pickedLeads.length === 0 && pickerSelection.size === 0 ? (
                  <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
                    Open lead picker
                  </Button>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {[...pickerSelection].map((id) => {
                      const lead = pickedLeads.find((l) => l._id === id);
                      return (
                        <Badge key={id} tone="slate">
                          {lead ? lead.businessName : id.slice(-6)}
                          <button
                            className="ml-1 text-slate-soft hover:text-red"
                            onClick={() =>
                              setPickerSelection((prev) => {
                                const next = new Set(prev);
                                next.delete(id);
                                return next;
                              })
                            }
                            aria-label="Remove"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                    <Button variant="ghost" size="sm" onClick={() => setPickerOpen(true)}>
                      Add more…
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Content */}
          <Card>
            <CardHeader
              title="Content"
              subtitle={
                type === "SEQUENCE"
                  ? "Sequences send each lead's own personalized drafts"
                  : "Use the per-lead drafts from the import, or write a template"
              }
            />
            {playbooks && playbooks.length > 0 && (
              <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-soft">
                  Outreach playbook — pick an angle
                </p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {playbooks.map((p) => (
                    <button
                      key={p._id}
                      className="rounded-lg border border-border bg-white p-2.5 text-left transition-colors hover:border-admin-indigo"
                      onClick={() => {
                        setSubject(p.signal);
                        setBody(
                          `${p.angle}\n\n${p.cta}.\n\nTry it free: https://www.notaryday.app`
                        );
                        setContentMode("TEMPLATE");
                        setType("ONE_OFF");
                      }}
                    >
                      <p className="text-xs font-semibold text-navy">
                        {p.signal}
                      </p>
                      <p className="mt-1 text-[11px] leading-snug text-slate-soft">
                        {p.angle}
                      </p>
                      <p className="mt-1 text-[11px] italic text-admin-indigo">
                        CTA: {p.cta}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {type === "SEQUENCE" ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-soft">
                  Sends each selected lead&apos;s own 9-email drafts (day 1→17,
                  3/week). Edits made on a lead apply to unsent steps.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <button
                      key={n}
                      onClick={() => toggleStep(n)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        steps.includes(n)
                          ? "border-admin-indigo bg-indigo-50 text-admin-indigo"
                          : "border-border text-slate-soft hover:border-slate-300"
                      }`}
                    >
                      Step {n}
                      <span className="ml-1 text-[10px] text-slate-soft">
                        d{n * 2 - 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <Button
                    variant={contentMode === "LEAD_DRAFTS" ? "primary" : "secondary"}
                    size="sm"
                    disabled={audienceMode === "USERS"}
                    title={
                      audienceMode === "USERS"
                        ? "Platform users have no lead drafts — use a template"
                        : undefined
                    }
                    onClick={() => setContentMode("LEAD_DRAFTS")}
                  >
                    Lead drafts
                  </Button>
                  <Button
                    variant={contentMode === "TEMPLATE" ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setContentMode("TEMPLATE")}
                  >
                    Template
                  </Button>
                </div>
                {contentMode === "LEAD_DRAFTS" ? (
                  <Select
                    label="Which sequence email to send"
                    value={String(step)}
                    onChange={(e) => setStep(Number(e.target.value))}
                    className="w-64"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <option key={n} value={n}>
                        Email {n} (day {n * 2 - 1})
                      </option>
                    ))}
                  </Select>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Input
                      label="Subject *"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Quick question, {{first_name}}"
                    />
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-body">
                        Body *
                      </label>
                      <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={8}
                        className="w-full rounded-lg border border-border px-3 py-2 text-sm leading-relaxed focus:border-admin-indigo focus:ring-2 focus:ring-indigo-100"
                        placeholder={"Hi {{first_name}},\n\nI looked at {{business_name}}…"}
                      />
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="text-[11px] text-slate-soft">
                          Insert variable:
                        </span>
                        {TEMPLATE_VARIABLES.map((v) => (
                          <button
                            key={v}
                            onClick={() => insertVariable(v)}
                            className="rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-slate-soft hover:border-admin-indigo hover:text-admin-indigo"
                          >
                            {`{{${v}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Schedule & pacing */}
          <Card>
            <CardHeader
              title="Schedule & pacing"
              subtitle="Batched sends are spread at the per-minute rate; single emails go immediately."
            />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="col-span-2">
                <Input
                  label="Start at"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </div>
              <Input
                label="Sends per minute"
                type="number"
                min={1}
                value={perMinute}
                onChange={(e) => setPerMinute(Number(e.target.value) || 15)}
              />
              <div className="flex flex-col justify-end gap-2 pb-1">
                <label className="flex items-center gap-2 text-xs text-slate-body">
                  <input
                    type="checkbox"
                    checked={smartSendTimes}
                    onChange={(e) => setSmartSendTimes(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Local 8–11 AM delivery
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-body">
                  <input
                    type="checkbox"
                    checked={stopOnReply}
                    onChange={(e) => setStopOnReply(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Stop when lead replies
                </label>
              </div>
            </div>
          </Card>
        </div>

        {/* Review sidebar */}
        <div className="xl:col-span-1">
          <Card className="xl:sticky xl:top-6">
            <CardHeader
              title="Review"
              subtitle="Verify the audience before scheduling"
            />
            <Button
              variant="secondary"
              size="sm"
              loading={preview.isPending}
              onClick={runPreview}
              className="mb-3 w-full"
            >
              Preview audience
            </Button>

            {preview.data ? (
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-soft">Sendable leads</span>
                  <span className="text-2xl font-bold text-teal">
                    {preview.data.sendable}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-soft">
                  <div className="flex justify-between">
                    <span>Matched</span>
                    <span>{preview.data.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>No email</span>
                    <span>{preview.data.noEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Excluded</span>
                    <span>{preview.data.excluded}</span>
                  </div>
                  <div className="flex justify-between text-red">
                    <span>Suppressed (unsub/bounce)</span>
                    <span>{preview.data.suppressed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>No draft</span>
                    <span>{preview.data.noDraft}</span>
                  </div>
                </div>
                {preview.data.sample.length > 0 && (
                  <div className="text-xs">
                    <p className="mb-1 font-semibold uppercase tracking-wide text-slate-soft">
                      Sample
                    </p>
                    {preview.data.sample.map((s) => (
                      <p key={s._id} className="truncate text-slate-body">
                        {s.businessName ?? s.email}
                        <span className="text-slate-soft"> · {s.state ?? "—"}</span>
                      </p>
                    ))}
                  </div>
                )}
                {type === "SEQUENCE" && preview.data.sendable > 0 && (
                  <p className="text-xs text-slate-soft">
                    ≈ {preview.data.sendable * steps.length} total emails over{" "}
                    {steps.length} step{steps.length > 1 ? "s" : ""} (day{" "}
                    {[...steps].sort((a, b) => a - b).map((s) => s * 2 - 1).join(", ")}
                    ).
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-soft">
                Run the preview to see how many leads will receive this
                campaign. Suppressed (unsubscribed/bounced) leads are always
                excluded.
              </p>
            )}

            <Button
              className="mt-4 w-full"
              loading={create.isPending || schedule.isPending}
              onClick={submit}
            >
              Create & schedule
            </Button>
          </Card>
        </div>
      </div>

      {/* Lead picker modal */}
      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={`Pick leads (${pickerSelection.size} selected)`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPickerOpen(false)}>
              Done
            </Button>
            <Button
              onClick={() => {
                // remember names for the chips
                setPickedLeads((prev) => {
                  const map = new Map(prev.map((l) => [l._id, l]));
                  (pickerData?.data ?? []).forEach((l) => map.set(l._id, l));
                  return [...map.values()].filter((l) => pickerSelection.has(l._id));
                });
                setPickerOpen(false);
              }}
            >
              Confirm selection
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-soft" />
            <Input
              className="pl-9"
              placeholder="Search business or email…"
              defaultValue={pickerSearch}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPickerSearch((e.target as HTMLInputElement).value);
                  setPickerPage(1);
                }
              }}
            />
          </div>
          {pickerLoading ? (
            <Spinner />
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
              {(pickerData?.data ?? []).map((lead) => {
                const checked = pickerSelection.has(lead._id);
                return (
                  <label
                    key={lead._id}
                    className="flex cursor-pointer items-center gap-3 border-b border-border/50 px-3 py-2 last:border-0 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setPickerSelection((prev) => {
                          const next = new Set(prev);
                          if (next.has(lead._id)) next.delete(lead._id);
                          else next.add(lead._id);
                          return next;
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-navy">
                        {lead.businessName}
                      </span>
                      <span className="block truncate text-xs text-slate-soft">
                        {lead.email} · {lead.state ?? "—"} ·{" "}
                        {lead.fitTier ?? "—"}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          {pickerData?.meta && (
            <div className="flex items-center justify-between text-xs text-slate-soft">
              <span>
                Page {pickerData.meta.page} of {pickerData.meta.totalPages} ·{" "}
                {pickerData.meta.total} with email
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pickerPage <= 1}
                  onClick={() => setPickerPage((p) => p - 1)}
                >
                  Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pickerPage >= (pickerData?.meta.totalPages ?? 1)}
                  onClick={() => setPickerPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function NewCampaignPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <WizardInner />
    </Suspense>
  );
}

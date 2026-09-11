"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Upload, Tag, ShieldAlert, Trash2, CircleCheck, CircleSlash, Send, Download } from "lucide-react";
import { useMarketingLeads, useLeadMutations } from "@/hooks/useMarketing";
import { downloadCsv } from "@/api/marketing.api";
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
import { formatDate, titleCase } from "@/lib/utils";

const TIER_LABELS: Record<string, string> = {
  A_PLUS: "A+",
  A: "A",
  B: "B",
  C: "C",
};

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

function statusTone(status?: string): "teal" | "blue" | "amber" | "red" | "slate" | "indigo" {
  switch (status) {
    case "NEW":
      return "blue";
    case "IN_SEQUENCE":
    case "CONTACTED":
      return "indigo";
    case "REPLIED":
    case "CONVERTED":
      return "teal";
    case "UNSUBSCRIBED":
    case "BOUNCED":
      return "red";
    case "NEEDS_VERIFICATION":
    case "EXCLUDED":
      return "amber";
    default:
      return "slate";
  }
}

const WAVE_OPTIONS = [
  { value: "", label: "All waves" },
  { value: "WAVE_1", label: "Wave 1 (A+/A)" },
  { value: "WAVE_2", label: "Wave 2 (B)" },
  { value: "WAVE_3", label: "Wave 3 (C)" },
  { value: "SOCIAL_PHONE", label: "Social/phone" },
  { value: "EXCLUDED", label: "Excluded" },
];

const STATUS_OPTIONS = [
  "NEW",
  "NEEDS_VERIFICATION",
  "IN_SEQUENCE",
  "CONTACTED",
  "REPLIED",
  "CONVERTED",
  "UNSUBSCRIBED",
  "BOUNCED",
  "EXCLUDED",
].map((s) => ({ value: s, label: titleCase(s) }));

interface LeadFormState {
  businessName: string;
  leadId: string;
  email: string;
  phone: string;
  professionalName: string;
  website: string;
  city: string;
  state: string;
  fitTier: string;
  recommendedChannel: string;
  notes: string;
}

const EMPTY_LEAD_FORM: LeadFormState = {
  businessName: "",
  leadId: "",
  email: "",
  phone: "",
  professionalName: "",
  website: "",
  city: "",
  state: "",
  fitTier: "",
  recommendedChannel: "Email",
  notes: "",
};

export default function MarketingLeadsPage() {
  const router = useRouter();
  const toast = useToastStore((s) => s.push);
  const { bulk, create } = useLeadMutations();

  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("");
  const [wave, setWave] = useState("");
  const [abGroup, setAbGroup] = useState("");
  const [status, setStatus] = useState("");
  const [hasEmail, setHasEmail] = useState("");
  const [excluded, setExcluded] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<LeadFormState>(EMPTY_LEAD_FORM);
  const [tagModal, setTagModal] = useState(false);
  const [tagValue, setTagValue] = useState("");
  const [statusModal, setStatusModal] = useState(false);
  const [statusValue, setStatusValue] = useState("NEW");

  const params = {
    search: search || undefined,
    tier: tier || undefined,
    wave: wave || undefined,
    abGroup: abGroup || undefined,
    status: status || undefined,
    hasEmail: hasEmail || undefined,
    excluded: excluded || undefined,
    sort,
    page,
    limit: 25,
  };
  const { data, isLoading, isError } = useMarketingLeads(params);

  const leads = useMemo(() => data?.data ?? [], [data]);
  const pageIds = useMemo(() => leads.map((l) => l._id), [leads]);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBulk = async (action: string, value?: string) => {
    if (selected.size === 0) return;
    bulk.mutate(
      { ids: [...selected], action, value },
      {
        onSuccess: (result) => {
          toast(`Bulk ${action}: ${result.affected} lead(s) updated`, "success");
          if (action === "delete") setSelected(new Set());
        },
        onError: (error) => {
          const message =
            (error as { message?: string })?.message ?? "Bulk action failed";
          toast(message, "error");
        },
      }
    );
    setTagModal(false);
    setStatusModal(false);
  };

  const submitCreate = () => {
    if (!form.businessName.trim()) {
      toast("Business name is required", "error");
      return;
    }
    const payload: Record<string, unknown> = { recommendedChannel: form.recommendedChannel || undefined };
    if (form.leadId) payload.leadId = form.leadId.trim();
    if (form.businessName.trim()) payload.businessName = form.businessName.trim();
    if (form.email.trim()) payload.email = form.email.trim().toLowerCase();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.professionalName.trim()) payload.professionalName = form.professionalName.trim();
    if (form.website.trim()) payload.website = form.website.trim();
    if (form.city.trim()) payload.city = form.city.trim();
    if (form.state.trim()) payload.state = form.state.trim().toUpperCase();
    if (form.fitTier) payload.fitTier = form.fitTier;
    if (form.notes.trim()) payload.notes = form.notes.trim();

    create.mutate(payload, {
      onSuccess: () => {
        toast("Lead created", "success");
        setShowCreateModal(false);
        setForm(EMPTY_LEAD_FORM);
      },
      onError: (error) => {
        const message = (error as { message?: string })?.message ?? "Failed to create lead";
        toast(message, "error");
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Leads</h1>
          <p className="mt-1 text-sm text-slate-soft">
            Import, review, and manage campaign prospects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              downloadCsv(
                `/marketing/leads/export?${new URLSearchParams({
                  ...(tier ? { tier } : {}),
                  ...(wave ? { wave } : {}),
                  ...(abGroup ? { abGroup } : {}),
                  ...(status ? { status } : {}),
                }).toString()}`,
                "notaryday-leads.csv"
              )
            }
            title="Export the current filter as CSV"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button variant="secondary" size="sm" onClick={() => router.push("/marketing/imports")}>
            <Upload className="h-3.5 w-3.5" /> Import file
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-3.5 w-3.5" /> Add lead
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:flex-wrap">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-soft" />
            <Input
              className="pl-9"
              placeholder="Search business, email, lead ID…"
              defaultValue={search}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch((e.target as HTMLInputElement).value);
                  setPage(1);
                }
              }}
              onBlur={(e) => {
                if (e.target.value !== search) {
                  setSearch(e.target.value);
                  setPage(1);
                }
              }}
            />
          </div>
          <Select
            value={tier}
            onChange={(e) => {
              setTier(e.target.value);
              setPage(1);
            }}
            className="xl:w-36"
          >
            <option value="">All tiers</option>
            <option value="A_PLUS">A+</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </Select>
          <Select
            value={wave}
            onChange={(e) => {
              setWave(e.target.value);
              setPage(1);
            }}
            className="xl:w-44"
          >
            {WAVE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            value={abGroup}
            onChange={(e) => {
              setAbGroup(e.target.value);
              setPage(1);
            }}
            className="xl:w-32"
          >
            <option value="">Any AB</option>
            <option value="A">Group A</option>
            <option value="B">Group B</option>
          </Select>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="xl:w-44"
          >
            <option value="">Any status</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            value={hasEmail}
            onChange={(e) => {
              setHasEmail(e.target.value);
              setPage(1);
            }}
            className="xl:w-36"
          >
            <option value="">Any email</option>
            <option value="true">Has email</option>
            <option value="false">No email</option>
          </Select>
          <Select
            value={excluded}
            onChange={(e) => {
              setExcluded(e.target.value);
              setPage(1);
            }}
            className="xl:w-40"
          >
            <option value="">Include all</option>
            <option value="false">Not excluded</option>
            <option value="true">Excluded only</option>
          </Select>
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="xl:w-40"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Business name</option>
            <option value="score">Prospect score</option>
            <option value="tier">Tier + score</option>
          </Select>
        </div>

        {selected.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs">
            <span className="font-semibold text-admin-indigo">
              {selected.size} selected
            </span>
            <span className="text-slate-soft">·</span>
            <Button
              variant="ghost"
              size="sm"
              title="Create a campaign for the selected leads"
              onClick={() =>
                router.push(
                  `/marketing/campaigns/new?leadIds=${[...selected].join(",")}`
                )
              }
            >
              <Send className="h-3.5 w-3.5" /> Send campaign
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setTagModal(true)}>
              <Tag className="h-3.5 w-3.5" /> Add tag
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setStatusModal(true)}>
              <CircleCheck className="h-3.5 w-3.5" /> Set status
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => runBulk("exclude")}
            >
              <ShieldAlert className="h-3.5 w-3.5" /> Exclude
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => runBulk("include")}
            >
              <CircleSlash className="h-3.5 w-3.5" /> Include
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red hover:bg-red-50"
              onClick={() => {
                if (
                  window.confirm(
                    `Delete ${selected.size} lead(s)? This also removes their sequence messages.`
                  )
                ) {
                  runBulk("delete");
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
            <button
              className="ml-auto text-slate-soft hover:text-slate-body"
              onClick={() => setSelected(new Set())}
            >
              Clear selection
            </button>
          </div>
        )}

        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="py-8 text-center text-sm text-red">Failed to load leads.</p>
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title="No leads match your filters"
            description="Import the campaign spreadsheet or add leads manually to get started."
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th className="w-8">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleAll}
                    aria-label="Select all on page"
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </Th>
                <Th>Business</Th>
                <Th>Tier</Th>
                <Th>Wave</Th>
                <Th>AB</Th>
                <Th>Status</Th>
                <Th>Location</Th>
                <Th>Channel</Th>
                <Th>Added</Th>
              </THead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="border-b border-border/60 last:border-0 hover:bg-slate-50/60"
                  >
                    <Td>
                      <input
                        type="checkbox"
                        checked={selected.has(lead._id)}
                        onChange={() => toggleOne(lead._id)}
                        aria-label={`Select ${lead.businessName}`}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        {lead.excludeFromSend && (
                          <Badge tone="red">Excl</Badge>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/marketing/leads/${lead._id}`}
                            className="block max-w-52 truncate font-medium text-navy hover:underline"
                          >
                            {lead.businessName ?? "—"}
                          </Link>
                          <p className="max-w-52 truncate text-xs text-slate-soft">
                            {lead.leadId ?? ""}
                            {lead.email ? ` · ${lead.email}` : " · no email"}
                          </p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      {lead.fitTier ? (
                        <Badge tone={tierTone(lead.fitTier)}>
                          {TIER_LABELS[lead.fitTier] ?? lead.fitTier}
                        </Badge>
                      ) : (
                        "—"
                      )}
                      {typeof lead.prospectScore === "number" && (
                        <span className="ml-1 text-xs text-slate-soft">
                          {lead.prospectScore}
                        </span>
                      )}
                    </Td>
                    <Td className="text-xs">
                      {lead.waveKey ? titleCase(lead.waveKey) : "—"}
                    </Td>
                    <Td>{lead.abGroup ?? "—"}</Td>
                    <Td>
                      <Badge tone={statusTone(lead.status)}>
                        {titleCase(lead.status)}
                      </Badge>
                    </Td>
                    <Td className="text-xs">
                      {lead.city ? `${lead.city}, ` : ""}
                      {lead.state ?? "—"}
                    </Td>
                    <Td className="text-xs">{lead.recommendedChannel ?? "—"}</Td>
                    <Td className="text-xs">{formatDate(lead.createdAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* Manual lead create modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add lead manually"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button loading={create.isPending} onClick={submitCreate}>
              Create lead
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input
              label="Business name *"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="Movil Notary"
            />
          </div>
          <Input
            label="Lead ID"
            value={form.leadId}
            onChange={(e) => setForm({ ...form, leadId: e.target.value })}
            placeholder="ND-03001"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="contact@example.com"
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="5551234567"
          />
          <Input
            label="Contact name"
            value={form.professionalName}
            onChange={(e) => setForm({ ...form, professionalName: e.target.value })}
          />
          <Input
            label="Website"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://…"
          />
          <Input
            label="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <Input
            label="State (2-letter)"
            maxLength={2}
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            placeholder="TX"
          />
          <Select
            label="Fit tier"
            value={form.fitTier}
            onChange={(e) => setForm({ ...form, fitTier: e.target.value })}
          >
            <option value="">—</option>
            <option value="A_PLUS">A+ (highest intent)</option>
            <option value="A">A (strong LSA)</option>
            <option value="B">B (mobile notary)</option>
            <option value="C">C (verify LSA)</option>
          </Select>
          <Select
            label="Recommended channel"
            value={form.recommendedChannel}
            onChange={(e) => setForm({ ...form, recommendedChannel: e.target.value })}
          >
            <option value="Email">Email</option>
            <option value="Instagram DM">Instagram DM</option>
            <option value="Facebook message">Facebook message</option>
            <option value="Phone/website">Phone/website</option>
          </Select>
          <div className="col-span-2">
            <Input
              label="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Context for this lead…"
            />
          </div>
        </div>
      </Modal>

      {/* Bulk tag modal */}
      <Modal
        open={tagModal}
        onClose={() => setTagModal(false)}
        title={`Add tag to ${selected.size} lead(s)`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTagModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => runBulk("tag", tagValue.trim())} disabled={!tagValue.trim()}>
              Add tag
            </Button>
          </>
        }
      >
        <Input
          label="Tag"
          value={tagValue}
          onChange={(e) => setTagValue(e.target.value)}
          placeholder="wave1-ready"
        />
      </Modal>

      {/* Bulk status modal */}
      <Modal
        open={statusModal}
        onClose={() => setStatusModal(false)}
        title={`Set status for ${selected.size} lead(s)`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setStatusModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => runBulk("status", statusValue)}>Set status</Button>
          </>
        }
      >
        <Select
          label="Status"
          value={statusValue}
          onChange={(e) => setStatusValue(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Modal>
    </div>
  );
}

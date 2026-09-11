import api, { envelopeGet } from "@/lib/api";
import { envelopeClient } from "@/lib/api";
import type {
  AnalyticsOverview,
  AudiencePreviewResult,
  Campaign,
  CampaignDetail,
  CampaignListRow,
  CampaignRecipient,
  CampaignType,
  DirectSendResult,
  EmailEventRow,
  EmailProvider,
  ImportJob,
  LeadDetail,
  LeadStats,
  MarketingHealth,
  MarketingLead,
  MarketingOverview,
  Meta,
  OutreachTask,
  Paginated,
  Playbook,
  SavedMappingPreset,
  SuppressionRow,
  UploadImportResult,
  Wave,
  WaveRow,
} from "@/types";

// ---------- Leads ----------

export interface ListLeadsParams {
  search?: string;
  tier?: string;
  wave?: string;
  state?: string;
  abGroup?: string;
  channel?: string;
  status?: string;
  hasEmail?: string;
  excluded?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export async function fetchLeads(
  params: ListLeadsParams = {}
): Promise<Paginated<MarketingLead[]>> {
  const res = await envelopeGet<MarketingLead[]>("/marketing/leads", { params });
  return { data: res.data, meta: res.meta as unknown as Meta };
}

export function fetchLead(id: string) {
  return api.get<LeadDetail>(`/marketing/leads/${id}`);
}

export function fetchLeadStats() {
  return api.get<LeadStats>("/marketing/leads/stats/overview");
}

export function createLead(data: Record<string, unknown>) {
  return api.post<MarketingLead>("/marketing/leads", data);
}

export function updateLead(id: string, data: Record<string, unknown>) {
  return api.patch<MarketingLead>(`/marketing/leads/${id}`, data);
}

export function deleteLead(id: string) {
  return api.delete<{ deleted: boolean }>(`/marketing/leads/${id}`);
}

export function bulkLeads(payload: {
  ids: string[];
  action: string;
  value?: string;
}) {
  return api.patch<{ affected: number }>("/marketing/leads/bulk", payload);
}

export function updateLeadMessage(
  leadId: string,
  step: number,
  data: { subject?: string; body?: string },
  force = false
) {
  return envelopeClient.patch(`/marketing/leads/${leadId}/messages/${step}`, data, {
    params: force ? { force: true } : undefined,
  });
}

// ---------- Providers ----------

export function fetchProviders() {
  return api.get<EmailProvider[]>("/marketing/providers");
}

export function createProvider(data: Record<string, unknown>) {
  return api.post<EmailProvider>("/marketing/providers", data);
}

export function updateProvider(id: string, data: Record<string, unknown>) {
  return api.patch<EmailProvider>(`/marketing/providers/${id}`, data);
}

export function deleteProvider(id: string) {
  return api.delete<{ deleted: boolean }>(`/marketing/providers/${id}`);
}

export function testProvider(id: string, to: string) {
  return api.post<{ sent: boolean }>(`/marketing/providers/${id}/test`, { to });
}

// ---------- Imports ----------

export function fetchImports() {
  return api.get<ImportJob[]>("/marketing/imports");
}

export function fetchImport(id: string) {
  return api.get<ImportJob>(`/marketing/imports/${id}`);
}

export async function uploadImport(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await envelopeClient.post("/marketing/imports", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data as UploadImportResult;
}

export function saveImportMapping(
  id: string,
  mapping: Record<string, number>,
  saveAsPreset?: string
) {
  return api.patch<ImportJob>(`/marketing/imports/${id}/mapping`, {
    mapping,
    saveAsPreset,
  });
}

export function startImport(id: string, skipNoEmail = false) {
  return api.post<ImportJob>(`/marketing/imports/${id}/start`, { skipNoEmail });
}

export function fetchMappingPresets() {
  return api.get<SavedMappingPreset[]>("/marketing/imports/mappings");
}

// ---------- Overview ----------

export function fetchMarketingOverview() {
  return api.get<MarketingOverview>("/marketing/overview");
}

// ---------- Campaigns ----------

export interface CreateCampaignPayload {
  name: string;
  type: CampaignType;
  providerId: string;
  audience: {
    mode: "FILTER" | "IDS" | "USERS";
    filters?: Record<string, unknown>;
    leadIds?: string[];
    excludeLeadIds?: string[];
    userFilters?: Record<string, unknown>;
  };
  content: Record<string, unknown>;
  startAt?: string;
  perMinute?: number;
  smartSendTimes?: boolean;
  stopOnReply?: boolean;
}

export function fetchCampaigns() {
  return api.get<CampaignListRow[]>("/marketing/campaigns");
}

export function fetchCampaign(id: string) {
  return api.get<CampaignDetail>(`/marketing/campaigns/${id}`);
}

export function createCampaign(payload: CreateCampaignPayload) {
  return api.post<Campaign>("/marketing/campaigns", payload);
}

export function updateCampaign(
  id: string,
  payload: Partial<CreateCampaignPayload>
) {
  return api.patch<Campaign>(`/marketing/campaigns/${id}`, payload);
}

export function deleteCampaign(id: string) {
  return api.delete<{ deleted: boolean }>(`/marketing/campaigns/${id}`);
}

export function scheduleCampaign(id: string, startAt?: string) {
  return api.post<Campaign>(`/marketing/campaigns/${id}/schedule`, { startAt });
}

export function pauseCampaign(id: string) {
  return api.post<Campaign>(`/marketing/campaigns/${id}/pause`, {});
}

export function resumeCampaign(id: string) {
  return api.post<Campaign>(`/marketing/campaigns/${id}/resume`, {});
}

export function cancelCampaign(id: string) {
  return api.post<Campaign>(`/marketing/campaigns/${id}/cancel`, {});
}

export function previewCampaign(payload: {
  type: string;
  audience: Record<string, unknown>;
  content: Record<string, unknown>;
}) {
  return api.post<AudiencePreviewResult>(
    "/marketing/campaigns/preview",
    payload
  );
}

export async function fetchCampaignRecipients(
  id: string,
  params: {
    status?: string;
    search?: string;
    step?: number;
    page?: number;
    limit?: number;
  }
): Promise<Paginated<CampaignRecipient[]>> {
  const res = await envelopeGet<CampaignRecipient[]>(
    `/marketing/campaigns/${id}/recipients`,
    { params }
  );
  return { data: res.data, meta: res.meta as unknown as Meta };
}

// ---------- Direct send ----------

export interface DirectSendPayload {
  targetType: "LEAD" | "USER" | "EMAIL";
  leadId?: string;
  userId?: string;
  email?: string;
  subject: string;
  body: string;
  providerId?: string;
  scheduleAt?: string;
}

export function sendDirect(payload: DirectSendPayload) {
  return api.post<DirectSendResult>("/marketing/send/direct", payload);
}

// ---------- Suppressions ----------

export async function fetchSuppressions(
  params: { search?: string; type?: string; page?: number; limit?: number } = {}
): Promise<Paginated<SuppressionRow[]>> {
  const res = await envelopeGet<SuppressionRow[]>("/marketing/suppressions", {
    params,
  });
  return { data: res.data, meta: res.meta as unknown as Meta };
}

export function createSuppression(payload: {
  email: string;
  type?: string;
  reason?: string;
}) {
  return api.post<SuppressionRow>("/marketing/suppressions", payload);
}

export function deleteSuppression(id: string) {
  return api.delete<{ removed: boolean }>(`/marketing/suppressions/${id}`);
}

// ---------- Analytics / waves / tasks / playbooks / health ----------

export function fetchAnalyticsOverview(days = 30) {
  return api.get<AnalyticsOverview>("/marketing/analytics/overview", {
    params: { days },
  });
}

export function fetchLeadTimeline(leadId: string) {
  return api.get<EmailEventRow[]>(
    `/marketing/analytics/leads/${leadId}/timeline`
  );
}

export function fetchWaves() {
  return api.get<WaveRow[]>("/marketing/waves");
}

export function updateWave(
  id: string,
  data: { name?: string; plannedStart?: string | null; status?: string; notes?: string }
) {
  return api.patch<Wave>(`/marketing/waves/${id}`, data);
}

export async function fetchTasks(
  params: { status?: string; channel?: string; search?: string; page?: number; limit?: number } = {}
): Promise<Paginated<OutreachTask[]>> {
  const res = await envelopeGet<OutreachTask[]>("/marketing/tasks", { params });
  return { data: res.data, meta: res.meta as unknown as Meta };
}

export function updateTask(
  id: string,
  data: { status?: string; dueDate?: string | null; notes?: string }
) {
  return api.patch<OutreachTask>(`/marketing/tasks/${id}`, data);
}

export function deleteTask(id: string) {
  return api.delete<{ deleted: boolean }>(`/marketing/tasks/${id}`);
}

export function fetchPlaybooks() {
  return api.get<Playbook[]>("/marketing/playbooks");
}

export function fetchMarketingHealth() {
  return api.get<MarketingHealth>("/marketing/health");
}

/** Triggers a browser file download for a CSV export endpoint. */
export function downloadCsv(path: string, fallbackName: string) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("admin_token")
      : null;
  void fetch(`${base}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("Export failed");
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = match?.[1] ?? fallbackName;
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(() => {
      window.alert("Export failed — is the API running?");
    });
}

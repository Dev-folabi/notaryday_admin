"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkLeads,
  cancelCampaign,
  createCampaign,
  createLead,
  createProvider,
  createSuppression,
  deleteCampaign,
  deleteLead,
  deleteProvider,
  deleteSuppression,
  deleteTask,
  fetchAnalyticsOverview,
  fetchCampaign,
  fetchCampaignRecipients,
  fetchCampaigns,
  fetchImport,
  fetchImports,
  fetchLead,
  fetchLeadStats,
  fetchLeadTimeline,
  fetchLeads,
  fetchMappingPresets,
  fetchMarketingHealth,
  fetchMarketingOverview,
  fetchMarketingSettings,
  fetchPlaybooks,
  fetchProviders,
  fetchSuppressions,
  fetchTasks,
  fetchWaves,
  pauseCampaign,
  previewCampaign,
  resumeCampaign,
  saveImportMapping,
  scheduleCampaign,
  sendDirect as sendDirectApi,
  startImport,
  testProvider,
  updateLead,
  updateLeadMessage,
  updateMarketingSettings,
  updateProvider,
  updateTask,
  updateWave,
  uploadImport,
  type CreateCampaignPayload,
  type DirectSendPayload,
  type ListLeadsParams,
} from "@/api/marketing.api";

const marketingKeys = {
  all: ["marketing"] as const,
  overview: ["marketing", "overview"] as const,
  leads: (params: ListLeadsParams) => ["marketing", "leads", params] as const,
  lead: (id: string) => ["marketing", "lead", id] as const,
  leadStats: ["marketing", "leadStats"] as const,
  providers: ["marketing", "providers"] as const,
  imports: ["marketing", "imports"] as const,
  import: (id: string) => ["marketing", "import", id] as const,
  presets: ["marketing", "importPresets"] as const,
  campaigns: ["marketing", "campaigns"] as const,
  campaign: (id: string) => ["marketing", "campaign", id] as const,
  campaignRecipients: (id: string, params: Record<string, unknown>) =>
    ["marketing", "campaign", id, "recipients", params] as const,
  suppressions: (params: Record<string, unknown>) =>
    ["marketing", "suppressions", params] as const,
  analytics: (days: number) => ["marketing", "analytics", days] as const,
  leadTimeline: (id: string) => ["marketing", "leadTimeline", id] as const,
  waves: ["marketing", "waves"] as const,
  tasks: (params: Record<string, unknown>) =>
    ["marketing", "tasks", params] as const,
  playbooks: ["marketing", "playbooks"] as const,
  health: ["marketing", "health"] as const,
  settings: ["marketing", "settings"] as const,
};

export function useMarketingOverview() {
  return useQuery({
    queryKey: marketingKeys.overview,
    queryFn: fetchMarketingOverview,
    staleTime: 60_000,
  });
}

export function useMarketingLeads(params: ListLeadsParams) {
  return useQuery({
    queryKey: marketingKeys.leads(params),
    queryFn: () => fetchLeads(params),
    placeholderData: (prev) => prev,
  });
}

export function useMarketingLead(id: string) {
  return useQuery({
    queryKey: marketingKeys.lead(id),
    queryFn: () => fetchLead(id),
    enabled: !!id,
  });
}

export function useLeadStats() {
  return useQuery({
    queryKey: marketingKeys.leadStats,
    queryFn: fetchLeadStats,
    staleTime: 60_000,
  });
}

export function useMarketingProviders() {
  return useQuery({
    queryKey: marketingKeys.providers,
    queryFn: fetchProviders,
  });
}

export function useMarketingImports() {
  return useQuery({
    queryKey: marketingKeys.imports,
    queryFn: fetchImports,
  });
}

export function useMarketingImport(id: string | null) {
  return useQuery({
    queryKey: marketingKeys.import(id ?? ""),
    queryFn: () => fetchImport(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "QUEUED" || status === "PROCESSING" ? 2500 : false;
    },
  });
}

export function useMappingPresets() {
  return useQuery({
    queryKey: marketingKeys.presets,
    queryFn: fetchMappingPresets,
  });
}

export function useLeadMutations() {
  const queryClient = useQueryClient();

  const invalidateLead = (id?: string) => {
    queryClient.invalidateQueries({ queryKey: ["marketing", "leads"] });
    queryClient.invalidateQueries({ queryKey: ["marketing", "overview"] });
    queryClient.invalidateQueries({ queryKey: ["marketing", "leadStats"] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["marketing", "lead", id] });
    }
  };

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => createLead(data),
    onSuccess: () => invalidateLead(),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateLead(id, data),
    onSuccess: (_d, vars) => invalidateLead(vars.id),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => invalidateLead(),
  });

  const bulk = useMutation({
    mutationFn: (payload: { ids: string[]; action: string; value?: string }) =>
      bulkLeads(payload),
    onSuccess: () => invalidateLead(),
  });

  const updateMessage = useMutation({
    mutationFn: ({
      leadId,
      step,
      data,
      force,
    }: {
      leadId: string;
      step: number;
      data: { subject?: string; body?: string };
      force?: boolean;
    }) => updateLeadMessage(leadId, step, data, force),
    onSuccess: (_d, vars) => invalidateLead(vars.leadId),
  });

  return { create, update, remove, bulk, updateMessage };
}

export function useProviderMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["marketing", "providers"] });
    queryClient.invalidateQueries({ queryKey: ["marketing", "overview"] });
  };

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => createProvider(data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      updateProvider(id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProvider(id),
    onSuccess: invalidate,
  });

  const test = useMutation({
    mutationFn: ({ id, to }: { id: string; to: string }) =>
      testProvider(id, to),
    onSuccess: invalidate,
  });

  return { create, update, remove, test };
}

export function useImportMutations() {
  const queryClient = useQueryClient();
  const invalidate = (id?: string) => {
    queryClient.invalidateQueries({ queryKey: ["marketing", "imports"] });
    queryClient.invalidateQueries({ queryKey: ["marketing", "overview"] });
    queryClient.invalidateQueries({ queryKey: ["marketing", "leadStats"] });
    if (id) {
      queryClient.invalidateQueries({
        queryKey: ["marketing", "import", id],
      });
    }
  };

  const upload = useMutation({
    mutationFn: (file: File) => uploadImport(file),
    onSuccess: () => invalidate(),
  });

  const saveMapping = useMutation({
    mutationFn: ({
      id,
      mapping,
      saveAsPreset,
    }: {
      id: string;
      mapping: Record<string, number>;
      saveAsPreset?: string;
    }) => saveImportMapping(id, mapping, saveAsPreset),
    onSuccess: (_d, vars) => invalidate(vars.id),
  });

  const start = useMutation({
    mutationFn: ({ id, skipNoEmail }: { id: string; skipNoEmail?: boolean }) =>
      startImport(id, skipNoEmail),
    onSuccess: (_d, vars) => invalidate(vars.id),
  });

  return { upload, saveMapping, start };
}

// ---------- Campaigns ----------

export function useCampaigns() {
  return useQuery({
    queryKey: marketingKeys.campaigns,
    queryFn: fetchCampaigns,
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: marketingKeys.campaign(id),
    queryFn: () => fetchCampaign(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.campaign.status;
      return status === "RUNNING" ||
        status === "SCHEDULED" ||
        status === "DISPATCHING"
        ? 5000
        : false;
    },
  });
}

export function useCampaignRecipients(
  id: string,
  params: { status?: string; search?: string; step?: number; page?: number; limit?: number }
) {
  return useQuery({
    queryKey: marketingKeys.campaignRecipients(id, params),
    queryFn: () => fetchCampaignRecipients(id, params),
    enabled: !!id,
    placeholderData: (prev) => prev,
    refetchInterval: (query) => {
      // Keep polling while recipients are still in flight
      const rows = query.state.data?.data;
      if (!rows) return false;
      return rows.some((r) => r.status === "QUEUED" || r.status === "SENDING")
        ? 5000
        : false;
    },
  });
}

export function useCampaignMutations() {
  const queryClient = useQueryClient();
  const invalidate = (id?: string) => {
    queryClient.invalidateQueries({ queryKey: ["marketing", "campaigns"] });
    queryClient.invalidateQueries({ queryKey: ["marketing", "overview"] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ["marketing", "campaign", id] });
      queryClient.invalidateQueries({
        queryKey: ["marketing", "campaign", id, "recipients"],
      });
    }
  };

  const create = useMutation({
    mutationFn: (payload: CreateCampaignPayload) => createCampaign(payload),
    onSuccess: () => invalidate(),
  });

  const schedule = useMutation({
    mutationFn: ({ id, startAt }: { id: string; startAt?: string }) =>
      scheduleCampaign(id, startAt),
    onSuccess: (_d, vars) => invalidate(vars.id),
  });

  const pause = useMutation({
    mutationFn: (id: string) => pauseCampaign(id),
    onSuccess: (_d, id) => invalidate(id),
  });

  const resume = useMutation({
    mutationFn: (id: string) => resumeCampaign(id),
    onSuccess: (_d, id) => invalidate(id),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => cancelCampaign(id),
    onSuccess: (_d, id) => invalidate(id),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteCampaign(id),
    onSuccess: () => invalidate(),
  });

  const preview = useMutation({
    mutationFn: (payload: {
      type: string;
      audience: Record<string, unknown>;
      content: Record<string, unknown>;
    }) => previewCampaign(payload),
  });

  const sendDirect = useMutation({
    mutationFn: (payload: DirectSendPayload) => sendDirectApi(payload),
  });

  return { create, schedule, pause, resume, cancel, remove, preview, sendDirect };
}

// ---------- Suppressions ----------

export function useSuppressions(params: {
  search?: string;
  type?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: marketingKeys.suppressions(params),
    queryFn: () => fetchSuppressions(params),
    placeholderData: (prev) => prev,
  });
}

export function useSuppressionMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["marketing", "suppressions"] });
    queryClient.invalidateQueries({ queryKey: ["marketing", "overview"] });
    queryClient.invalidateQueries({ queryKey: ["marketing", "leads"] });
  };

  const create = useMutation({
    mutationFn: (payload: { email: string; type?: string; reason?: string }) =>
      createSuppression(payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSuppression(id),
    onSuccess: invalidate,
  });

  return { create, remove };
}

// ---------- Analytics / waves / tasks / playbooks / health ----------

export function useAnalyticsOverview(days = 30) {
  return useQuery({
    queryKey: marketingKeys.analytics(days),
    queryFn: () => fetchAnalyticsOverview(days),
    staleTime: 60_000,
  });
}

export function useLeadTimeline(leadId: string) {
  return useQuery({
    queryKey: marketingKeys.leadTimeline(leadId),
    queryFn: () => fetchLeadTimeline(leadId),
    enabled: !!leadId,
  });
}

export function useWaves() {
  return useQuery({
    queryKey: marketingKeys.waves,
    queryFn: fetchWaves,
  });
}

export function useWaveMutations() {
  const queryClient = useQueryClient();
  const update = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; plannedStart?: string | null; status?: string; notes?: string };
    }) => updateWave(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["marketing", "waves"] }),
  });
  return { update };
}

export function useTasks(
  params: { status?: string; channel?: string; search?: string; page?: number; limit?: number }
) {
  return useQuery({
    queryKey: marketingKeys.tasks(params),
    queryFn: () => fetchTasks(params),
    placeholderData: (prev) => prev,
  });
}

export function useTaskMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["marketing", "tasks"] });
  const update = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { status?: string; dueDate?: string | null; notes?: string };
    }) => updateTask(id, data),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: invalidate,
  });
  return { update, remove };
}

export function usePlaybooks() {
  return useQuery({
    queryKey: marketingKeys.playbooks,
    queryFn: fetchPlaybooks,
    staleTime: 10 * 60_000,
  });
}

export function useMarketingHealth() {
  return useQuery({
    queryKey: marketingKeys.health,
    queryFn: fetchMarketingHealth,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

// ---------- Settings ----------

export function useMarketingSettings() {
  return useQuery({
    queryKey: marketingKeys.settings,
    queryFn: fetchMarketingSettings,
    staleTime: 60_000,
  });
}

export function useMarketingSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      pixelTrackingUrl?: string;
      pixelTrackingEnabled?: boolean;
      physicalAddress?: string;
    }) => updateMarketingSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketingKeys.settings });
    },
  });
}

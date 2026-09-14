export type UserRole = "USER" | "ADMIN";
export type PlanTier = "FREE" | "PRO" | "PRO_ANNUAL" | "TEAM";

export interface AdminUserRow {
  id: string;
  email: string;
  username: string;
  full_name?: string | null;
  phone?: string | null;
  role: UserRole;
  plan: PlanTier;
  plan_expires_at?: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: string;
  updated_at: string;
  last_seen_at?: string | null;
  deleted_at?: string | null;
  _count?: { jobs: number };
}

export interface UserDetail extends Omit<AdminUserRow, "_count"> {
  settings?: { state?: string | null; timezone?: string | null } | null;
  stats: {
    totalJobs: number;
    jobsByStatus: { status: string; count: number }[];
    bookings: number;
    invoices: number;
    unpaidInvoices: number;
    expenses: number;
  };
}

export interface JobStatusCount {
  status: string;
  count: number;
}

export interface AdminStats {
  users: {
    total: number;
    new7d: number;
    new30d: number;
    active7d: number;
    active30d: number;
    byPlan: { FREE: number; PRO: number; PRO_ANNUAL: number };
    proTrial: number;
    proPaid: number;
    recent: AdminUserRow[];
  };
  jobs: {
    total: number;
    last30d: number;
    byStatus: JobStatusCount[];
  };
  ops: {
    pendingBookings: number;
    pendingReviewJobs: number;
    failedImports: number;
    failedInvoices: number;
    pendingLsEvents: number;
  };
}

export interface AdminJob {
  id: string;
  user_id: string;
  address: string;
  appointment_time: string;
  signing_type: string;
  status: string;
  source: string;
  fee: string;
  net_earnings?: string | null;
  client_name?: string | null;
  client_phone?: string | null;
  platform_name?: string | null;
  created_at: string;
  user?: { id: string; email: string; username: string };
}

export interface QueueCounts {
  waiting?: number;
  active?: number;
  completed?: number;
  failed?: number;
  delayed?: number;
  paused?: number;
  error?: string;
}

export interface LemonSqueezyEvent {
  id: string;
  event_name: string;
  processed: boolean;
  processed_at?: string | null;
  error?: string | null;
  created_at: string;
}

export interface SystemHealth {
  queues: Record<string, QueueCounts>;
  imports: {
    failed: number;
    byStatus: JobStatusCount[];
  };
  invoices: { emailFailures: number };
  lemonsqueezy: {
    total: number;
    pending: number;
    recent: LemonSqueezyEvent[];
  };
}

export interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T;
  meta: Meta;
}

// ---------- Marketing / CRM ----------

export type MarketingLeadStatus =
  | "NEW"
  | "NEEDS_VERIFICATION"
  | "IN_SEQUENCE"
  | "CONTACTED"
  | "REPLIED"
  | "CONVERTED"
  | "UNSUBSCRIBED"
  | "BOUNCED"
  | "EXCLUDED";

export type FitTier = "A_PLUS" | "A" | "B" | "C";
export type WaveKey = "WAVE_1" | "WAVE_2" | "WAVE_3" | "SOCIAL_PHONE" | "EXCLUDED";
export type ProviderType = "resend" | "brevo" | "zoho" | "gmail";

export interface MarketingLead {
  _id: string;
  leadId?: string | null;
  fitTier?: string | null;
  prospectScore?: number | null;
  businessName?: string | null;
  professionalName?: string | null;
  website?: string | null;
  email?: string | null;
  emailVerification?: string | null;
  phone?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  qualificationEvidence?: string | null;
  bestAngle?: string | null;
  personalizationHook?: string | null;
  recommendedChannel?: string | null;
  emailSubject?: string | null;
  verificationStatus?: string | null;
  excludeFromSend?: boolean;
  campaignWave?: string | null;
  waveKey?: string | null;
  abGroup?: string | null;
  status?: string;
  tags?: string[];
  notes?: string | null;
  emailsSent?: number;
  openedCount?: number;
  clickedCount?: number;
  openedAt?: string[] | null;
  clickedAt?: string[] | null;
  lastContactedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadMessage {
  _id: string;
  leadRef: string;
  leadId?: string | null;
  step: number; // 1-9 sequence emails, 10 DM
  kind: "EMAIL" | "DM";
  subject?: string | null;
  body?: string | null;
  dayOffset?: number | null;
  edited: boolean;
  updatedAt: string;
}

export interface LeadSuppression {
  _id: string;
  email: string;
  type: string;
  reason?: string | null;
  createdAt: string;
}

export interface LeadDetail {
  lead: MarketingLead;
  messages: LeadMessage[];
  suppression: LeadSuppression | null;
  /** Per-step send status across all campaigns (steps 1-9). */
  stepProgress?: LeadStepProgress[];
}

/** Sequence-step send progress for one lead, aggregated over campaigns. */
export interface LeadStepProgress {
  step: number;
  /** SENT | QUEUED | FAILED | SKIPPED | BOUNCED | UNSUBSCRIBED | null */
  status: string | null;
  sentCount: number;
  openCount: number;
  clickCount: number;
  lastSentAt: string | null;
  nextSendAt: string | null;
  lastError: string | null;
}

export interface GroupCount {
  key: string;
  count: number;
}

export interface LeadStats {
  total: number;
  withEmail: number;
  excluded: number;
  unsubscribed: number;
  byTier: GroupCount[];
  byWave: GroupCount[];
  byStatus: GroupCount[];
  byAbGroup: GroupCount[];
  byChannel: GroupCount[];
  byStateTop: GroupCount[];
}

export interface EmailProvider {
  _id: string;
  name: string;
  type: ProviderType;
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
  perMinuteLimit: number;
  dailyLimit: number;
  status: "ACTIVE" | "PAUSED";
  isDefault: boolean;
  warmupEnabled: boolean;
  warmupCurrentDaily: number;
  healthLastError?: string | null;
  healthLastErrorAt?: string | null;
  healthLastSuccessAt?: string | null;
  sentToday: number;
  sentTodayDate?: string | null;
  notes?: string | null;
  credentialsSet: string[];
  createdAt: string;
  updatedAt: string;
}

export type ImportStatus =
  | "UPLOADED"
  | "MAPPED"
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "COMPLETED_WITH_ERRORS"
  | "FAILED"
  | "CANCELLED";

export interface ImportJob {
  _id: string;
  filename: string;
  mimeType?: string | null;
  status: ImportStatus;
  headers: string[];
  sampleRows: string[][];
  mapping: Record<string, number>;
  options?: { skipNoEmail?: boolean };
  totalRows: number;
  importedCount: number;
  updatedCount: number;
  duplicateCount: number;
  skippedCount: number;
  errorCount: number;
  rowErrors?: { row: number; error: string; leadId?: string }[];
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string | null;
  createdAt: string;
}

export interface UploadImportResult {
  import: ImportJob;
  suggestedMapping: Record<string, number>;
  presets: { id: string; name: string; mapping: Record<string, number> }[];
}

export interface SavedMappingPreset {
  _id: string;
  name: string;
  mapping: Record<string, number>;
  headers?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MarketingOverview {
  leadStats: LeadStats;
  recentImports: ImportJob[];
  providers: EmailProvider[];
}

export const IMPORT_TARGET_FIELDS: { key: string; label: string }[] = [
  { key: "leadId", label: "Lead ID" },
  { key: "fitTier", label: "Fit tier" },
  { key: "prospectScore", label: "Prospect score" },
  { key: "businessName", label: "Business name" },
  { key: "professionalName", label: "Professional name" },
  { key: "website", label: "Website" },
  { key: "email", label: "Email" },
  { key: "emailVerification", label: "Email verification" },
  { key: "phone", label: "Phone" },
  { key: "facebookUrl", label: "Facebook URL" },
  { key: "instagramUrl", label: "Instagram URL" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "qualificationEvidence", label: "Qualification evidence" },
  { key: "bestAngle", label: "Best Notary Day angle" },
  { key: "personalizationHook", label: "Personalization hook" },
  { key: "recommendedChannel", label: "Recommended channel" },
  { key: "emailSubject", label: "Email subject" },
  { key: "verificationStatus", label: "Verification status" },
  { key: "excludeFromSend", label: "Exclude from send" },
  { key: "campaignWave", label: "Campaign wave" },
  { key: "abGroup", label: "AB test group" },
  { key: "email1", label: "Email 1 (Day 1)" },
  { key: "email2", label: "Email 2 (Day 3)" },
  { key: "email3", label: "Email 3 (Day 5)" },
  { key: "email4", label: "Email 4 (Day 7)" },
  { key: "email5", label: "Email 5 (Day 9)" },
  { key: "email6", label: "Email 6 (Day 11)" },
  { key: "email7", label: "Email 7 (Day 13)" },
  { key: "email8", label: "Email 8 (Day 15)" },
  { key: "email9", label: "Email 9 (Day 17)" },
  { key: "dmMessage", label: "DM message" },
];

// ---------- Campaigns ----------

export type CampaignType = "ONE_OFF" | "SEQUENCE" | "DIRECT";
export type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "DISPATCHING"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED";

export interface CampaignAudience {
  mode: "FILTER" | "IDS";
  filters?: {
    tier?: string;
    wave?: string;
    state?: string;
    abGroup?: string;
    channel?: string;
    tags?: string[];
  };
  leadIds?: string[];
  excludeLeadIds?: string[];
}

export interface CampaignContent {
  mode: "LEAD_DRAFTS" | "TEMPLATE";
  step?: number;
  steps?: number[];
  subject?: string;
  body?: string;
}

export interface Campaign {
  _id: string;
  name: string;
  type: CampaignType;
  providerRef: string;
  status: CampaignStatus;
  audience: CampaignAudience;
  content: CampaignContent;
  schedule: {
    startAt: string;
    perMinute: number;
    smartSendTimes: boolean;
  };
  stopOnReply: boolean;
  dispatchStartedAt?: string | null;
  completedAt?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignListRow {
  campaign: Campaign;
  stats: {
    total: number;
    sent: number;
    failed: number;
    skipped: number;
    queued: number;
    sending: number;
    opened: number;
    clicked: number;
  };
}

export interface CampaignStats {
  total: number;
  byStatus: Record<string, number>;
  opened: number;
  clicked: number;
  byStep: {
    step: number;
    total: number;
    sent: number;
    failed: number;
    skipped: number;
    opened: number;
  }[];
}

export interface CampaignDetail {
  campaign: Campaign;
  provider?: {
    _id: string;
    name: string;
    type: string;
    fromName: string;
    fromEmail: string;
    status: string;
    isDefault: boolean;
    sentToday: number;
    dailyLimit: number;
  } | null;
  stats: CampaignStats;
}

export type RecipientStatus =
  | "QUEUED"
  | "SENDING"
  | "SENT"
  | "FAILED"
  | "SKIPPED"
  | "CANCELLED"
  | "BOUNCED"
  | "COMPLAINED"
  | "UNSUBSCRIBED";

export interface CampaignRecipient {
  _id: string;
  campaignRef: string;
  leadRef?: string | null;
  step: number;
  email: string;
  status: RecipientStatus;
  sendAt: string;
  sentAt?: string | null;
  subject?: string | null;
  error?: string | null;
  skipReason?: string | null;
  openCount: number;
  clickCount: number;
  openedAt?: string[] | null;
  clickedAt?: string[] | null;
  providerMessageId?: string | null;
  unsubToken?: string | null;
  leadName?: string | null;
  abGroup?: string | null;
}

export interface AudiencePreviewResult {
  total: number;
  sendable: number;
  noEmail: number;
  excluded: number;
  suppressed: number;
  noDraft: number;
  sample: {
    _id: string;
    businessName?: string;
    email?: string;
    state?: string;
    fitTier?: string;
    waveKey?: string;
    abGroup?: string;
  }[];
}

export interface SuppressionRow {
  _id: string;
  email: string;
  type: "UNSUBSCRIBE" | "BOUNCE" | "COMPLAINT" | "MANUAL";
  reason?: string | null;
  leadRef?: string | null;
  token?: string | null;
  createdAt: string;
}

export interface DirectSendResult {
  campaignId: string;
  recipientId: string;
  email: string;
  provider: string;
  sendAt: string;
}

export const TEMPLATE_VARIABLES = [
  "business_name",
  "professional_name",
  "first_name",
  "city",
  "state",
  "website",
  "personalization_hook",
  "best_angle",
  "lead_id",
  "email",
];

// ---------- Analytics / waves / tasks / playbooks ----------

export interface AnalyticsOverview {
  totals: {
    leads: number;
    leadsWithEmail: number;
    sent: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    bounced: number;
    failed: number;
    converted: number;
  };
  funnel: {
    leads: number;
    withEmail: number;
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  sendsPerDay: {
    date: string;
    sent: number;
    opened: number;
    clicked: number;
    unsubscribed: number;
    bounced: number;
    failed: number;
  }[];
  abTest: {
    group: string;
    assigned: number;
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
    openRate: number | null;
    clickRate: number | null;
    conversionRate: number | null;
  }[];
  steps: {
    step: number;
    sent: number;
    opened: number;
    openRate: number | null;
    skipped: number;
    failed: number;
  }[];
}

export interface Wave {
  _id: string;
  waveKey: string;
  name: string;
  plannedStart?: string | null;
  status: "PLANNED" | "ACTIVE" | "COMPLETED";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WaveRow {
  wave: Wave;
  progress: {
    leads: number;
    withEmail: number;
    sent: number;
    opened: number;
    clicked: number;
    failed: number;
    queued: number;
  };
}

export type TaskStatus = "TODO" | "DONE" | "SKIPPED";

export interface OutreachTask {
  _id: string;
  leadRef: string;
  channel: string;
  status: TaskStatus;
  message?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  lead: {
    _id: string;
    businessName?: string | null;
    email?: string | null;
    state?: string | null;
    instagramUrl?: string | null;
    facebookUrl?: string | null;
    phone?: string | null;
    leadId?: string | null;
  } | null;
}

export interface Playbook {
  _id: string;
  signal: string;
  angle: string;
  cta: string;
}

export interface MarketingHealth {
  queue: Record<string, number | string>;
  mongo: "up" | "down";
  lastEventAt: string | null;
}

export interface EmailEventRow {
  _id: string;
  type: string;
  email?: string | null;
  source?: string | null;
  meta?: Record<string, unknown> | null;
  createdAt: string;
}

// ---------- Transactional Email Providers ----------

export type TransactionalProviderType = "resend" | "brevo";

export interface EmailProviderStatus {
  type: TransactionalProviderType;
  label: string;
  configured: boolean;
  fromEmail: string;
}

export interface EmailProviderSettings {
  providers: EmailProviderStatus[];
  active: TransactionalProviderType;
}

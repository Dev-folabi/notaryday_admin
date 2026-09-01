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

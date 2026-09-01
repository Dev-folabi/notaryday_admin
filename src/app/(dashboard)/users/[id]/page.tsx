"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CreditCard, KeyRound, Ban, RotateCcw } from "lucide-react";
import { useAdminUser, useAdminMutations } from "@/hooks/useAdmin";
import { useToastStore } from "@/components/ui/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Input";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { formatDate, titleCase } from "@/lib/utils";
import type { PlanTier } from "@/types";

function planTone(plan: string): "amber" | "slate" {
  return plan === "PRO" || plan === "PRO_ANNUAL" ? "amber" : "slate";
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data, isLoading, isError } = useAdminUser(id);
  const { changePlan, resetPw, suspend, restore } = useAdminMutations();
  const push = useToastStore((s) => s.push);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planValue, setPlanValue] = useState("");
  const [confirmAction, setConfirmAction] = useState<
    "reset" | "suspend" | "restore" | null
  >(null);
  const [busy, setBusy] = useState(false);

  if (isLoading) return <Spinner />;
  if (isError || !data)
    return <p className="text-sm text-red">Failed to load user.</p>;

  const user = data;

  const submitPlan = async () => {
    if (!planValue) return;
    setBusy(true);
    try {
      await changePlan.mutateAsync({ id, plan: planValue as PlanTier });
      push(`Plan updated to ${planValue}`);
      setPlanModalOpen(false);
    } catch {
      push("Failed to update plan", "error");
    } finally {
      setBusy(false);
    }
  };

  const submitAction = async () => {
    if (!confirmAction) return;
    setBusy(true);
    try {
      if (confirmAction === "reset") {
        await resetPw.mutateAsync(id);
        push("Password reset email sent");
      } else if (confirmAction === "suspend") {
        await suspend.mutateAsync(id);
        push("User suspended");
      } else {
        await restore.mutateAsync(id);
        push("User restored");
      }
      setConfirmAction(null);
    } catch {
      push("Action failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/users"
          className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-admin-indigo hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to users
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-navy">
            {user.full_name || user.username}
          </h1>
          <Badge tone={planTone(user.plan)}>{user.plan}</Badge>
          {user.deleted_at ? (
            <Badge tone="red">Suspended</Badge>
          ) : (
            <Badge tone="teal">Active</Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-soft">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardHeader title="Profile" />
            <dl className="flex flex-col gap-2 text-sm">
              <Row label="Username" value={`@${user.username}`} />
              <Row label="Phone" value={user.phone} />
              <Row label="Role" value={titleCase(user.role)} />
              <Row label="Onboarding" value={user.onboarding_completed ? "Complete" : `Step ${user.onboarding_step}`} />
              <Row label="State" value={user.settings?.state} />
              <Row label="Timezone" value={user.settings?.timezone} />
              <Row label="Joined" value={formatDate(user.created_at)} />
              <Row label="Last seen" value={formatDate(user.last_seen_at)} />
            </dl>
          </Card>

          <Card>
            <CardHeader title="Actions" />
            <div className="flex flex-col gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPlanValue(user.plan);
                  setPlanModalOpen(true);
                }}
              >
                <CreditCard className="h-3.5 w-3.5" /> Change plan
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmAction("reset")}
              >
                <KeyRound className="h-3.5 w-3.5" /> Send password reset
              </Button>
              {user.deleted_at ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setConfirmAction("restore")}
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Restore account
                </Button>
              ) : (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmAction("suspend")}
                >
                  <Ban className="h-3.5 w-3.5" /> Suspend account
                </Button>
              )}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <MiniStat label="Total jobs" value={user.stats.totalJobs} />
            <MiniStat label="Bookings" value={user.stats.bookings} />
            <MiniStat label="Expenses" value={user.stats.expenses} />
            <MiniStat
              label="Invoices"
              value={user.stats.invoices}
              sub={`${user.stats.unpaidInvoices} unpaid`}
            />
          </div>

          <Card>
            <CardHeader title="Jobs by status" />
            {user.stats.jobsByStatus.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-soft">
                No jobs recorded.
              </p>
            ) : (
              <Table>
                <THead>
                  <Th>Status</Th>
                  <Th className="text-right">Count</Th>
                </THead>
                <tbody>
                  {user.stats.jobsByStatus.map((row) => (
                    <tr key={row.status} className="border-b border-border/60 last:border-0">
                      <Td>
                        <Badge tone="slate">{titleCase(row.status)}</Badge>
                      </Td>
                      <Td className="text-right font-semibold text-navy">
                        {row.count}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title="Change plan"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitPlan} loading={busy}>
              Save
            </Button>
          </>
        }
      >
        <Select
          label="Plan tier"
          value={planValue}
          onChange={(e) => setPlanValue(e.target.value)}
        >
          <option value="FREE">Free</option>
          <option value="PRO">Pro (monthly)</option>
          <option value="PRO_ANNUAL">Pro (annual)</option>
        </Select>
      </Modal>

      <Modal
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction === "suspend"
            ? "Suspend account"
            : confirmAction === "restore"
            ? "Restore account"
            : "Send password reset"
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === "suspend" ? "danger" : "primary"}
              onClick={submitAction}
              loading={busy}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-body">
          {confirmAction === "suspend" &&
            "This will soft-delete the account and cancel its paid plan. The user will not be able to log in. Their data is retained."}
          {confirmAction === "restore" &&
            "This will re-enable the account and allow the user to log in again."}
          {confirmAction === "reset" &&
            `A password reset email will be sent to ${user.email}.`}
        </p>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-xs font-medium text-slate-soft">{label}</dt>
      <dd className="text-right text-sm text-slate-body">{value || "—"}</dd>
    </div>
  );
}

function MiniStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <Card>
      <p className="text-xs font-medium text-slate-soft">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
      {sub && <p className="text-[11px] text-slate-soft">{sub}</p>}
    </Card>
  );
}

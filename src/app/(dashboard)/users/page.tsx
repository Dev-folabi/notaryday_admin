"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useAdminUsers } from "@/hooks/useAdmin";
import type { PlanTier } from "@/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Input, Select } from "@/components/ui/Input";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";

function planTone(plan: string): "amber" | "slate" {
  return plan === "PRO" || plan === "PRO_ANNUAL" ? "amber" : "slate";
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [onboarding, setOnboarding] = useState("");
  const [suspended, setSuspended] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAdminUsers({
    search: search || undefined,
    plan: (plan || undefined) as PlanTier | undefined,
    onboarding: onboarding || undefined,
    suspended: suspended || undefined,
    page,
    limit: 20,
  });

  const applySearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Users</h1>
        <p className="mt-1 text-sm text-slate-soft">
          All notary accounts on the platform.
        </p>
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-soft" />
            <Input
              className="pl-9"
              placeholder="Search by name, email or username…"
              defaultValue={search}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  applySearch((e.target as HTMLInputElement).value);
              }}
              onBlur={(e) => applySearch(e.target.value)}
            />
          </div>
          <Select
            value={plan}
            onChange={(e) => {
              setPlan(e.target.value);
              setPage(1);
            }}
            className="md:w-40"
          >
            <option value="">All plans</option>
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
            <option value="PRO_ANNUAL">Pro Annual</option>
          </Select>
          <Select
            value={onboarding}
            onChange={(e) => {
              setOnboarding(e.target.value);
              setPage(1);
            }}
            className="md:w-44"
          >
            <option value="">Any onboarding</option>
            <option value="true">Onboarded</option>
            <option value="false">Not onboarded</option>
          </Select>
          <Select
            value={suspended}
            onChange={(e) => {
              setSuspended(e.target.value);
              setPage(1);
            }}
            className="md:w-40"
          >
            <option value="">Active only</option>
            <option value="true">Suspended</option>
          </Select>
        </div>

        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="py-8 text-center text-sm text-red">
            Failed to load users.
          </p>
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title="No users match your filters"
            description="Try adjusting the search or filter criteria."
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th>User</Th>
                <Th>Plan</Th>
                <Th>Onboarding</Th>
                <Th>Jobs</Th>
                <Th>Last seen</Th>
                <Th>Joined</Th>
                <Th>Status</Th>
              </THead>
              <tbody>
                {data.data.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border/60 last:border-0 hover:bg-slate-50/60"
                  >
                    <Td>
                      <Link
                        href={`/users/${u.id}`}
                        className="font-medium text-navy hover:underline"
                      >
                        {u.full_name || u.username}
                      </Link>
                      <p className="text-xs text-slate-soft">{u.email}</p>
                    </Td>
                    <Td>
                      <Badge tone={planTone(u.plan)}>{u.plan}</Badge>
                    </Td>
                    <Td>
                      {u.onboarding_completed ? (
                        <span className="text-teal">Complete</span>
                      ) : (
                        <span className="text-amber">
                          Step {u.onboarding_step}
                        </span>
                      )}
                    </Td>
                    <Td>{u._count?.jobs ?? 0}</Td>
                    <Td className="text-xs">{formatDate(u.last_seen_at)}</Td>
                    <Td className="text-xs">{formatDate(u.created_at)}</Td>
                    <Td>
                      {u.deleted_at ? (
                        <Badge tone="red">Suspended</Badge>
                      ) : (
                        <Badge tone="teal">Active</Badge>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}

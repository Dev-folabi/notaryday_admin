"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminJobs } from "@/hooks/useAdmin";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Input, Select } from "@/components/ui/Input";
import { Table, THead, Th, Td } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTime, titleCase } from "@/lib/utils";

const JOB_STATUSES = [
  "PENDING",
  "PENDING_REVIEW",
  "CONFIRMED",
  "IN_PROGRESS",
  "SCANNING",
  "COMPLETE",
  "CANCELLED",
  "DECLINED",
];

const JOB_SOURCES = [
  "MANUAL",
  "EMAIL_IMPORT",
  "SCREENSHOT",
  "BOOKING_PAGE",
];

function statusTone(status: string): "teal" | "amber" | "red" | "blue" | "slate" | "indigo" {
  switch (status) {
    case "COMPLETE":
      return "teal";
    case "CONFIRMED":
    case "IN_PROGRESS":
      return "blue";
    case "PENDING":
    case "PENDING_REVIEW":
      return "amber";
    case "CANCELLED":
    case "DECLINED":
      return "red";
    case "SCANNING":
      return "indigo";
    default:
      return "slate";
  }
}

export default function JobsPage() {
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAdminJobs({
    status: status || undefined,
    source: source || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: 20,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Jobs</h1>
        <p className="mt-1 text-sm text-slate-soft">
          Every signing job across all notaries.
        </p>
      </div>

      <Card>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="md:w-44"
          >
            <option value="">All statuses</option>
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
          <Select
            value={source}
            onChange={(e) => {
              setSource(e.target.value);
              setPage(1);
            }}
            className="md:w-44"
          >
            <option value="">All sources</option>
            {JOB_SOURCES.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="md:w-44"
          />
          <span className="hidden pb-2.5 text-xs text-slate-soft md:block">to</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="md:w-44"
          />
        </div>

        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <p className="py-8 text-center text-sm text-red">
            Failed to load jobs.
          </p>
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title="No jobs match your filters"
            description="Try adjusting the status, source or date range."
          />
        ) : (
          <>
            <Table>
              <THead>
                <Th>Appointment</Th>
                <Th>Address</Th>
                <Th>Notary</Th>
                <Th>Type</Th>
                <Th>Status</Th>
                <Th>Source</Th>
                <Th className="text-right">Fee</Th>
              </THead>
              <tbody>
                {data.data.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-border/60 last:border-0 hover:bg-slate-50/60"
                  >
                    <Td className="text-xs whitespace-nowrap">
                      {formatDateTime(job.appointment_time)}
                    </Td>
                    <Td className="max-w-xs truncate">{job.address}</Td>
                    <Td className="text-xs">
                      {job.user ? (
                        <Link
                          href={`/users/${job.user_id}`}
                          className="font-medium text-admin-indigo hover:underline"
                        >
                          {job.user.email}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="text-xs">{titleCase(job.signing_type)}</Td>
                    <Td>
                      <Badge tone={statusTone(job.status)}>
                        {titleCase(job.status)}
                      </Badge>
                    </Td>
                    <Td className="text-xs">{titleCase(job.source)}</Td>
                    <Td className="text-right font-semibold text-navy">
                      ${Number(job.fee).toFixed(2)}
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

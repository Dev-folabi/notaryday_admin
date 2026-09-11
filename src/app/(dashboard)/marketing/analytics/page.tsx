"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
  LabelList,
} from "recharts";
import { useAnalyticsOverview } from "@/hooks/useMarketing";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Select } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";

function pct(n: number, d: number): string {
  return d > 0 ? `${Math.round((n / d) * 1000) / 10}%` : "—";
}

function FunnelBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-xs font-medium text-slate-body">
        {label}
      </span>
      <div className="h-7 flex-1 overflow-hidden rounded-md bg-slate-100">
        <div
          className={`flex h-full items-center justify-end rounded-md px-2 ${tone}`}
          style={{ width: `${max > 0 ? Math.max(2, (value / max) * 100) : 0}%` }}
        >
          <span className="text-[11px] font-bold text-white">{value}</span>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError } = useAnalyticsOverview(days);

  if (isLoading) return <Spinner />;
  if (isError || !data) {
    return (
      <p className="py-8 text-center text-sm text-red">
        Failed to load analytics. Is the API running?
      </p>
    );
  }

  const { totals, funnel, sendsPerDay, abTest, steps } = data;
  const hasActivity = totals.sent > 0 || totals.opened > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Analytics</h1>
          <p className="mt-1 text-sm text-slate-soft">
            Campaign performance: sends, engagement funnel, A/B test and
            sequence step health.
          </p>
        </div>
        <Select
          value={String(days)}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-36"
        >
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        {[
          { label: "Sent", value: totals.sent, cls: "text-navy" },
          { label: "Opened", value: totals.opened, cls: "text-teal" },
          { label: "Clicked", value: totals.clicked, cls: "text-teal" },
          {
            label: "Unsub'd",
            value: totals.unsubscribed,
            cls: "text-red",
          },
          { label: "Bounced", value: totals.bounced, cls: "text-amber" },
          { label: "Failed", value: totals.failed, cls: "text-red" },
          { label: "Converted", value: totals.converted, cls: "text-admin-indigo" },
        ].map((s) => (
          <Card key={s.label} className="text-center">
            <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
            <p className="text-[11px] uppercase tracking-wide text-slate-soft">
              {s.label}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Activity over time"
            subtitle={`Sends, opens and clicks per day (last ${days} days)`}
          />
          {sendsPerDay.every((d) => d.sent === 0) ? (
            <EmptyState
              title="No sends in this window"
              description="Schedule a campaign to start collecting engagement data."
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sendsPerDay} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="sent" name="Sent" stroke="#4f46e5" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="opened" name="Opened" stroke="#0e7b6c" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="clicked" name="Clicked" stroke="#d97706" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="unsubscribed" name="Unsub'd" stroke="#c0392b" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="bounced" name="Bounced" stroke="#9ca3af" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Conversion funnel" subtitle="Lead → email → sent → engaged → converted" />
          <div className="flex flex-col gap-2.5">
            <FunnelBar label="Leads" value={funnel.leads} max={funnel.leads} tone="bg-slate-400" />
            <FunnelBar label="With email" value={funnel.withEmail} max={funnel.leads} tone="bg-admin-indigo" />
            <FunnelBar label="Sent" value={funnel.sent} max={funnel.leads} tone="bg-indigo-500" />
            <FunnelBar label="Opened" value={funnel.opened} max={funnel.leads} tone="bg-teal" />
            <FunnelBar label="Clicked" value={funnel.clicked} max={funnel.leads} tone="bg-amber-500" />
            <FunnelBar label="Converted" value={funnel.converted} max={funnel.leads} tone="bg-emerald-600" />
          </div>
          <div className="mt-4 space-y-1 text-xs text-slate-soft">
            <p>
              Open rate (of sent):{" "}
              <span className="font-semibold text-slate-body">
                {pct(totals.opened, totals.sent)}
              </span>
            </p>
            <p>
              Click rate (of sent):{" "}
              <span className="font-semibold text-slate-body">
                {pct(totals.clicked, totals.sent)}
              </span>
            </p>
            <p>
              Conversion rate (of sent):{" "}
              <span className="font-semibold text-slate-body">
                {pct(totals.converted, totals.sent)}
              </span>
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="A/B test results"
            subtitle="Across all campaigns — the live version of the spreadsheet's tracker"
          />
          {abTest.length === 0 ? (
            <EmptyState
              title="No A/B data yet"
              description="Recipients inherit each lead's A/B group at dispatch time."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-slate-soft">
                    <th className="py-2 pr-3">Variant</th>
                    <th className="py-2 pr-3">Sent</th>
                    <th className="py-2 pr-3">Opened</th>
                    <th className="py-2 pr-3">Clicked</th>
                    <th className="py-2 pr-3">Converted</th>
                    <th className="py-2 pr-3">Open %</th>
                    <th className="py-2">Conv %</th>
                  </tr>
                </thead>
                <tbody>
                  {abTest.map((v) => (
                    <tr key={v.group} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-3">
                        <Badge tone={v.group === "A" ? "teal" : "blue"}>
                          Group {v.group}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 font-medium">{v.sent}</td>
                      <td className="py-2 pr-3">{v.opened}</td>
                      <td className="py-2 pr-3">{v.clicked}</td>
                      <td className="py-2 pr-3">{v.converted}</td>
                      <td className="py-2 pr-3 text-teal">{v.openRate ?? "—"}%</td>
                      <td className="py-2 text-admin-indigo">
                        {v.conversionRate ?? "—"}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-slate-soft">
                Variant A = direct empathy tone, Variant B = narrative
                discovery tone (per the campaign spreadsheet).
              </p>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Sequence step performance"
            subtitle="Aggregated across campaigns — prune steps with weak open rates"
          />
          {steps.length === 0 ? (
            <EmptyState
              title="No sequence data yet"
              description="Run a sequence campaign to see per-step open rates."
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={steps} margin={{ top: 16, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="step"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v: number) => `E${v}`}
                  />
                  <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(value, name) => [
                      `${value ?? ""}${name === "Open rate" ? "%" : ""}`,
                      String(name ?? ""),
                    ]}
                    labelFormatter={(v) => `Email ${v} (day ${Number(v) * 2 - 1})`}
                  />
                  <Bar dataKey="openRate" name="Open rate" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                    <LabelList
                      dataKey="sent"
                      position="top"
                      formatter={(v) => `n=${v ?? 0}`}
                      style={{ fontSize: 9, fill: "#64748b" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {!hasActivity && (
        <p className="text-center text-xs text-slate-soft">
          No campaign activity recorded yet — the numbers above will populate
          as sends happen. Daily digests go to the admin email every morning
          (08:00 UTC).
        </p>
      )}
    </div>
  );
}

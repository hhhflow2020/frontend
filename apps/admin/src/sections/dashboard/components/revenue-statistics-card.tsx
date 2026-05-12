"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { queryRevenueStatistics } from "@workspace/ui/services/admin/console";
import { unitConversion } from "@workspace/ui/utils/unit-conversions";
import { useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, XAxis } from "recharts";
import { Display } from "@/components/display";

function cents(value?: number) {
  return unitConversion("centsToDollars", value || 0);
}

function miniValue(label: string, value?: number) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 font-semibold text-lg tabular-nums">
        <Display type="currency" value={value || 0} />
      </div>
    </div>
  );
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed bg-background/45 px-4 text-center text-muted-foreground text-sm">
      {message}
    </div>
  );
}

export function RevenueStatisticsCard() {
  const { data: revenue } = useQuery({
    queryKey: ["queryRevenueStatistics"],
    queryFn: async () => {
      const { data } = await queryRevenueStatistics();
      return data.data;
    },
  });

  const monthlyData = useMemo(
    () =>
      revenue?.monthly?.list?.map((item) => ({
        date: item.date,
        new_purchase: cents(item.new_order_amount),
        repurchase: cents(item.renewal_order_amount),
        total: cents(item.amount_total),
      })) || [],
    [revenue]
  );
  const allData = useMemo(
    () =>
      revenue?.all?.list?.map((item) => ({
        date: item.date,
        new_purchase: cents(item.new_order_amount),
        repurchase: cents(item.renewal_order_amount),
        total: cents(item.amount_total),
      })) || [],
    [revenue]
  );
  const hasMonthlyData = monthlyData.some((item) => item.total > 0);
  const canShowMonthlyChart = monthlyData.length > 1 && hasMonthlyData;
  const canShowTrendChart =
    allData.length > 1 && allData.some((item) => item.total > 0);

  return (
    <Card className="self-start overflow-hidden border-border/50 bg-gradient-to-br from-background via-background to-sky-500/5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-muted-foreground text-xs">Business</div>
            <CardTitle className="mt-1 text-xl">Revenue</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-xs">Today</div>
            <div className="font-semibold text-2xl tabular-nums">
              <Display
                type="currency"
                value={revenue?.today?.amount_total || 0}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {miniValue("New Purchase", revenue?.today?.new_order_amount)}
          {miniValue("Repurchase", revenue?.today?.renewal_order_amount)}
          {miniValue("Month", revenue?.monthly?.amount_total)}
        </div>

        <div className="h-52">
          {canShowMonthlyChart ? (
            <ChartContainer
              className="h-full w-full"
              config={{
                new_purchase: {
                  label: "New Purchase",
                  color: "#0A84FF",
                },
                repurchase: {
                  label: "Repurchase",
                  color: "#34C759",
                },
              }}
            >
              <BarChart barGap={4} barSize={14} data={monthlyData}>
                <defs>
                  <linearGradient id="revenueNew" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0A84FF" stopOpacity={0.9} />
                    <stop
                      offset="100%"
                      stopColor="#0A84FF"
                      stopOpacity={0.35}
                    />
                  </linearGradient>
                  <linearGradient id="revenueRenew" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#34C759" stopOpacity={0.85} />
                    <stop offset="100%" stopColor="#34C759" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  tickFormatter={(value) => {
                    const [year, month, day] = String(value).split("-");
                    return new Date(
                      Number(year),
                      Number(month) - 1,
                      Number(day)
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  tickLine={false}
                  tickMargin={10}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: "hsl(var(--muted) / 0.35)" }}
                />
                <Bar
                  dataKey="new_purchase"
                  fill="url(#revenueNew)"
                  radius={[8, 8, 4, 4]}
                  stackId="a"
                />
                <Bar
                  dataKey="repurchase"
                  fill="url(#revenueRenew)"
                  radius={[8, 8, 0, 0]}
                  stackId="a"
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChartState
              message={
                hasMonthlyData
                  ? "More revenue history is needed to draw a trend."
                  : "No revenue data yet."
              }
            />
          )}
        </div>

        {canShowTrendChart ? (
          <div className="h-28 rounded-2xl border border-border/60 bg-background/60 p-2">
            <ChartContainer
              className="h-full w-full"
              config={{
                total: {
                  label: "Total Income",
                  color: "#5856D6",
                },
              }}
            >
              <AreaChart data={allData} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="revenueTotal" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#5856D6" stopOpacity={0.28} />
                    <stop
                      offset="100%"
                      stopColor="#5856D6"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  tickFormatter={(value) => {
                    const [year, month] = String(value).split("-");
                    return new Date(
                      Number(year),
                      Number(month) - 1
                    ).toLocaleDateString("en-US", { month: "short" });
                  }}
                  tickLine={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={false}
                />
                <Area
                  dataKey="total"
                  fill="url(#revenueTotal)"
                  stroke="#5856D6"
                  strokeWidth={2.5}
                  type="natural"
                />
              </AreaChart>
            </ChartContainer>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

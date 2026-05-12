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
import { useTranslation } from "react-i18next";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Display } from "@/components/display";

function cents(value?: number) {
  return unitConversion("centsToDollars", value || 0);
}

function miniValue(label: string, value?: number) {
  return (
    <div className="rounded-xl border bg-background/70 p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 font-semibold text-lg tabular-nums">
        <Display type="currency" value={value || 0} />
      </div>
    </div>
  );
}

export function RevenueStatisticsCard() {
  const { t, i18n } = useTranslation("dashboard");
  const locale = i18n.language;

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

  return (
    <Card className="h-full overflow-hidden border-border/60 bg-gradient-to-br from-background to-muted/30 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-muted-foreground text-xs">Business</div>
            <CardTitle className="mt-1 text-xl">
              {t("revenueTitle", "Revenue Statistics")}
            </CardTitle>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-xs">
              {t("today", "Today")}
            </div>
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
          {miniValue(
            t("newPurchase", "New Purchase"),
            revenue?.today?.new_order_amount
          )}
          {miniValue(
            t("repurchase", "Repurchase"),
            revenue?.today?.renewal_order_amount
          )}
          {miniValue(t("month", "Month"), revenue?.monthly?.amount_total)}
        </div>

        <div className="h-56">
          {monthlyData.length ? (
            <ChartContainer
              className="h-full w-full"
              config={{
                new_purchase: {
                  label: t("newPurchase", "New Purchase"),
                  color: "var(--color-chart-1)",
                },
                repurchase: {
                  label: t("repurchase", "Repurchase"),
                  color: "var(--color-chart-2)",
                },
              }}
            >
              <BarChart data={monthlyData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  tickFormatter={(value) => {
                    const [year, month, day] = String(value).split("-");
                    return new Date(
                      Number(year),
                      Number(month) - 1,
                      Number(day)
                    ).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  tickLine={false}
                  tickMargin={10}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={false}
                />
                <Bar
                  dataKey="new_purchase"
                  fill="var(--color-new_purchase)"
                  radius={[0, 0, 4, 4]}
                  stackId="a"
                />
                <Bar
                  dataKey="repurchase"
                  fill="var(--color-repurchase)"
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No revenue data
            </div>
          )}
        </div>

        <div className="h-32 rounded-xl border bg-background/60 p-2">
          {allData.length ? (
            <ChartContainer
              className="h-full w-full"
              config={{
                total: {
                  label: t("totalIncome", "Total Income"),
                  color: "var(--color-chart-3)",
                },
              }}
            >
              <AreaChart data={allData} margin={{ left: 8, right: 8 }}>
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  tickFormatter={(value) => {
                    const [year, month] = String(value).split("-");
                    return new Date(
                      Number(year),
                      Number(month) - 1
                    ).toLocaleDateString(locale, { month: "short" });
                  }}
                  tickLine={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={false}
                />
                <Area
                  dataKey="total"
                  fill="var(--color-total)"
                  fillOpacity={0.2}
                  stroke="var(--color-total)"
                  type="natural"
                />
              </AreaChart>
            </ChartContainer>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

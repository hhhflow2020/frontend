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
import { queryUserStatistics } from "@workspace/ui/services/admin/console";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts";

function miniValue(label: string, value?: number) {
  return (
    <div className="rounded-xl border bg-background/70 p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-1 font-semibold text-lg tabular-nums">
        {value || 0}
      </div>
    </div>
  );
}

export function UserStatisticsCard() {
  const { t, i18n } = useTranslation("dashboard");
  const locale = i18n.language;

  const { data: users } = useQuery({
    queryKey: ["queryUserStatistics"],
    queryFn: async () => {
      const { data } = await queryUserStatistics();
      return data.data;
    },
  });

  const monthlyData = useMemo(
    () =>
      users?.monthly?.list?.map((item) => ({
        date: item.date,
        register: item.register,
        new_purchase: item.new_order_users,
        repurchase: item.renewal_order_users,
      })) || [],
    [users]
  );
  const allData = useMemo(
    () =>
      users?.all?.list?.map((item) => ({
        date: item.date,
        register: item.register,
        new_purchase: item.new_order_users,
        repurchase: item.renewal_order_users,
      })) || [],
    [users]
  );
  const todayTotal =
    (users?.today?.register || 0) +
    (users?.today?.new_order_users || 0) +
    (users?.today?.renewal_order_users || 0);

  return (
    <Card className="h-full overflow-hidden border-border/60 bg-gradient-to-br from-background to-muted/30 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-muted-foreground text-xs">Audience</div>
            <CardTitle className="mt-1 text-xl">
              {t("userTitle", "User Statistics")}
            </CardTitle>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-xs">
              {t("today", "Today")}
            </div>
            <div className="font-semibold text-2xl tabular-nums">
              {todayTotal}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {miniValue(t("register", "Register"), users?.today?.register)}
          {miniValue(
            t("newPurchase", "New Purchase"),
            users?.today?.new_order_users
          )}
          {miniValue(
            t("repurchase", "Repurchase"),
            users?.today?.renewal_order_users
          )}
        </div>

        <div className="h-56">
          {monthlyData.length ? (
            <ChartContainer
              className="h-full w-full"
              config={{
                register: {
                  label: t("register", "Register"),
                  color: "var(--color-chart-1)",
                },
                new_purchase: {
                  label: t("newPurchase", "New Purchase"),
                  color: "var(--color-chart-2)",
                },
                repurchase: {
                  label: t("repurchase", "Repurchase"),
                  color: "var(--color-chart-3)",
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
                  dataKey="register"
                  fill="var(--color-register)"
                  radius={[0, 0, 4, 4]}
                  stackId="a"
                />
                <Bar
                  dataKey="new_purchase"
                  fill="var(--color-new_purchase)"
                  radius={0}
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
              No user data
            </div>
          )}
        </div>

        <div className="h-32 rounded-xl border bg-background/60 p-2">
          {allData.length ? (
            <ChartContainer
              className="h-full w-full"
              config={{
                register: {
                  label: t("register", "Register"),
                  color: "var(--color-chart-1)",
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
                  dataKey="register"
                  fill="var(--color-register)"
                  fillOpacity={0.2}
                  stroke="var(--color-register)"
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

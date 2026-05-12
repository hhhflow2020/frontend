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
import { Area, AreaChart, Bar, BarChart, XAxis } from "recharts";

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
    <Card className="h-full overflow-hidden border-border/50 bg-gradient-to-br from-background via-background to-violet-500/5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-muted-foreground text-xs">Audience</div>
            <CardTitle className="mt-1 text-xl">Users</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-xs">Today</div>
            <div className="font-semibold text-2xl tabular-nums">
              {todayTotal}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {miniValue("Register", users?.today?.register)}
          {miniValue("New Purchase", users?.today?.new_order_users)}
          {miniValue("Repurchase", users?.today?.renewal_order_users)}
        </div>

        <div className="h-56">
          {monthlyData.length ? (
            <ChartContainer
              className="h-full w-full"
              config={{
                register: {
                  label: "Register",
                  color: "#0A84FF",
                },
                new_purchase: {
                  label: "New Purchase",
                  color: "#AF52DE",
                },
                repurchase: {
                  label: "Repurchase",
                  color: "#FF9F0A",
                },
              }}
            >
              <BarChart barGap={4} barSize={14} data={monthlyData}>
                <defs>
                  <linearGradient id="userRegister" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0A84FF" stopOpacity={0.95} />
                    <stop
                      offset="100%"
                      stopColor="#0A84FF"
                      stopOpacity={0.45}
                    />
                  </linearGradient>
                  <linearGradient id="userNew" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#AF52DE" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#AF52DE" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="userRenew" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#FF9F0A" stopOpacity={0.95} />
                    <stop
                      offset="100%"
                      stopColor="#FF9F0A"
                      stopOpacity={0.45}
                    />
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
                  dataKey="register"
                  fill="url(#userRegister)"
                  radius={[8, 8, 4, 4]}
                  stackId="a"
                />
                <Bar
                  dataKey="new_purchase"
                  fill="url(#userNew)"
                  radius={0}
                  stackId="a"
                />
                <Bar
                  dataKey="repurchase"
                  fill="url(#userRenew)"
                  radius={[8, 8, 0, 0]}
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
                  label: "Register",
                  color: "#0A84FF",
                },
              }}
            >
              <AreaChart data={allData} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="userTotal" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0A84FF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0A84FF" stopOpacity={0} />
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
                  dataKey="register"
                  fill="url(#userTotal)"
                  stroke="#0A84FF"
                  strokeWidth={2.5}
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

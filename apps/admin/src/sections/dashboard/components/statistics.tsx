"use client";

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Badge } from "@workspace/ui/components/badge";
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
import { Separator } from "@workspace/ui/components/separator";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import Empty from "@workspace/ui/composed/empty";
import { Icon } from "@workspace/ui/composed/icon";
import { getCookie } from "@workspace/ui/lib/cookies";
import { cn } from "@workspace/ui/lib/utils";
import {
  queryServerTotalData,
  queryTicketWaitReply,
} from "@workspace/ui/services/admin/console";
import { formatBytes } from "@workspace/ui/utils/formatting";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { Display } from "@/components/display";
import { UserSubscribeDetail } from "@/sections/user/user-detail";
import { RevenueStatisticsCard } from "./revenue-statistics-card";
import SystemVersionCard from "./system-version-card";
import { UserStatisticsCard } from "./user-statistics-card";

function buildDashboardRealtimeWsUrl() {
  const base = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  const prefix = import.meta.env.VITE_API_PREFIX || "";
  const url = new URL(`${prefix}/v1/admin/console/realtime/ws`, base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const token = getCookie("Authorization");
  if (token) url.searchParams.set("token", token);
  return url.toString();
}

function formatBitrate(value?: number) {
  if (!value) return "0 bps";
  return `${formatBytes(value / 8).replace("B", "b")}ps`;
}

function formatPercent(value?: number) {
  return `${((value || 0) as number).toFixed(1)}%`;
}

function MiniMetric(props: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: string;
  tone?: "blue" | "green" | "orange" | "red" | "violet";
  href?: string;
}) {
  const toneMap = {
    blue: "from-blue-500/15 text-blue-600 dark:text-blue-300",
    green: "from-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    orange: "from-orange-500/15 text-orange-600 dark:text-orange-300",
    red: "from-red-500/15 text-red-600 dark:text-red-300",
    violet: "from-violet-500/15 text-violet-600 dark:text-violet-300",
  };
  const content = (
    <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-background to-muted/30 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-muted-foreground text-xs">{props.label}</div>
            <div className="mt-2 truncate font-semibold text-2xl tracking-tight">
              {props.value}
            </div>
            {props.sub ? (
              <div className="mt-1 truncate text-muted-foreground text-xs">
                {props.sub}
              </div>
            ) : null}
          </div>
          {props.icon ? (
            <div
              className={cn(
                "rounded-2xl bg-gradient-to-br to-transparent p-2",
                toneMap[props.tone || "blue"]
              )}
            >
              <Icon className="h-5 w-5" icon={props.icon} />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
  if (!props.href) return content;
  return (
    <Link to={props.href}>
      <div className="hover:-translate-y-0.5 transition-transform">
        {content}
      </div>
    </Link>
  );
}

function LiveOperations({
  realtime,
}: {
  realtime?: API.DashboardRealtimeResponse;
}) {
  const alerts = realtime?.alerts || [];
  const hasRisk =
    (realtime?.servers.config_failed || 0) > 0 ||
    (realtime?.servers.xray_stopped || 0) > 0 ||
    alerts.length > 0;
  return (
    <Card className="border-border/60 bg-gradient-to-br from-background via-background to-muted/40 shadow-sm">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Live Operations</CardTitle>
          <div className="mt-1 text-muted-foreground text-xs">
            WebSocket realtime health, network and connection summary
          </div>
        </div>
        <Badge variant={hasRisk ? "destructive" : "secondary"}>
          {hasRisk ? "Attention" : "Healthy"}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-background/70 p-4">
          <div className="text-muted-foreground text-xs">Servers</div>
          <div className="mt-2 font-semibold text-2xl">
            {realtime?.servers.online || 0}/{realtime?.servers.total || 0}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
            <span className="text-muted-foreground">Xray running</span>
            <span className="text-right">
              {realtime?.servers.xray_running || 0}
            </span>
            <span className="text-muted-foreground">Config failed</span>
            <span className="text-right">
              {realtime?.servers.config_failed || 0}
            </span>
          </div>
        </div>
        <div className="rounded-xl border bg-background/70 p-4">
          <div className="text-muted-foreground text-xs">Network</div>
          <div className="mt-2 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">System</span>
              <span>
                ↑ {formatBitrate(realtime?.network.system_tx_bps)} ↓{" "}
                {formatBitrate(realtime?.network.system_rx_bps)}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Xray</span>
              <span>
                ↑ {formatBitrate(realtime?.network.xray_tx_bps)} ↓{" "}
                {formatBitrate(realtime?.network.xray_rx_bps)}
              </span>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-background/70 p-4">
          <div className="text-muted-foreground text-xs">Connections</div>
          <div className="mt-2 grid grid-cols-[52px_1fr_1fr] gap-1 text-sm">
            <span />
            <span className="text-muted-foreground">In</span>
            <span className="text-muted-foreground">Out</span>
            <span className="text-muted-foreground">Sys</span>
            <span>{realtime?.connections.system_inbound || 0}</span>
            <span>{realtime?.connections.system_outbound || 0}</span>
            <span className="text-muted-foreground">Xray</span>
            <span>{realtime?.connections.xray_inbound || 0}</span>
            <span>{realtime?.connections.xray_outbound || 0}</span>
          </div>
        </div>
        <div className="rounded-xl border bg-background/70 p-4">
          <div className="text-muted-foreground text-xs">Resources</div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-semibold">
                {formatPercent(realtime?.resources.avg_cpu)}
              </div>
              <div className="text-muted-foreground text-xs">CPU</div>
            </div>
            <div>
              <div className="font-semibold">
                {formatPercent(realtime?.resources.avg_mem)}
              </div>
              <div className="text-muted-foreground text-xs">MEM</div>
            </div>
            <div>
              <div className="font-semibold">
                {formatPercent(realtime?.resources.avg_disk)}
              </div>
              <div className="text-muted-foreground text-xs">DISK</div>
            </div>
          </div>
          <div className="mt-2 text-muted-foreground text-xs">
            Max: CPU {formatPercent(realtime?.resources.max_cpu)} / MEM{" "}
            {formatPercent(realtime?.resources.max_mem)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsCard({
  realtime,
}: {
  realtime?: API.DashboardRealtimeResponse;
}) {
  const alerts = (realtime?.alerts || []).slice(0, 5);
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Needs Attention</CardTitle>
        <Badge variant={alerts.length ? "destructive" : "secondary"}>
          {alerts.length ? alerts.length : "Clear"}
        </Badge>
      </CardHeader>
      <CardContent>
        {alerts.length ? (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                className="rounded-xl border bg-muted/30 p-3"
                key={`${alert.server_id || "system"}-${alert.title}-${index}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-sm">{alert.title}</div>
                  <Badge
                    variant={
                      alert.level === "critical" ? "destructive" : "outline"
                    }
                  >
                    {alert.level}
                  </Badge>
                </div>
                <div className="mt-1 text-muted-foreground text-xs">
                  {alert.server_id ? `Server #${alert.server_id}` : "System"}
                  {alert.message ? ` · ${alert.message}` : ""}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center">
            <Empty />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const iconMap: Record<string, string> = {
    login: "uil:signin",
    register: "uil:user-plus",
    order: "uil:shopping-bag",
    ticket: "uil:comment-alt-notes",
  };
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
      <Icon
        className="h-4 w-4 text-muted-foreground"
        icon={iconMap[type] || "uil:bell"}
      />
    </div>
  );
}

function LiveActivityCard({
  realtime,
}: {
  realtime?: API.DashboardRealtimeResponse;
}) {
  const activities = (realtime?.activities || []).slice(0, 8);
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Live Activity</CardTitle>
          <div className="mt-1 text-muted-foreground text-xs">
            Logins, orders, registrations and tickets
          </div>
        </div>
        <Badge variant="outline">{activities.length}</Badge>
      </CardHeader>
      <CardContent>
        {activities.length ? (
          <div className="space-y-3">
            {activities.map((item) => (
              <div className="flex gap-3" key={item.id}>
                <ActivityIcon type={item.type} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-sm">
                        {item.title}
                      </div>
                      <div className="truncate text-muted-foreground text-xs">
                        {item.subject || "Unknown user"}
                      </div>
                    </div>
                    <div className="shrink-0 text-muted-foreground text-xs">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleTimeString()
                        : "--"}
                    </div>
                  </div>
                  {item.detail ? (
                    <div className="mt-1 truncate text-xs">{item.detail}</div>
                  ) : null}
                  <div className="mt-1 flex items-center gap-2">
                    {item.status ? (
                      <Badge
                        variant={
                          item.status === "failed" ? "destructive" : "outline"
                        }
                      >
                        {item.status}
                      </Badge>
                    ) : null}
                    {item.amount ? (
                      <span className="text-muted-foreground text-xs">
                        <Display type="currency" value={item.amount} />
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center">
            <Empty />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Statistics() {
  const { t } = useTranslation("dashboard");
  const [realtime, setRealtime] = useState<API.DashboardRealtimeResponse>();
  const [trafficTimeFrames, setTrafficTimeFrames] = useState<
    Record<"nodes" | "users", "today" | "yesterday">
  >({
    nodes: "today",
    users: "today",
  });

  const { data: TicketTotal } = useQuery({
    queryKey: ["queryTicketWaitReply"],
    queryFn: async () => {
      const { data } = await queryTicketWaitReply();
      return data.data?.count;
    },
  });
  const { data: ServerTotal } = useQuery({
    queryKey: ["queryServerTotalData"],
    queryFn: async () => {
      const { data } = await queryServerTotalData();
      return data.data;
    },
  });

  useEffect(() => {
    if (!getCookie("Authorization")) return;
    const ws = new WebSocket(buildDashboardRealtimeWsUrl());
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "dashboard_realtime") {
          setRealtime(message);
        }
      } catch {
        // Ignore malformed realtime dashboard messages.
      }
    };
    return () => ws.close();
  }, []);

  const trafficData = useMemo(
    () => ({
      nodes: {
        today:
          ServerTotal?.server_traffic_ranking_today?.map((item) => ({
            name: item.name,
            traffic: item.download + item.upload,
          })) || [],
        yesterday:
          ServerTotal?.server_traffic_ranking_yesterday?.map((item) => ({
            name: item.name,
            traffic: item.download + item.upload,
          })) || [],
      },
      users: {
        today:
          ServerTotal?.user_traffic_ranking_today?.map((item) => ({
            name: item.sid,
            traffic: item.download + item.upload,
          })) || [],
        yesterday:
          ServerTotal?.user_traffic_ranking_yesterday?.map((item) => ({
            name: item.sid,
            traffic: item.download + item.upload,
          })) || [],
      },
    }),
    [ServerTotal]
  );

  const TrafficRankCard = ({ type }: { type: "nodes" | "users" }) => {
    const timeFrame = trafficTimeFrames[type];
    const currentData = trafficData[type][timeFrame];

    return (
      <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-background via-background to-muted/30 shadow-sm">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            {type === "nodes" ? "Node Traffic" : "User Traffic"}
          </CardTitle>
          <Tabs
            onValueChange={(value) =>
              setTrafficTimeFrames((prev) => ({
                ...prev,
                [type]: value as "today" | "yesterday",
              }))
            }
            value={timeFrame}
          >
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="h-80">
          {currentData.length > 0 ? (
            <ChartContainer
              className="max-h-80"
              config={{
                traffic: {
                  label: "Traffic",
                  color: "#0A84FF",
                },
                type: {
                  label: "Type",
                  color: "var(--muted-foreground)",
                },
                label: {
                  color: "var(--foreground)",
                },
              }}
            >
              <BarChart data={currentData} height={400} layout="vertical">
                <defs>
                  <linearGradient
                    id={`${type}Traffic`}
                    x1="0"
                    x2="1"
                    y1="0"
                    y2="0"
                  >
                    <stop offset="0%" stopColor="#0A84FF" stopOpacity={0.45} />
                    <stop
                      offset="100%"
                      stopColor="#0A84FF"
                      stopOpacity={0.95}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  axisLine={false}
                  tickFormatter={(value) => formatBytes(value || 0)}
                  tickLine={false}
                  type="number"
                />
                <YAxis
                  axisLine={false}
                  dataKey="name"
                  interval={0}
                  tickFormatter={(_value, index) => String(index + 1)}
                  tickLine={false}
                  tickMargin={0}
                  type="category"
                  width={15}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatBytes(Number(value) || 0)}
                      label={true}
                      labelFormatter={(label, [payload]) =>
                        type === "nodes" ? (
                          `Node: ${label}`
                        ) : (
                          <>
                            <div className="w-80">
                              <UserSubscribeDetail
                                enabled={true}
                                id={payload?.payload.name}
                              />
                            </div>
                            <Separator className="my-2" />
                            <div>{`User: ${label}`}</div>
                          </>
                        )
                      }
                    />
                  }
                  trigger="hover"
                />
                <Bar
                  dataKey="traffic"
                  fill={`url(#${type}Traffic)`}
                  radius={[0, 8, 8, 0]}
                >
                  <LabelList
                    className="fill-foreground"
                    dataKey="name"
                    fontSize={12}
                    offset={8}
                    position="insideLeft"
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Empty />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const todayTraffic =
    (ServerTotal?.today_upload || 0) + (ServerTotal?.today_download || 0);
  const monthlyTraffic =
    (ServerTotal?.monthly_upload || 0) + (ServerTotal?.monthly_download || 0);
  const totalServers =
    realtime?.servers.total ||
    (ServerTotal?.online_servers || 0) + (ServerTotal?.offline_servers || 0);

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border bg-gradient-to-br from-background via-muted/30 to-primary/5 p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-muted-foreground text-sm">Dashboard</div>
            <h1 className="font-semibold text-3xl tracking-tight">
              Control Center
            </h1>
          </div>
          <div className="text-muted-foreground text-xs">
            Live updated{" "}
            {realtime?.updated_at
              ? new Date(realtime.updated_at).toLocaleTimeString()
              : "--"}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MiniMetric
            href="/dashboard/user"
            icon="uil:users-alt"
            label={t("onlineUsersCount", "Online Users")}
            sub={t("currentlyOnline", "Currently Online")}
            tone="blue"
            value={realtime?.online_users || ServerTotal?.online_users || 0}
          />
          <MiniMetric
            icon="uil:exchange-alt"
            label={t("todayTraffic", "Today Traffic")}
            sub={`↑${formatBytes(ServerTotal?.today_upload || 0)} ↓${formatBytes(ServerTotal?.today_download || 0)}`}
            tone="violet"
            value={formatBytes(todayTraffic)}
          />
          <MiniMetric
            href="/dashboard/servers"
            icon="uil:server-network"
            label={t("totalServers", "Total Servers")}
            sub={`${realtime?.servers.online || ServerTotal?.online_servers || 0} online · ${realtime?.servers.offline || ServerTotal?.offline_servers || 0} offline`}
            tone={realtime?.servers.config_failed || 0 ? "red" : "green"}
            value={totalServers}
          />
          <MiniMetric
            href="/dashboard/ticket"
            icon="uil:clipboard-notes"
            label={t("pendingTickets", "Pending Tickets")}
            sub={t("pending", "Pending")}
            tone={(TicketTotal || 0) > 0 ? "orange" : "green"}
            value={TicketTotal || 0}
          />
        </div>
      </div>

      <LiveOperations realtime={realtime} />

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4 md:grid-cols-2">
          <RevenueStatisticsCard />
          <UserStatisticsCard />
        </div>
        <div className="space-y-4">
          <LiveActivityCard realtime={realtime} />
          <AlertsCard realtime={realtime} />
          <MiniMetric
            icon="uil:cloud-data-connection"
            label={t("monthTraffic", "Month Traffic")}
            sub={`↑${formatBytes(ServerTotal?.monthly_upload || 0)} ↓${formatBytes(ServerTotal?.monthly_download || 0)}`}
            tone="orange"
            value={formatBytes(monthlyTraffic)}
          />
          <SystemVersionCard />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TrafficRankCard type="nodes" />
        <TrafficRankCard type="users" />
      </div>
    </div>
  );
}

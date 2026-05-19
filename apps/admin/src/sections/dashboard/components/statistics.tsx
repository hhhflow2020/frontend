"use client";

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
import { Icon } from "@workspace/ui/composed/icon";
import { getAuthorizationToken } from "@workspace/ui/lib/auth-token";
import { getApiBaseURL, getApiPrefix } from "@workspace/ui/lib/runtime-config";
import { cn } from "@workspace/ui/lib/utils";
import { formatBytes } from "@workspace/ui/utils/formatting";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  LabelList,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Display } from "@/components/display";
import { UserSubscribeDetail } from "@/sections/user/user-detail";
import { RevenueStatisticsCard } from "./revenue-statistics-card";
import { UserStatisticsCard } from "./user-statistics-card";

function buildDashboardRealtimeWsUrl() {
  const base = getApiBaseURL() || window.location.origin;
  const prefix = getApiPrefix();
  const url = new URL(`${prefix}/v1/admin/console/realtime/ws`, base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const token = getAuthorizationToken();
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

const ALERT_TITLE_KEYS: Record<string, string> = {
  "Config apply failed": "alerts.titles.configApplyFailed",
  "High resource usage": "alerts.titles.highResourceUsage",
  "Server offline": "alerts.titles.serverOffline",
  "Xray stats error": "alerts.titles.xrayStatsError",
  "Xray stopped": "alerts.titles.xrayStopped",
};

const ACTIVITY_TITLE_KEYS: Record<string, string> = {
  "New registration": "activity.title.newRegistration",
  "Balance recharged": "activity.title.balanceRecharged",
  "Membership opened": "activity.title.membershipOpened",
  "Order updated": "activity.title.orderUpdated",
  "Subscription pulled": "activity.title.subscriptionPulled",
  "Subscription purchased": "activity.title.subscriptionPurchased",
  "Subscription renewed": "activity.title.subscriptionRenewed",
  "Traffic reset": "activity.title.trafficReset",
  "User login": "activity.title.userLogin",
  "User logout": "activity.title.userLogout",
};

type OnlineRange = "1d" | "7d";

type DashboardRealtimePatch = Partial<
  Omit<
    API.DashboardRealtimeResponse,
    | "business"
    | "connections"
    | "network"
    | "online_user_series"
    | "resources"
    | "servers"
    | "traffic"
  >
> & {
  business?: Partial<API.DashboardRealtimeResponse["business"]>;
  connections?: Partial<API.DashboardRealtimeResponse["connections"]>;
  full?: boolean;
  network?: Partial<API.DashboardRealtimeResponse["network"]>;
  online_user_series?: Partial<
    API.DashboardRealtimeResponse["online_user_series"]
  >;
  resources?: Partial<API.DashboardRealtimeResponse["resources"]>;
  servers?: Partial<API.DashboardRealtimeResponse["servers"]>;
  traffic?: Partial<API.DashboardRealtimeResponse["traffic"]>;
};

const MINUTE_MS = 60 * 1000;
const ACTIVITY_LIMIT = 50;

function appendRealtimeValuePoint(
  points: Array<{ timestamp: number; value: number }> | undefined,
  point: { timestamp: number; value: number },
  cutoff: number
) {
  const next = [...(points || [])];
  const last = next.at(-1);
  if (
    last &&
    Math.floor(last.timestamp / MINUTE_MS) ===
      Math.floor(point.timestamp / MINUTE_MS)
  ) {
    next[next.length - 1] = point;
  } else {
    next.push(point);
  }
  return next.filter((item) => item.timestamp >= cutoff);
}

function appendRealtimeTrafficPoint(
  points: API.DashboardRealtimeResponse["traffic"]["today_series"] | undefined,
  point: API.DashboardRealtimeResponse["traffic"]["today_series"][number],
  cutoff: number
) {
  const next = [...(points || [])];
  const last = next.at(-1);
  if (
    last &&
    Math.floor(last.timestamp / MINUTE_MS) ===
      Math.floor(point.timestamp / MINUTE_MS)
  ) {
    next[next.length - 1] = point;
  } else {
    next.push(point);
  }
  return next.filter((item) => item.timestamp >= cutoff);
}

function mergeDashboardRealtime(
  previous: API.DashboardRealtimeResponse,
  patch: DashboardRealtimePatch
): API.DashboardRealtimeResponse {
  const updatedAt = patch.updated_at || Date.now();
  const dayStart = new Date(updatedAt);
  dayStart.setHours(0, 0, 0, 0);
  const nextOnlineUsers = patch.online_users ?? previous.online_users;
  const nextTraffic = {
    ...previous.traffic,
    ...(patch.traffic || {}),
  };

  return {
    ...previous,
    ...patch,
    activities: patch.activities ?? previous.activities,
    alerts: patch.alerts ?? previous.alerts,
    business: {
      ...previous.business,
      ...(patch.business || {}),
    },
    connections: {
      ...previous.connections,
      ...(patch.connections || {}),
    },
    network: {
      ...previous.network,
      ...(patch.network || {}),
    },
    online_user_series: {
      last_7_days: appendRealtimeValuePoint(
        patch.online_user_series?.last_7_days ??
          previous.online_user_series?.last_7_days,
        { timestamp: updatedAt, value: nextOnlineUsers },
        updatedAt - 7 * 24 * 60 * 60 * 1000
      ),
      last_day: appendRealtimeValuePoint(
        patch.online_user_series?.last_day ??
          previous.online_user_series?.last_day,
        { timestamp: updatedAt, value: nextOnlineUsers },
        updatedAt - 24 * 60 * 60 * 1000
      ),
    },
    online_users: nextOnlineUsers,
    resources: {
      ...previous.resources,
      ...(patch.resources || {}),
    },
    servers: {
      ...previous.servers,
      ...(patch.servers || {}),
    },
    traffic: {
      ...nextTraffic,
      today_series: appendRealtimeTrafficPoint(
        patch.traffic?.today_series ?? previous.traffic?.today_series,
        {
          download: nextTraffic.today_download,
          timestamp: updatedAt,
          total: nextTraffic.today_upload + nextTraffic.today_download,
          upload: nextTraffic.today_upload,
        },
        dayStart.getTime()
      ),
    },
    updated_at: updatedAt,
  };
}

function ensureValueSeries(
  points: Array<{ timestamp: number; value: number }> | undefined,
  value: number,
  spanMs: number,
  updatedAt?: number
) {
  const data =
    points?.map((item) => ({
      timestamp: item.timestamp,
      value: item.value,
    })) || [];
  if (data.length > 1) return data;
  const now = updatedAt || Date.now();
  const current = data[0] || { timestamp: now, value };
  return [
    {
      timestamp: Math.max(0, current.timestamp - spanMs),
      value: current.value,
    },
    current,
  ];
}

function ensureTrafficSeries(
  points: API.DashboardRealtimeResponse["traffic"]["today_series"] | undefined,
  upload: number,
  download: number,
  updatedAt?: number
) {
  const data =
    points?.map((item) => ({
      download: item.download,
      timestamp: item.timestamp,
      total: item.total,
      upload: item.upload,
    })) || [];
  if (data.length > 1) return data;
  const current = data[0] || {
    download,
    timestamp: updatedAt || Date.now(),
    total: upload + download,
    upload,
  };
  const start = new Date(current.timestamp);
  start.setHours(0, 0, 0, 0);
  return [
    { download: 0, timestamp: start.getTime(), total: 0, upload: 0 },
    current,
  ];
}

function OverviewTile(props: {
  icon: string;
  label: string;
  sub?: string;
  tone: "blue" | "green" | "orange" | "red" | "violet";
  value: string | number;
}) {
  const toneMap = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-300",
    red: "bg-red-500/10 text-red-600 dark:text-red-300",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  };
  return (
    <div className="min-w-0 rounded-2xl border border-border/60 bg-background/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[11px] text-muted-foreground">
            {props.label}
          </div>
          <div className="mt-1 truncate font-semibold text-lg tracking-tight">
            {props.value}
          </div>
          {props.sub ? (
            <div className="mt-1 truncate text-[11px] text-muted-foreground">
              {props.sub}
            </div>
          ) : null}
        </div>
        <div className={cn("rounded-xl p-2", toneMap[props.tone])}>
          <Icon className="h-4 w-4" icon={props.icon} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed bg-background/45 px-4 text-center text-muted-foreground text-sm">
      {message}
    </div>
  );
}

function RealtimeOverview({
  connected,
  realtime,
}: {
  connected: boolean;
  realtime?: API.DashboardRealtimeResponse;
}) {
  const { t, i18n } = useTranslation("dashboard");
  const [onlineRange, setOnlineRange] = useState<OnlineRange>("1d");
  const alerts = realtime?.alerts || [];
  const hasRisk =
    (realtime?.servers.config_failed || 0) > 0 ||
    (realtime?.servers.xray_stopped || 0) > 0 ||
    alerts.length > 0;
  const todayUpload = realtime?.traffic?.today_upload ?? 0;
  const todayDownload = realtime?.traffic?.today_download ?? 0;
  const todayTraffic = todayUpload + todayDownload;
  const monthlyUpload = realtime?.traffic?.monthly_upload ?? 0;
  const monthlyDownload = realtime?.traffic?.monthly_download ?? 0;
  const monthlyTraffic = monthlyUpload + monthlyDownload;
  const onlineUsers = realtime?.online_users ?? 0;
  const totalServers = realtime?.servers.total ?? 0;
  const onlineServers = realtime?.servers.online ?? 0;
  const offlineServers = realtime?.servers.offline ?? 0;
  const pendingTickets = realtime?.pending_tickets ?? 0;
  const updatedAt = realtime?.updated_at
    ? new Date(realtime.updated_at).toLocaleTimeString(i18n.language, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--";
  const onlineSeries = ensureValueSeries(
    onlineRange === "1d"
      ? realtime?.online_user_series?.last_day
      : realtime?.online_user_series?.last_7_days,
    onlineUsers,
    onlineRange === "1d" ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    realtime?.updated_at
  );
  const trafficSeries = ensureTrafficSeries(
    realtime?.traffic?.today_series,
    todayUpload,
    todayDownload,
    realtime?.updated_at
  );
  const timeFormatter = (value: number) =>
    new Date(Number(value)).toLocaleDateString(i18n.language, {
      day: "numeric",
      hour: onlineRange === "1d" ? "2-digit" : undefined,
      minute: onlineRange === "1d" ? "2-digit" : undefined,
      month: "short",
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-lg">
            {t("operationsPulse", "Operations Pulse")}
          </h2>
          <div className="mt-1 truncate text-muted-foreground text-xs">
            {t("updatedAt", "Updated")} {updatedAt}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex h-7 items-center rounded-full px-2.5 font-medium",
              connected
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                : "bg-muted text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "mr-1.5 inline-block size-1.5 rounded-full",
                connected ? "bg-emerald-500" : "bg-muted-foreground"
              )}
            />
            {connected ? t("live", "Live") : t("reconnecting", "Reconnecting")}
          </span>
          <span
            className={cn(
              "inline-flex h-7 items-center rounded-full px-2.5 font-medium",
              hasRisk
                ? "bg-red-500/10 text-red-600 dark:text-red-300"
                : "bg-blue-500/10 text-blue-600 dark:text-blue-300"
            )}
          >
            {hasRisk ? t("attention", "Attention") : t("healthy", "Healthy")}
          </span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
        <OverviewTile
          icon="uil:exchange-alt"
          label={t("trafficToday", "Traffic today")}
          sub={`${t("uploadShort", "Up")} ${formatBytes(todayUpload)} · ${t("downloadShort", "Down")} ${formatBytes(todayDownload)}`}
          tone="blue"
          value={formatBytes(todayTraffic)}
        />
        <OverviewTile
          icon="uil:cloud-data-connection"
          label={t("trafficMonth", "Traffic month")}
          sub={`${t("uploadShort", "Up")} ${formatBytes(monthlyUpload)} · ${t("downloadShort", "Down")} ${formatBytes(monthlyDownload)}`}
          tone="violet"
          value={formatBytes(monthlyTraffic)}
        />
        <OverviewTile
          icon="uil:user-check"
          label={t("onlineNow", "Online now")}
          sub={t("realtimeUsers", "Realtime users")}
          tone="green"
          value={onlineUsers}
        />
        <OverviewTile
          icon="uil:server-network"
          label={t("nodeHealth", "Node health")}
          sub={`${onlineServers} ${t("online", "online")} · ${offlineServers} ${t("offline", "offline")}`}
          tone={hasRisk ? "red" : "green"}
          value={`${onlineServers}/${totalServers}`}
        />
        <OverviewTile
          icon="uil:clipboard-notes"
          label={t("workOrders", "Work orders")}
          sub={t("awaitingAction", "Awaiting action")}
          tone={pendingTickets > 0 ? "orange" : "green"}
          value={pendingTickets}
        />
        <OverviewTile
          icon="uil:processor"
          label={t("resourceLoad", "Resource load")}
          sub={`MEM ${formatPercent(realtime?.resources.avg_mem)} · ${t("network", "Network")} ${formatBitrate(realtime?.network.system_rx_bps)}`}
          tone="orange"
          value={`CPU ${formatPercent(realtime?.resources.avg_cpu)}`}
        />
      </div>

      <div className="grid items-start gap-3 xl:grid-cols-2">
        <Card className="self-start overflow-hidden rounded-3xl border border-white/10 bg-background/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:bg-background/40">
          <CardHeader className="flex-row items-center justify-between gap-3 pb-2">
            <div className="min-w-0">
              <CardTitle className="truncate text-base">
                {t("trafficCurve", "Traffic curve")}
              </CardTitle>
              <div className="mt-1 truncate text-muted-foreground text-xs">
                {t("today", "Today")} · {formatBytes(todayTraffic)}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5 text-xs">
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-600 dark:text-emerald-300">
                {t("uploadShort", "Up")} {formatBytes(todayUpload)}
              </span>
              <span className="rounded-full bg-blue-500/10 px-2.5 py-1 font-medium text-blue-600 dark:text-blue-300">
                {t("downloadShort", "Down")} {formatBytes(todayDownload)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-40">
              <ChartContainer
                className="h-full w-full"
                config={{
                  total: {
                    label: t("traffic", "Traffic"),
                    color: "#0A84FF",
                  },
                }}
              >
                <AreaChart
                  data={trafficSeries}
                  margin={{ bottom: 0, left: 8, right: 12, top: 4 }}
                >
                  <defs>
                    <linearGradient
                      id="dashboardTrafficTotal"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#0A84FF"
                        stopOpacity={0.32}
                      />
                      <stop
                        offset="100%"
                        stopColor="#0A84FF"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    axisLine={false}
                    dataKey="timestamp"
                    height={24}
                    minTickGap={28}
                    tickFormatter={(value) =>
                      new Date(Number(value)).toLocaleTimeString(
                        i18n.language,
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )
                    }
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickFormatter={(value) => formatBytes(Number(value) || 0)}
                    tickLine={false}
                    width={54}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatBytes(Number(value) || 0)}
                        labelFormatter={(value) =>
                          new Date(Number(value)).toLocaleTimeString(
                            i18n.language
                          )
                        }
                      />
                    }
                    cursor={{ stroke: "hsl(var(--border))" }}
                  />
                  <Area
                    dataKey="total"
                    fill="url(#dashboardTrafficTotal)"
                    stroke="#0A84FF"
                    strokeWidth={2.5}
                    type="monotone"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="self-start overflow-hidden rounded-3xl border border-white/10 bg-background/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:bg-background/40">
          <CardHeader className="flex-row items-center justify-between gap-3 pb-2">
            <div className="min-w-0">
              <CardTitle className="truncate text-base">
                {t("onlineCurve", "Online curve")}
              </CardTitle>
              <div className="mt-1 truncate text-muted-foreground text-xs">
                {t("onlineNow", "Online now")} · {onlineUsers}
              </div>
            </div>
            <Tabs
              onValueChange={(value) => setOnlineRange(value as OnlineRange)}
              value={onlineRange}
            >
              <TabsList>
                <TabsTrigger value="1d">{t("last1Day", "1 day")}</TabsTrigger>
                <TabsTrigger value="7d">{t("last7Days", "7 days")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-40">
              <ChartContainer
                className="h-full w-full"
                config={{
                  value: {
                    label: t("onlineUsersCount", "Online Users"),
                    color: "#34C759",
                  },
                }}
              >
                <LineChart
                  data={onlineSeries}
                  margin={{ bottom: 0, left: 6, right: 8, top: 4 }}
                >
                  <XAxis
                    axisLine={false}
                    dataKey="timestamp"
                    height={24}
                    minTickGap={24}
                    tickFormatter={(value) => timeFormatter(Number(value))}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ stroke: "hsl(var(--border))" }}
                    labelFormatter={(value) =>
                      new Date(Number(value)).toLocaleString(i18n.language)
                    }
                  />
                  <Line
                    dataKey="value"
                    dot={false}
                    stroke="#34C759"
                    strokeWidth={2.2}
                    type="monotone"
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AlertsCard({
  realtime,
}: {
  realtime?: API.DashboardRealtimeResponse;
}) {
  const { t } = useTranslation("dashboard");
  const alerts = (realtime?.alerts || []).slice(0, 5);
  return (
    <Card className="rounded-3xl border border-white/10 bg-background/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:bg-background/40">
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="min-w-0 truncate whitespace-nowrap">
          {t("alerts.heading", "Alerts")}
        </CardTitle>
        <Badge
          className="shrink-0 whitespace-nowrap"
          variant={alerts.length ? "destructive" : "secondary"}
        >
          {alerts.length ? alerts.length : t("clear", "Clear")}
        </Badge>
      </CardHeader>
      <CardContent>
        {alerts.length ? (
          <div className="space-y-1.5">
            {alerts.map((alert, index) => {
              const titleKey = ALERT_TITLE_KEYS[alert.title];
              return (
                <div
                  className="flex h-10 min-w-0 items-center gap-2 overflow-hidden rounded-xl border bg-muted/30 px-2.5"
                  key={`${alert.server_id || "system"}-${alert.title}-${index}`}
                >
                  <div className="min-w-0 flex-1 truncate whitespace-nowrap text-sm">
                    <span className="font-medium">
                      {titleKey ? t(titleKey, alert.title) : alert.title}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      ·{" "}
                      {alert.server_id
                        ? `${t("server", "Server")} #${alert.server_id}`
                        : t("system", "System")}
                      {alert.message ? ` · ${alert.message}` : ""}
                    </span>
                  </div>
                  <Badge
                    className="h-6 shrink-0 whitespace-nowrap"
                    variant={
                      alert.level === "critical" ? "destructive" : "outline"
                    }
                  >
                    {t(`alerts.level.${alert.level}`, alert.level)}
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState message={t("empty.noAlerts", "No alerts right now.")} />
        )}
      </CardContent>
    </Card>
  );
}

function ActivityIcon({ status, type }: { status?: string; type: string }) {
  const iconMap: Record<string, string> = {
    login: "uil:signin",
    logout: "uil:signout",
    register: "uil:user-plus",
    order: "uil:shopping-bag",
    purchase: "uil:shopping-bag",
    renewal: "uil:redo",
    membership: "uil:award",
    reset_traffic: "uil:sync",
    recharge: "uil:wallet",
    subscribe_pull: "uil:link",
  };
  const toneMap: Record<string, string> = {
    closed: "bg-zinc-500/10 text-zinc-500",
    failed: "bg-red-500/10 text-red-500",
    finished: "bg-emerald-500/10 text-emerald-500",
    success: "bg-emerald-500/10 text-emerald-500",
    completed: "bg-emerald-500/10 text-emerald-500",
    paid: "bg-blue-500/10 text-blue-500",
    pending: "bg-orange-500/10 text-orange-500",
  };
  return (
    <div
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
        status ? toneMap[status] : ""
      )}
    >
      <Icon className="h-3.5 w-3.5" icon={iconMap[type] || "uil:bell"} />
    </div>
  );
}

function LiveActivityCard({
  connected,
  realtime,
}: {
  connected: boolean;
  realtime?: API.DashboardRealtimeResponse;
}) {
  const { t, i18n } = useTranslation("dashboard");
  const activities = (realtime?.activities || []).slice(0, ACTIVITY_LIMIT);
  const formatSubject = (subject?: string) => {
    if (!subject || subject === "Unknown user") {
      return t("activity.unknownUser", "Unknown user");
    }
    if (subject.startsWith("User #")) {
      return `${t("user", "User")} #${subject.slice("User #".length)}`;
    }
    return subject;
  };
  const formatDetail = (detail?: string) => {
    if (detail === "Balance recharge") {
      return t("activity.detail.balanceRecharge", "Balance recharge");
    }
    return detail;
  };
  const activityTone = (type: string) => {
    const toneMap: Record<string, string> = {
      login: "border-emerald-500/15 bg-emerald-500/10",
      logout: "border-zinc-500/15 bg-zinc-500/10",
      membership: "border-violet-500/15 bg-violet-500/10",
      purchase: "border-blue-500/15 bg-blue-500/10",
      recharge: "border-sky-500/15 bg-sky-500/10",
      register: "border-cyan-500/15 bg-cyan-500/10",
      renewal: "border-green-500/15 bg-green-500/10",
      reset_traffic: "border-orange-500/15 bg-orange-500/10",
      subscribe_pull: "border-amber-500/15 bg-amber-500/10",
    };
    return toneMap[type] || "border-border/60 bg-muted/30";
  };
  return (
    <Card className="rounded-3xl border border-white/10 bg-background/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:bg-background/40">
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <div className="min-w-0">
          <CardTitle className="truncate whitespace-nowrap">
            {t("recentActivity", "Recent Activity")}
          </CardTitle>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge
            className="whitespace-nowrap"
            variant={connected ? "secondary" : "outline"}
          >
            <span
              className={cn(
                "mr-1.5 inline-block size-1.5 rounded-full",
                connected ? "bg-emerald-500" : "bg-muted-foreground"
              )}
            />
            {connected ? t("live", "Live") : t("reconnecting", "Reconnecting")}
          </Badge>
          <Badge variant="outline">{activities.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length ? (
          <div className="max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
            {activities.map((item) => {
              const titleKey = ACTIVITY_TITLE_KEYS[item.title];
              return (
                <div
                  className={cn(
                    "flex h-10 min-w-0 items-center gap-2 overflow-hidden rounded-xl border px-2.5",
                    activityTone(item.type)
                  )}
                  key={item.id}
                >
                  <ActivityIcon status={item.status} type={item.type} />
                  <div className="min-w-0 flex-1 truncate whitespace-nowrap text-[13px]">
                    <span className="whitespace-nowrap font-medium">
                      {titleKey ? t(titleKey, item.title) : item.title}
                    </span>
                    <span className="whitespace-nowrap text-muted-foreground">
                      {" "}
                      · {formatSubject(item.subject)}
                      {item.detail ? ` · ${formatDetail(item.detail)}` : ""}
                    </span>
                    {(item as any).ip ? (
                      <span className="whitespace-nowrap text-muted-foreground">
                        {" "}
                        · {t("ip", "IP")} {(item as any).ip}
                      </span>
                    ) : null}
                    {(item as any).location ? (
                      <span className="whitespace-nowrap text-muted-foreground">
                        {" "}
                        · {t("location", "Location")} {(item as any).location}
                      </span>
                    ) : null}
                  </div>
                  {item.amount ? (
                    <span className="shrink-0 whitespace-nowrap text-muted-foreground text-xs">
                      <Display type="currency" value={item.amount} />
                    </span>
                  ) : null}
                  {item.status ? (
                    <Badge
                      className="h-6 shrink-0 whitespace-nowrap"
                      variant={
                        item.status === "failed" ? "destructive" : "outline"
                      }
                    >
                      {t(`activity.status.${item.status}`, item.status)}
                    </Badge>
                  ) : null}
                  <div className="w-16 shrink-0 whitespace-nowrap text-right text-muted-foreground text-xs">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleTimeString(
                          i18n.language,
                          { hour: "2-digit", minute: "2-digit" }
                        )
                      : "--"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            message={t("empty.noActivity", "No live activity yet.")}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default function Statistics() {
  const { t } = useTranslation("dashboard");
  const [realtime, setRealtime] = useState<API.DashboardRealtimeResponse>();
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [trafficTimeFrames, setTrafficTimeFrames] = useState<
    Record<"nodes" | "users", "today" | "month">
  >({
    nodes: "today",
    users: "today",
  });

  useEffect(() => {
    if (!getAuthorizationToken()) return;
    let closed = false;
    let ws: WebSocket | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let hasFullSnapshot = false;
    let lastSeq = 0;

    const connect = () => {
      hasFullSnapshot = false;
      lastSeq = 0;
      ws = new WebSocket(buildDashboardRealtimeWsUrl());
      ws.onopen = () => setRealtimeConnected(true);
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as DashboardRealtimePatch;
          if (message.type === "dashboard_realtime") {
            const messageSeq = message.seq || 0;
            if (message.full === false) {
              if (
                !hasFullSnapshot ||
                (messageSeq > 0 && lastSeq > 0 && messageSeq !== lastSeq + 1)
              ) {
                ws?.close();
                return;
              }
              setRealtime((previous) =>
                previous ? mergeDashboardRealtime(previous, message) : previous
              );
              if (messageSeq > 0) {
                lastSeq = messageSeq;
              }
              return;
            }
            hasFullSnapshot = true;
            lastSeq = messageSeq;
            setRealtime(message as API.DashboardRealtimeResponse);
          }
        } catch {
          // Ignore malformed realtime dashboard messages.
        }
      };
      ws.onclose = () => {
        setRealtimeConnected(false);
        if (!closed) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      closed = true;
      setRealtimeConnected(false);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  const trafficData = useMemo(
    () => ({
      nodes: {
        today:
          realtime?.traffic?.server_ranking_today?.map((item) => ({
            name: item.name,
            traffic: item.download + item.upload,
          })) || [],
        month:
          (realtime?.traffic?.server_ranking_monthly || [])?.map((item) => ({
            name: item.name,
            traffic: item.download + item.upload,
          })) || [],
      },
      users: {
        today:
          realtime?.traffic?.user_ranking_today?.map((item) => ({
            name: item.sid,
            traffic: item.download + item.upload,
          })) || [],
        month:
          (realtime?.traffic?.user_ranking_monthly || [])?.map((item) => ({
            name: item.sid,
            traffic: item.download + item.upload,
          })) || [],
      },
    }),
    [realtime]
  );

  const TrafficRankCard = ({ type }: { type: "nodes" | "users" }) => {
    const timeFrame = trafficTimeFrames[type];
    const currentData = trafficData[type][timeFrame];

    return (
      <Card className="overflow-hidden rounded-3xl border border-white/10 bg-background/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:bg-background/40">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            {type === "nodes"
              ? t("nodeTraffic", "Node Traffic")
              : t("userTraffic", "User Traffic")}
          </CardTitle>
          <Tabs
            onValueChange={(value) =>
              setTrafficTimeFrames((prev) => ({
                ...prev,
                [type]: value as "today" | "month",
              }))
            }
            value={timeFrame}
          >
            <TabsList>
              <TabsTrigger value="today">{t("today", "Today")}</TabsTrigger>
              <TabsTrigger value="month">
                {t("thisMonth", "This month")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="h-64">
          {currentData.length > 0 ? (
            <ChartContainer
              className="max-h-80"
              config={{
                traffic: {
                  label: t("traffic", "Traffic"),
                  color: "#0A84FF",
                },
                type: {
                  label: t("type", "Type"),
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
                          `${t("node", "Node")}: ${label}`
                        ) : (
                          <>
                            <div className="w-80">
                              <UserSubscribeDetail
                                enabled={true}
                                id={payload?.payload.name}
                              />
                            </div>
                            <Separator className="my-2" />
                            <div>{`${t("user", "User")}: ${label}`}</div>
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
            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed bg-background/45 px-4 text-center text-muted-foreground text-sm">
              {t("empty.noTrafficData", "No traffic data yet.")}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full space-y-3">
      <RealtimeOverview connected={realtimeConnected} realtime={realtime} />

      <div className="grid items-start gap-3 2xl:grid-cols-[minmax(0,1fr)_minmax(440px,520px)]">
        <div className="space-y-3">
          <div className="grid items-start gap-3">
            <RevenueStatisticsCard realtime={realtime} />
            <UserStatisticsCard realtime={realtime} />
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            <TrafficRankCard type="nodes" />
            <TrafficRankCard type="users" />
          </div>
        </div>
        <div className="space-y-3 2xl:sticky 2xl:top-3">
          <LiveActivityCard connected={realtimeConnected} realtime={realtime} />
          <AlertsCard realtime={realtime} />
        </div>
      </div>
    </div>
  );
}

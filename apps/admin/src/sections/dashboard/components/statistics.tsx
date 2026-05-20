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
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Icon } from "@workspace/ui/composed/icon";
import { getAuthorizationToken } from "@workspace/ui/lib/auth-token";
import { getApiBaseURL, getApiPrefix } from "@workspace/ui/lib/runtime-config";
import { cn } from "@workspace/ui/lib/utils";
import { formatBytes } from "@workspace/ui/utils/formatting";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import { Display } from "@/components/display";
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
  const bitrate = Math.max(0, Number(value) || 0);
  if (bitrate === 0) return "0 bps";

  const units = ["bps", "Kbps", "Mbps", "Gbps", "Tbps"];
  let scaled = bitrate;
  let unitIndex = 0;
  while (scaled >= 1000 && unitIndex < units.length - 1) {
    scaled /= 1000;
    unitIndex += 1;
  }
  const digits = unitIndex === 0 ? 0 : scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return `${scaled.toFixed(digits)} ${units[unitIndex]}`;
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

const ACTIVITY_SHORT_TITLE_KEYS: Record<string, string> = {
  "New registration": "activity.shortTitle.newRegistration",
  "Balance recharged": "activity.shortTitle.balanceRecharged",
  "Membership opened": "activity.shortTitle.membershipOpened",
  "Order updated": "activity.shortTitle.orderUpdated",
  "Subscription pulled": "activity.shortTitle.subscriptionPulled",
  "Subscription purchased": "activity.shortTitle.subscriptionPurchased",
  "Subscription renewed": "activity.shortTitle.subscriptionRenewed",
  "Traffic reset": "activity.shortTitle.trafficReset",
  "User login": "activity.shortTitle.userLogin",
  "User logout": "activity.shortTitle.userLogout",
};

type OnlineRange = "1d" | "7d";
type NetworkRange = "1h" | "5h" | "24h" | "72h";

type DashboardRealtimePatch = Partial<
  Omit<
    API.DashboardRealtimeResponse,
    | "business"
    | "connections"
    | "network"
    | "network_series"
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
  network_series?: API.DashboardRealtimeResponse["network_series"];
  online_user_series?: Partial<
    API.DashboardRealtimeResponse["online_user_series"]
  >;
  resources?: Partial<API.DashboardRealtimeResponse["resources"]>;
  servers?: Partial<API.DashboardRealtimeResponse["servers"]>;
  traffic?: Partial<API.DashboardRealtimeResponse["traffic"]>;
};

const MINUTE_MS = 60 * 1000;
const RATE_BUCKET_MS = 5 * 1000;
const NETWORK_RANGE_MS: Record<NetworkRange, number> = {
  "1h": 60 * 60 * 1000,
  "5h": 5 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "72h": 72 * 60 * 60 * 1000,
};
const NETWORK_SERIES_MS = NETWORK_RANGE_MS["72h"];
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

function networkPointFromNetwork(
  timestamp: number,
  network: API.DashboardRealtimeResponse["network"]
): API.DashboardRealtimeResponse["network_series"][number] {
  return {
    timestamp,
    system_rx_bps: network.system_rx_bps || 0,
    system_tx_bps: network.system_tx_bps || 0,
    xray_rx_bps: network.xray_rx_bps || 0,
    xray_tx_bps: network.xray_tx_bps || 0,
  };
}

function appendRealtimeNetworkPoints(
  points: API.DashboardRealtimeResponse["network_series"] | undefined,
  incoming: API.DashboardRealtimeResponse["network_series"] | undefined,
  cutoff: number
) {
  const next = [...(points || [])];
  for (const point of incoming || []) {
    const index = next.findIndex(
      (item) =>
        Math.floor(item.timestamp / RATE_BUCKET_MS) ===
        Math.floor(point.timestamp / RATE_BUCKET_MS)
    );
    if (index >= 0) {
      next[index] = point;
    } else {
      next.push(point);
    }
  }
  return next
    .filter((item) => item.timestamp >= cutoff)
    .sort((a, b) => a.timestamp - b.timestamp);
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
  const nextNetwork = {
    ...previous.network,
    ...(patch.network || {}),
  };
  const nextNetworkSeries =
    patch.network_series && patch.network_series.length > 0
      ? patch.network_series
      : [networkPointFromNetwork(updatedAt, nextNetwork)];

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
    network: nextNetwork,
    network_series: appendRealtimeNetworkPoints(
      previous.network_series,
      nextNetworkSeries,
      updatedAt - NETWORK_SERIES_MS
    ),
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

function ensureNetworkRateSeries(
  points: API.DashboardRealtimeResponse["network_series"] | undefined,
  network: API.DashboardRealtimeResponse["network"] | undefined,
  updatedAt: number | undefined,
  spanMs: number
) {
  const now = updatedAt || Date.now();
  const cutoff = now - spanMs;
  const data =
    points
      ?.filter((item) => item.timestamp >= cutoff)
      .map((item) => ({
        systemRxBps: item.system_rx_bps,
        systemTxBps: item.system_tx_bps,
        timestamp: item.timestamp,
        xrayRxBps: item.xray_rx_bps,
        xrayTxBps: item.xray_tx_bps,
      })) || [];
  if (data.length > 1) return data;
  const current = data[0] || {
    systemRxBps: network?.system_rx_bps || 0,
    systemTxBps: network?.system_tx_bps || 0,
    timestamp: now,
    xrayRxBps: network?.xray_rx_bps || 0,
    xrayTxBps: network?.xray_tx_bps || 0,
  };
  return [
    {
      systemRxBps: 0,
      systemTxBps: 0,
      timestamp: Math.max(0, current.timestamp - spanMs),
      xrayRxBps: 0,
      xrayTxBps: 0,
    },
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

function RateMetric(props: { color: string; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-muted/35 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: props.color }}
        />
        <span className="truncate">{props.label}</span>
      </div>
      <div className="shrink-0 font-semibold text-sm tabular-nums">
        {props.value}
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
  const [networkRange, setNetworkRange] = useState<NetworkRange>("1h");
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
  const systemRxBps = realtime?.network?.system_rx_bps ?? 0;
  const systemTxBps = realtime?.network?.system_tx_bps ?? 0;
  const xrayRxBps = realtime?.network?.xray_rx_bps ?? 0;
  const xrayTxBps = realtime?.network?.xray_tx_bps ?? 0;
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
  const networkRateSeries = ensureNetworkRateSeries(
    realtime?.network_series,
    realtime?.network,
    realtime?.updated_at,
    NETWORK_RANGE_MS[networkRange]
  );
  const networkTimeFormatter = (value: number) => {
    const date = new Date(Number(value));
    if (networkRange === "1h" || networkRange === "5h") {
      return date.toLocaleTimeString(i18n.language, {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString(i18n.language, {
      day: "numeric",
      hour: "2-digit",
      month: "short",
    });
  };
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

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.15fr_1.15fr_.9fr_.9fr_.9fr]">
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
          sub={`${t("memoryShort", "MEM")} ${formatPercent(realtime?.resources.avg_mem)} · ${t("diskShort", "Disk")} ${formatPercent(realtime?.resources.avg_disk)}`}
          tone="orange"
          value={`CPU ${formatPercent(realtime?.resources.avg_cpu)}`}
        />
      </div>

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,.7fr)]">
        <Card className="self-start overflow-hidden rounded-3xl border border-white/10 bg-background/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:bg-background/40">
          <CardHeader className="gap-3 pb-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <CardTitle className="truncate text-base">
                    {t("realtimeRateCurve", "Realtime rate")}
                  </CardTitle>
                  <span className="inline-flex h-6 items-center rounded-full bg-blue-500/10 px-2 font-medium text-blue-600 text-xs dark:text-blue-300">
                    {formatBitrate(
                      systemRxBps + systemTxBps + xrayRxBps + xrayTxBps
                    )}
                  </span>
                </div>
                <div className="mt-1 text-muted-foreground text-xs">
                  {t("networkRateHint", "Host and Xray throughput")}
                </div>
              </div>
              <Tabs
                onValueChange={(value) =>
                  setNetworkRange(value as NetworkRange)
                }
                value={networkRange}
              >
                <TabsList className="h-8">
                  <TabsTrigger className="h-7 px-2.5" value="1h">
                    1h
                  </TabsTrigger>
                  <TabsTrigger className="h-7 px-2.5" value="5h">
                    5h
                  </TabsTrigger>
                  <TabsTrigger className="h-7 px-2.5" value="24h">
                    24h
                  </TabsTrigger>
                  <TabsTrigger className="h-7 px-2.5" value="72h">
                    72h
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_13.5rem]">
              <div className="h-56 rounded-2xl border border-border/50 bg-gradient-to-b from-muted/25 to-transparent px-2 py-3">
                <ChartContainer
                  className="h-full w-full"
                  config={{
                    total: {
                      label: t("realtimeRateCurve", "Realtime rate"),
                      color: "#0A84FF",
                    },
                  }}
                >
                  <LineChart
                    data={networkRateSeries}
                    margin={{ bottom: 0, left: 0, right: 12, top: 6 }}
                  >
                    <XAxis
                      axisLine={false}
                      dataKey="timestamp"
                      height={24}
                      minTickGap={28}
                      tickFormatter={(value) =>
                        networkTimeFormatter(Number(value))
                      }
                      tickLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickFormatter={(value) =>
                        formatBitrate(Number(value) || 0)
                      }
                      tickLine={false}
                      width={58}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => [
                            formatBitrate(Number(value) || 0),
                            t(`rate.${name}`, String(name)),
                          ]}
                          labelFormatter={(value) =>
                            new Date(Number(value)).toLocaleString(
                              i18n.language
                            )
                          }
                        />
                      }
                      cursor={{ stroke: "hsl(var(--border))" }}
                    />
                    <Line
                      dataKey="systemTxBps"
                      dot={false}
                      name="systemTxBps"
                      stroke="#0A84FF"
                      strokeWidth={2}
                      type="monotone"
                    />
                    <Line
                      dataKey="systemRxBps"
                      dot={false}
                      name="systemRxBps"
                      stroke="#64D2FF"
                      strokeWidth={2}
                      type="monotone"
                    />
                    <Line
                      dataKey="xrayTxBps"
                      dot={false}
                      name="xrayTxBps"
                      stroke="#BF5AF2"
                      strokeWidth={2}
                      type="monotone"
                    />
                    <Line
                      dataKey="xrayRxBps"
                      dot={false}
                      name="xrayRxBps"
                      stroke="#FF9F0A"
                      strokeWidth={2}
                      type="monotone"
                    />
                  </LineChart>
                </ChartContainer>
              </div>
              <div className="grid content-start gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <RateMetric
                  color="#0A84FF"
                  label={t("rate.systemTxBps", "Host up")}
                  value={formatBitrate(systemTxBps)}
                />
                <RateMetric
                  color="#64D2FF"
                  label={t("rate.systemRxBps", "Host down")}
                  value={formatBitrate(systemRxBps)}
                />
                <RateMetric
                  color="#BF5AF2"
                  label={t("rate.xrayTxBps", "Xray up")}
                  value={formatBitrate(xrayTxBps)}
                />
                <RateMetric
                  color="#FF9F0A"
                  label={t("rate.xrayRxBps", "Xray down")}
                  value={formatBitrate(xrayRxBps)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="self-start overflow-hidden rounded-3xl border border-white/10 bg-background/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:bg-background/40">
          <CardHeader className="gap-3 pb-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <CardTitle className="truncate text-base">
                    {t("onlineCurve", "Online curve")}
                  </CardTitle>
                  <span className="inline-flex h-6 items-center rounded-full bg-emerald-500/10 px-2 font-medium text-emerald-600 text-xs dark:text-emerald-300">
                    {onlineUsers}
                  </span>
                </div>
                <div className="mt-1 text-muted-foreground text-xs">
                  {t("realtimeUsers", "Realtime users")}
                </div>
              </div>
              <Tabs
                onValueChange={(value) => setOnlineRange(value as OnlineRange)}
                value={onlineRange}
              >
                <TabsList className="h-8">
                  <TabsTrigger className="h-7 px-2.5" value="1d">
                    {t("last1Day", "1 day")}
                  </TabsTrigger>
                  <TabsTrigger className="h-7 px-2.5" value="7d">
                    {t("last7Days", "7 days")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-56 rounded-2xl border border-border/50 bg-gradient-to-b from-muted/25 to-transparent px-2 py-3">
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
                  margin={{ bottom: 0, left: 4, right: 8, top: 6 }}
                >
                  <XAxis
                    axisLine={false}
                    dataKey="timestamp"
                    height={24}
                    minTickGap={24}
                    tickFormatter={(value) => timeFormatter(Number(value))}
                    tickLine={false}
                    tickMargin={8}
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
        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
        status ? toneMap[status] : ""
      )}
    >
      <Icon className="h-3 w-3" icon={iconMap[type] || "uil:bell"} />
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
    const normalized = detail?.trim().toLowerCase();
    if (
      normalized &&
      ["email", "mail", "mobile", "phone", "telephone"].includes(normalized)
    ) {
      return "";
    }
    return detail?.trim() || "";
  };
  const formatTitle = (
    item: API.DashboardRealtimeResponse["activities"][number]
  ) => {
    const key = ACTIVITY_SHORT_TITLE_KEYS[item.title];
    if (key) {
      return t(key, item.title);
    }
    const titleKey = ACTIVITY_TITLE_KEYS[item.title];
    return titleKey ? t(titleKey, item.title) : item.title;
  };
  const formatNetworkInfo = (
    item: API.DashboardRealtimeResponse["activities"][number]
  ) => ({
    ip: item.ip?.trim() || "",
    location: item.location?.trim() || "",
  });
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
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <CardTitle className="truncate whitespace-nowrap">
            {t("recentActivity", "Recent Activity")}
          </CardTitle>
          <Badge
            className="shrink-0 whitespace-nowrap"
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
          <Badge className="shrink-0" variant="outline">
            {activities.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length ? (
          <div className="max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
            {activities.map((item) => {
              const detail = formatDetail(item.detail);
              const network = formatNetworkInfo(item);
              return (
                <div
                  className={cn(
                    "flex h-8 min-w-0 items-center gap-1.5 overflow-hidden rounded-xl border px-2",
                    activityTone(item.type)
                  )}
                  key={item.id}
                >
                  <ActivityIcon status={item.status} type={item.type} />
                  <div className="min-w-0 flex-1 truncate whitespace-nowrap text-[13px]">
                    <span className="whitespace-nowrap font-medium">
                      {formatTitle(item)}
                    </span>
                    <span className="whitespace-nowrap text-muted-foreground">
                      {" "}
                      · {formatSubject(item.subject)}
                    </span>
                    {detail ? (
                      <span className="whitespace-nowrap text-muted-foreground">
                        {" "}
                        · {detail}
                      </span>
                    ) : null}
                  </div>
                  {network.ip || network.location ? (
                    <div className="w-[7.5rem] shrink-0 text-[11px] leading-3">
                      <div className="truncate font-medium tabular-nums">
                        {network.ip || "—"}
                      </div>
                      <div className="truncate text-muted-foreground">
                        {network.location || "—"}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex shrink-0 items-center gap-1.5">
                    {item.amount ? (
                      <span className="whitespace-nowrap text-muted-foreground text-xs">
                        <Display type="currency" value={item.amount} />
                      </span>
                    ) : null}
                    {item.status ? (
                      <Badge
                        className="h-5 whitespace-nowrap px-1.5 text-[11px]"
                        variant={
                          item.status === "failed" ? "destructive" : "outline"
                        }
                      >
                        {t(`activity.status.${item.status}`, item.status)}
                      </Badge>
                    ) : null}
                    <div className="w-10 whitespace-nowrap text-right text-muted-foreground text-xs">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleTimeString(
                            i18n.language,
                            { hour: "2-digit", minute: "2-digit" }
                          )
                        : "--"}
                    </div>
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
            setRealtime((previous) =>
              previous
                ? mergeDashboardRealtime(previous, message)
                : (message as API.DashboardRealtimeResponse)
            );
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
            name: String(item.name),
            traffic: item.download + item.upload,
          })) || [],
        month:
          (realtime?.traffic?.server_ranking_monthly || [])?.map((item) => ({
            name: String(item.name),
            traffic: item.download + item.upload,
          })) || [],
      },
      users: {
        today:
          realtime?.traffic?.user_ranking_today?.map((item) => ({
            name: String(item.sid),
            traffic: item.download + item.upload,
          })) || [],
        month:
          (realtime?.traffic?.user_ranking_monthly || [])?.map((item) => ({
            name: String(item.sid),
            traffic: item.download + item.upload,
          })) || [],
      },
    }),
    [realtime]
  );

  const TrafficRankCard = ({ type }: { type: "nodes" | "users" }) => {
    const timeFrame = trafficTimeFrames[type];
    const currentData = trafficData[type][timeFrame];
    const maxTraffic = Math.max(...currentData.map((item) => item.traffic), 1);

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
            <div className="h-full space-y-2 overflow-y-auto pr-1">
              {currentData.map((item, index) => {
                const percent =
                  item.traffic > 0
                    ? Math.max((item.traffic / maxTraffic) * 100, 2)
                    : 0;
                const scale = Math.min(percent / 100, 1);
                return (
                  <div
                    className="min-w-0 rounded-xl border border-border/60 bg-background/45 px-3 py-2 transition-colors hover:bg-muted/40"
                    key={`${type}-${timeFrame}-${item.name}`}
                  >
                    <div className="mb-1.5 flex min-w-0 items-center justify-between gap-3 text-xs">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground">
                          {index + 1}
                        </span>
                        <span className="truncate font-medium">
                          {type === "nodes"
                            ? item.name
                            : `${t("user", "User")} ${item.name}`}
                        </span>
                      </div>
                      <span className="shrink-0 font-medium text-muted-foreground tabular-nums">
                        {formatBytes(item.traffic)}
                      </span>
                    </div>
                    <div
                      aria-label={`${item.name} ${formatBytes(item.traffic)}`}
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={Math.round(percent)}
                      className="h-2 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                    >
                      <div
                        className={cn(
                          "h-full w-full origin-left rounded-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform",
                          type === "nodes"
                            ? "bg-gradient-to-r from-blue-400/70 to-blue-500"
                            : "bg-gradient-to-r from-violet-400/70 to-violet-500"
                        )}
                        style={{ transform: `scaleX(${scale})` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
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

      <div className="grid items-start gap-3 2xl:grid-cols-[minmax(0,1fr)_minmax(520px,640px)]">
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

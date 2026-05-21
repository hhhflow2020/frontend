"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { ConfirmButton } from "@workspace/ui/composed/confirm-button";
import { Icon } from "@workspace/ui/composed/icon";
import {
  ProTable,
  type ProTableActions,
} from "@workspace/ui/composed/pro-table/pro-table";
import { getAuthorizationToken } from "@workspace/ui/lib/auth-token";
import { getApiBaseURL, getApiPrefix } from "@workspace/ui/lib/runtime-config";
import { cn } from "@workspace/ui/lib/utils";
import {
  createServer,
  deleteServer,
  filterServerList,
  resetSortWithServer,
  updateServer,
} from "@workspace/ui/services/admin/server";
import { formatBytes } from "@workspace/ui/utils/formatting";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useNode } from "@/stores/node";
import { useServer } from "@/stores/server";
import ServerXrayTemplateBindForm from "../xray-templates/server-bind-form";
import DynamicMultiplier from "./dynamic-multiplier";
import ServerConfig from "./server-config";
import ServerForm from "./server-form";
import ServerInstall from "./server-install";

const SERVER_STATUS_TTL_MS = 30_000;

function usageColor(value: number) {
  if (value >= 90) {
    return "bg-red-500/80";
  }
  if (value >= 75) {
    return "bg-orange-500/80";
  }
  if (value >= 60) {
    return "bg-amber-500/80";
  }
  return "bg-emerald-500/80";
}

function PctBar({ label, value }: { label?: string; value: number }) {
  const v = value.toFixed(2);
  const widthClass =
    value >= 90
      ? "w-[90%]"
      : value >= 80
        ? "w-4/5"
        : value >= 70
          ? "w-[70%]"
          : value >= 60
            ? "w-3/5"
            : value >= 50
              ? "w-1/2"
              : value >= 40
                ? "w-2/5"
                : value >= 30
                  ? "w-[30%]"
                  : value >= 20
                    ? "w-1/5"
                    : value >= 10
                      ? "w-[10%]"
                      : "w-0";
  return (
    <div className="min-w-24">
      <div className="mb-1 grid grid-cols-[32px_1fr] items-center gap-1.5 text-xs leading-none">
        {label ? <span className="text-muted-foreground">{label}</span> : null}
        <span className="font-medium tabular-nums">{v}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted/60">
        <div
          className={cn(
            "h-1.5 rounded-full transition-all duration-500",
            usageColor(value),
            widthClass
          )}
        />
      </div>
    </div>
  );
}

function ResourcesCell({ status }: { status: Partial<API.ServerStatus> }) {
  return (
    <div className="flex w-fit min-w-[120px] flex-col gap-2 rounded-xl border border-border/40 bg-muted/10 p-2.5">
      <PctBar label="CPU" value={(status.cpu as number) ?? 0} />
      <PctBar label="MEM" value={(status.mem as number) ?? 0} />
      <PctBar label="DISK" value={(status.disk as number) ?? 0} />
    </div>
  );
}

function formatBitrate(value?: number) {
  if (!value) return "0 bps";
  return `${formatBytes(value / 8).replace("B", "b")}ps`;
}

function buildRealtimeWsUrl() {
  const base = getApiBaseURL() || window.location.origin;
  const prefix = getApiPrefix();
  const url = new URL(`${prefix}/v1/admin/server/realtime/ws`, base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const token = getAuthorizationToken();
  if (token) url.searchParams.set("token", token);
  return url.toString();
}

function serverStatusVersion(status?: Partial<API.ServerStatus>) {
  if (!status) return 0;
  return Math.max(status.last_seen || 0, status.updated_at || 0);
}

function RegionIpCell({
  country,
  city,
  ip,
  notAvailableText,
}: {
  country?: string;
  city?: string;
  ip?: string;
  notAvailableText: string;
}) {
  const region =
    [country, city].filter(Boolean).join(" / ") || notAvailableText;
  return (
    <div className="flex w-fit min-w-[140px] flex-col gap-1 rounded-xl border border-border/40 bg-muted/10 p-2.5">
      <span className="truncate font-medium" title={ip || notAvailableText}>
        {ip || notAvailableText}
      </span>
      <span className="truncate text-muted-foreground text-xs" title={region}>
        {region}
      </span>
    </div>
  );
}

function shortHash(value?: string) {
  if (!value) return "";
  return value.length > 10 ? value.slice(0, 10) : value;
}

function UnifiedStatusCell({
  status,
  tOnline,
  tOffline,
}: {
  status: Partial<API.ServerStatus>;
  tOnline: string;
  tOffline: string;
}) {
  const { t } = useTranslation("servers");
  const offline = status.status === "offline";
  const applyStatus = status.config_apply_status || "unknown";
  const syncStatus = status.config_sync_status || "unknown";
  const ok = applyStatus === "ok" && syncStatus === "ok";
  const pending = applyStatus === "pending";
  const error = status.last_apply_error || status.last_config_error || "";

  return (
    <div className="flex w-fit min-w-[150px] flex-col gap-1.5 rounded-xl border border-border/40 bg-muted/10 p-2.5 text-[11px] leading-tight">
      <div className="grid grid-cols-[42px_1fr] items-center gap-1.5">
        <span className="font-medium text-muted-foreground">
          {t("node", "Node")}
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              offline ? "bg-zinc-400" : "bg-emerald-500"
            )}
          />
          <span
            className={
              offline
                ? "text-muted-foreground"
                : "text-emerald-600 dark:text-emerald-400"
            }
          >
            {offline ? tOffline : tOnline}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-[42px_1fr] items-center gap-1.5">
        <span className="font-medium text-muted-foreground">Xray</span>
        <span className="flex items-center gap-1.5 font-medium">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              status.xray_running ? "bg-emerald-500" : "bg-red-500"
            )}
          />
          <span
            className={
              status.xray_running
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-500"
            }
          >
            {status.xray_running
              ? t("running", "Running")
              : t("stopped", "Stopped")}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-[42px_1fr] items-center gap-1.5">
        <span className="font-medium text-muted-foreground">
          {t("config", "Config")}
        </span>
        <span className="flex items-center gap-1.5 font-medium">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              ok ? "bg-blue-500" : pending ? "bg-amber-500" : "bg-red-500"
            )}
          />
          <span
            className={
              ok
                ? "text-blue-600 dark:text-blue-400"
                : pending
                  ? "text-amber-500"
                  : "text-red-500"
            }
          >
            {ok
              ? t("synced", "Synced")
              : pending
                ? t("pending", "Pending")
                : t("failed", "Failed")}
          </span>
        </span>
      </div>

      <div className="mt-1 flex flex-col gap-0.5 border-border/40 border-t pt-1.5 font-mono text-[10px] text-muted-foreground">
        <div className="flex items-center justify-between gap-2">
          <span>{t("runningConfigShort", "RUN")}:</span>
          <span className="truncate">
            {shortHash(status.running_config_hash || status.config_version) ||
              "-"}
          </span>
        </div>
        {status.pending_config_hash && (
          <div className="flex items-center justify-between gap-2 text-amber-500/80">
            <span>{t("pendingConfigShort", "PND")}:</span>
            <span className="truncate">
              {shortHash(status.pending_config_hash)}
            </span>
          </div>
        )}
      </div>

      {error ? (
        <div
          className="mt-0.5 max-w-[130px] truncate font-medium text-[10px] text-red-500"
          title={error}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}

function NetworkSpeedCell({ status }: { status: Partial<API.ServerStatus> }) {
  const { t } = useTranslation("servers");
  const statsError =
    status.status !== "offline" && status.xray_running
      ? status.xray_stats_error
      : "";

  return (
    <div className="flex w-fit min-w-[176px] flex-col gap-1.5 rounded-xl border border-border/40 bg-muted/10 p-2.5 text-[11px] leading-tight">
      <div className="grid grid-cols-[38px_1fr_1fr] items-center gap-1">
        <span className="font-medium text-muted-foreground">
          {t("systemShort", "Sys")}
        </span>
        <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
          <Icon className="h-3 w-3" icon="uil:arrow-up" />
          <span className="tabular-nums">
            {formatBitrate(status.net_tx_bps)}
          </span>
        </span>
        <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
          <Icon className="h-3 w-3" icon="uil:arrow-down" />
          <span className="tabular-nums">
            {formatBitrate(status.net_rx_bps)}
          </span>
        </span>
      </div>
      <div className="grid grid-cols-[38px_1fr_1fr] items-center gap-1">
        <span className="font-medium text-muted-foreground">Xray</span>
        <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
          <Icon className="h-3 w-3" icon="uil:arrow-up" />
          <span className="tabular-nums">
            {formatBitrate(status.xray_tx_bps)}
          </span>
        </span>
        <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
          <Icon className="h-3 w-3" icon="uil:arrow-down" />
          <span className="tabular-nums">
            {formatBitrate(status.xray_rx_bps)}
          </span>
        </span>
      </div>
      {statsError ? (
        <div
          className="max-w-36 truncate text-muted-foreground"
          title={statsError}
        >
          {t("stats", "Stats")}: {statsError}
        </div>
      ) : null}
    </div>
  );
}

function ConnectionsCell({ status }: { status: Partial<API.ServerStatus> }) {
  const { t } = useTranslation("servers");
  const systemInbound = status.system_inbound_connections ?? 0;
  const systemOutbound = status.system_outbound_connections ?? 0;
  const xrayInbound = status.xray_inbound_connections ?? 0;
  const xrayOutbound = status.xray_outbound_connections ?? 0;
  return (
    <div className="w-fit min-w-[140px] space-y-1.5 rounded-xl border border-border/40 bg-muted/10 p-2.5 text-[11px] leading-tight">
      <div className="mb-1 grid grid-cols-[34px_1fr_1fr] gap-1 border-border/40 border-b pb-1 text-muted-foreground">
        <span />
        <span>{t("inboundShort", "In")}</span>
        <span>{t("outboundShort", "Out")}</span>
      </div>
      <div className="grid grid-cols-[34px_1fr_1fr] gap-1">
        <span className="font-medium text-muted-foreground">
          {t("systemShort", "Sys")}
        </span>
        <span className="font-medium tabular-nums">{systemInbound}</span>
        <span className="font-medium tabular-nums">{systemOutbound}</span>
      </div>
      <div className="grid grid-cols-[34px_1fr_1fr] gap-1">
        <span className="font-medium text-muted-foreground">Xray</span>
        <span className="font-medium tabular-nums">{xrayInbound}</span>
        <span className="font-medium tabular-nums">{xrayOutbound}</span>
      </div>
    </div>
  );
}

export default function Servers() {
  const { t } = useTranslation("servers");
  const { isServerReferencedByNodes } = useNode();
  const { fetchServers } = useServer();

  const [loading, setLoading] = useState(false);
  const [xrayTemplateServer, setXrayTemplateServer] =
    useState<API.Server | null>(null);
  const [editingServer, setEditingServer] = useState<API.Server | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<
    Record<number, Partial<API.ServerStatus>>
  >({});
  const ref = useRef<ProTableActions>(null);
  const getStatus = (server: API.Server) => {
    const status = {
      ...(server.status || {}),
      ...(realtimeStatus[server.id] || {}),
    };
    if (
      status.last_seen &&
      status.status !== "offline" &&
      Date.now() - status.last_seen > SERVER_STATUS_TTL_MS
    ) {
      return { ...status, status: "offline" };
    }
    return status;
  };

  useEffect(() => {
    if (!getAuthorizationToken()) return;
    let closed = false;
    let ws: WebSocket | undefined;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const applyStatus = (
      item: Partial<API.ServerStatus> & { server_id?: number }
    ) => {
      if (!item.server_id) return;
      const { server_id: serverId, ...incomingStatus } = item;
      const status = {
        xray_stats_error: "",
        ...incomingStatus,
      };
      setRealtimeStatus((prev) => {
        const previous = prev[serverId];
        const previousVersion = serverStatusVersion(previous);
        const nextVersion = serverStatusVersion(status);
        if (
          previousVersion > 0 &&
          nextVersion > 0 &&
          nextVersion < previousVersion
        ) {
          return prev;
        }
        return {
          ...prev,
          [serverId]: {
            ...(previous || {}),
            ...status,
          },
        };
      });
    };

    const connect = () => {
      ws = new WebSocket(buildRealtimeWsUrl());
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "snapshot" && Array.isArray(message.data)) {
            for (const item of message.data) applyStatus(item);
            return;
          }
          if (message.type === "node_status") applyStatus(message);
        } catch {
          // Ignore malformed realtime messages.
        }
      };
      ws.onclose = () => {
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
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      ws?.close();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DynamicMultiplier />
        <ServerConfig />
      </div>
      <ProTable<API.Server, { search: string }>
        action={ref}
        actions={{
          render: (row) => [
            <Button key="edit" onClick={() => setEditingServer(row)}>
              {t("edit", "Edit")}
            </Button>,
            <ServerInstall key="install" server={row} />,
            <Button
              key="xray"
              onClick={() => setXrayTemplateServer(row)}
              variant="outline"
            >
              {t("xrayTemplates", "Xray Templates")}
            </Button>,
            <ConfirmButton
              cancelText={t("cancel", "Cancel")}
              confirmText={t("confirm", "Confirm")}
              description={t(
                "confirmDeleteDesc",
                "This action cannot be undone."
              )}
              key="delete"
              onConfirm={async () => {
                await deleteServer({ id: row.id } as API.DeleteServerRequest);
                toast.success(t("deleted", "Deleted"));
                ref.current?.refresh();
                fetchServers();
              }}
              title={t("confirmDeleteTitle", "Delete this server?")}
              trigger={
                <Button
                  disabled={isServerReferencedByNodes(row.id)}
                  variant="destructive"
                >
                  {t("delete", "Delete")}
                </Button>
              }
            />,
            <Button
              key="copy"
              onClick={async () => {
                setLoading(true);
                const {
                  id: _id,
                  created_at: _created_at,
                  updated_at: _updated_at,
                  last_reported_at: _last_reported_at,
                  status: _status,
                  ...others
                } = row as Record<string, unknown>;
                const body: API.CreateServerRequest = {
                  name: others.name as string,
                  country: others.country as string,
                  city: others.city as string,
                  address: others.address as string,
                };
                await createServer(body);
                toast.success(t("copied", "Copied"));
                ref.current?.refresh();
                fetchServers();
                setLoading(false);
              }}
              variant="outline"
            >
              {t("copy", "Copy")}
            </Button>,
          ],
          batchRender(rows) {
            const hasReferencedServers = rows.some((row) =>
              isServerReferencedByNodes(row.id)
            );
            return [
              <ConfirmButton
                cancelText={t("cancel", "Cancel")}
                confirmText={t("confirm", "Confirm")}
                description={t(
                  "confirmDeleteDesc",
                  "This action cannot be undone."
                )}
                key="delete"
                onConfirm={async () => {
                  await Promise.all(
                    rows.map((r) => deleteServer({ id: r.id }))
                  );
                  toast.success(t("deleted", "Deleted"));
                  ref.current?.refresh();
                  fetchServers();
                }}
                title={t("confirmDeleteTitle", "Delete this server?")}
                trigger={
                  <Button disabled={hasReferencedServers} variant="destructive">
                    {t("delete", "Delete")}
                  </Button>
                }
              />,
            ];
          },
        }}
        columns={[
          {
            accessorKey: "id",
            header: t("id", "ID"),
            cell: ({ row }) => <Badge>{row.getValue("id")}</Badge>,
          },
          { accessorKey: "name", header: t("name", "Name") },
          {
            id: "region_ip",
            header: t("address", "Address"),
            cell: ({ row }) => (
              <RegionIpCell
                city={row.original.city as unknown as string}
                country={row.original.country as unknown as string}
                ip={row.original.address as unknown as string}
                notAvailableText={t("notAvailable", "Not Available")}
              />
            ),
          },

          {
            id: "status",
            header: t("status", "Status"),
            cell: ({ row }) => {
              const status = getStatus(row.original);
              return (
                <UnifiedStatusCell
                  status={status}
                  tOffline={t("offline", "Offline")}
                  tOnline={t("online", "Online")}
                />
              );
            },
          },
          {
            id: "resources",
            header: t("resources", "Resources"),
            cell: ({ row }) => (
              <ResourcesCell status={getStatus(row.original)} />
            ),
          },
          {
            id: "network_speed",
            header: t("networkSpeed", "Network Speed"),
            cell: ({ row }) => {
              const status = getStatus(row.original);
              return <NetworkSpeedCell status={status} />;
            },
          },
          {
            id: "connections",
            header: t("connections", "Connections"),
            cell: ({ row }) => (
              <ConnectionsCell status={getStatus(row.original)} />
            ),
          },

          {
            id: "online_users",
            header: t("onlineUsers", "Online Users"),
            cell: ({ row }) => (
              <Badge variant="outline">
                {getStatus(row.original).online_users ?? 0}
              </Badge>
            ),
          },
        ]}
        header={{
          title: t("pageTitle", "Servers"),
          toolbar: (
            <div className="flex gap-2">
              <ServerForm
                loading={loading}
                onSubmit={async (values) => {
                  setLoading(true);
                  try {
                    await createServer(
                      values as unknown as API.CreateServerRequest
                    );
                    toast.success(t("created", "Created"));
                    ref.current?.refresh();
                    fetchServers();
                    setLoading(false);
                    return true;
                  } catch {
                    setLoading(false);
                    return false;
                  }
                }}
                title={t("drawerCreateTitle", "Create Server")}
                trigger={t("create", "Create")}
              />
            </div>
          ),
        }}
        onSort={async (source, target, items) => {
          const sourceIndex = items.findIndex(
            (item) => String(item.id) === source
          );
          const targetIndex = items.findIndex(
            (item) => String(item.id) === target
          );

          const originalSorts = items.map((item) => item.sort);

          const [movedItem] = items.splice(sourceIndex, 1);
          items.splice(targetIndex, 0, movedItem!);

          const updatedItems = items.map((item, index) => {
            const originalSort = originalSorts[index];
            const newSort =
              originalSort !== undefined ? originalSort : item.sort;
            return { ...item, sort: newSort };
          });

          const changedItems = updatedItems.filter(
            (item, index) => item.sort !== items[index]?.sort
          );

          if (changedItems.length > 0) {
            resetSortWithServer({
              sort: changedItems.map((item) => ({
                id: item.id,
                sort: item.sort,
              })) as API.SortItem[],
            });
            toast.success(t("sorted_success", "Sorted successfully"));
          }
          return updatedItems;
        }}
        params={[{ key: "search" }]}
        request={async (pagination, filter) => {
          const { data } = await filterServerList({
            page: pagination.page,
            size: pagination.size,
            search: filter?.search || undefined,
          });
          const list = (data?.data?.list || []) as API.Server[];
          const total = (data?.data?.total ?? list.length) as number;
          return { list, total };
        }}
      />
      {xrayTemplateServer ? (
        <ServerXrayTemplateBindForm
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setXrayTemplateServer(null);
          }}
          open={Boolean(xrayTemplateServer)}
          server={xrayTemplateServer}
        />
      ) : null}
      {editingServer ? (
        <ServerForm
          initialValues={editingServer}
          loading={loading}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setEditingServer(null);
          }}
          onSubmit={async (values) => {
            setLoading(true);
            try {
              await updateServer({
                id: editingServer.id,
                ...(values as unknown as Omit<API.UpdateServerRequest, "id">),
              });
              toast.success(t("updated", "Updated"));
              ref.current?.refresh();
              fetchServers();
              setLoading(false);
              return true;
            } catch {
              setLoading(false);
              return false;
            }
          }}
          open={Boolean(editingServer)}
          title={t("drawerEditTitle", "Edit Server")}
        />
      ) : null}
    </div>
  );
}

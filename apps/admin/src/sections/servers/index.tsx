"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { ConfirmButton } from "@workspace/ui/composed/confirm-button";
import {
  ProTable,
  type ProTableActions,
} from "@workspace/ui/composed/pro-table/pro-table";
import { getCookie } from "@workspace/ui/lib/cookies";
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

function PctBar({ value }: { value: number }) {
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
      <div className="text-xs leading-none">{v}%</div>
      <div className="h-1.5 w-full rounded bg-muted">
        <div className={cn("h-1.5 rounded bg-primary", widthClass)} />
      </div>
    </div>
  );
}

function formatBitrate(value?: number) {
  if (!value) return "0 bps";
  return `${formatBytes(value / 8).replace("B", "b")}ps`;
}

function buildRealtimeWsUrl() {
  const base = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  const prefix = import.meta.env.VITE_API_PREFIX || "";
  const url = new URL(`${prefix}/v1/admin/server/realtime/ws`, base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const token = getCookie("Authorization");
  if (token) url.searchParams.set("token", token);
  return url.toString();
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
    <div className="flex items-center gap-1">
      <Badge variant="outline">{region}</Badge>
      <Badge variant="secondary">{ip || notAvailableText}</Badge>
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
  const [realtimeStatus, setRealtimeStatus] = useState<
    Record<number, Partial<API.ServerStatus>>
  >({});
  const ref = useRef<ProTableActions>(null);
  const getStatus = (server: API.Server) => ({
    ...(server.status || {}),
    ...(realtimeStatus[server.id] || {}),
  });

  useEffect(() => {
    if (!getCookie("Authorization")) return;
    const ws = new WebSocket(buildRealtimeWsUrl());
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const applyStatus = (
          item: Partial<API.ServerStatus> & { server_id?: number }
        ) => {
          if (!item.server_id) return;
          const { server_id: serverId, ...status } = item;
          setRealtimeStatus((prev) => ({
            ...prev,
            [serverId]: {
              ...(prev[serverId] || {}),
              ...status,
            },
          }));
        };
        if (message.type === "snapshot" && Array.isArray(message.data)) {
          for (const item of message.data) applyStatus(item);
          return;
        }
        if (message.type === "node_status") applyStatus(message);
      } catch {
        // Ignore malformed realtime messages.
      }
    };
    return () => {
      ws.close();
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
            <ServerForm
              initialValues={row}
              key="edit"
              loading={loading}
              onSubmit={async (values) => {
                setLoading(true);
                try {
                  await updateServer({
                    id: row.id,
                    ...(values as unknown as Omit<
                      API.UpdateServerRequest,
                      "id"
                    >),
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
              title={t("drawerEditTitle", "Edit Server")}
              trigger={t("edit", "Edit")}
            />,
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
              const offline = status.status === "offline";
              return (
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-block h-2.5 w-2.5 rounded-full",
                      offline ? "bg-zinc-400" : "bg-emerald-500"
                    )}
                  />
                  <span className="text-sm">
                    {offline ? t("offline", "Offline") : t("online", "Online")}
                  </span>
                </div>
              );
            },
          },
          {
            id: "cpu",
            header: t("cpu", "CPU"),
            cell: ({ row }) => (
              <PctBar value={(getStatus(row.original).cpu as number) ?? 0} />
            ),
          },
          {
            id: "mem",
            header: t("memory", "Memory"),
            cell: ({ row }) => (
              <PctBar value={(getStatus(row.original).mem as number) ?? 0} />
            ),
          },
          {
            id: "disk",
            header: t("disk", "Disk"),
            cell: ({ row }) => (
              <PctBar value={(getStatus(row.original).disk as number) ?? 0} />
            ),
          },
          {
            id: "network_speed",
            header: t("networkSpeed", "Network Speed"),
            cell: ({ row }) => {
              const status = getStatus(row.original);
              return (
                <div className="flex min-w-28 flex-col gap-1 text-xs">
                  <span>↑ {formatBitrate(status.net_tx_bps)}</span>
                  <span>↓ {formatBitrate(status.net_rx_bps)}</span>
                </div>
              );
            },
          },
          {
            id: "connections",
            header: t("connections", "Connections"),
            cell: ({ row }) => (
              <Badge variant="outline">
                {getStatus(row.original).connections ?? 0}
              </Badge>
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
    </div>
  );
}

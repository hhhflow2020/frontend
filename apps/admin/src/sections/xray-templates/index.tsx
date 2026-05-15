import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Switch } from "@workspace/ui/components/switch";
import { ConfirmButton } from "@workspace/ui/composed/confirm-button";
import {
  ProTable,
  type ProTableActions,
} from "@workspace/ui/composed/pro-table/pro-table";
import {
  createXrayTemplate,
  deleteXrayTemplate,
  filterXrayTemplateList,
  updateXrayTemplate,
} from "@workspace/ui/services/admin/server";
import { format } from "date-fns";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import XrayTemplateForm from "./template-form";

function ConfigSummary({ config }: { config?: Record<string, any> }) {
  if (!config) return "—";
  const pieces = [
    config.tag,
    config.protocol,
    config.port ? `:${config.port}` : undefined,
    config.streamSettings?.network,
    config.streamSettings?.security,
    Array.isArray(config.servers) ? `${config.servers.length} dns` : undefined,
    Array.isArray(config.assets)
      ? `${config.assets.length} geodata`
      : undefined,
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap gap-1">
      {pieces.length ? (
        pieces.map((item) => (
          <Badge key={String(item)} variant="secondary">
            {String(item)}
          </Badge>
        ))
      ) : (
        <span>—</span>
      )}
    </div>
  );
}

export default function XrayTemplates() {
  const { t } = useTranslation("xray-templates");
  const [loading, setLoading] = useState(false);
  const ref = useRef<ProTableActions>(null);

  return (
    <ProTable<
      API.XrayTemplate,
      {
        search?: string;
        type?: "inbound" | "outbound" | "dns" | "routing" | "geodata";
        enabled?: boolean;
      }
    >
      action={ref}
      actions={{
        render: (row) => [
          <XrayTemplateForm
            initialValues={row}
            key="edit"
            loading={loading}
            onSubmit={async (values) => {
              setLoading(true);
              try {
                await updateXrayTemplate({
                  id: row.id,
                  ...values,
                });
                toast.success(t("message.updated", "Updated"));
                ref.current?.refresh();
                setLoading(false);
                return true;
              } catch {
                setLoading(false);
                return false;
              }
            }}
            title={t("form.editTitle", "Edit Xray Template")}
            trigger={<Button>{t("action.edit", "Edit")}</Button>}
          />,
          <ConfirmButton
            cancelText={t("action.cancel", "Cancel")}
            confirmText={t("action.confirm", "Confirm")}
            description={t(
              "message.deleteDescription",
              "This action cannot be undone."
            )}
            key="delete"
            onConfirm={async () => {
              await deleteXrayTemplate({ id: row.id });
              toast.success(t("message.deleted", "Deleted"));
              ref.current?.refresh();
            }}
            title={t("message.deleteTitle", "Delete this template?")}
            trigger={
              <Button variant="destructive">
                {t("action.delete", "Delete")}
              </Button>
            }
          />,
        ],
      }}
      columns={[
        {
          accessorKey: "id",
          header: t("column.id", "ID"),
          cell: ({ row }) => <Badge>{row.getValue("id")}</Badge>,
        },
        {
          accessorKey: "enabled",
          header: t("column.enabled", "Enabled"),
          cell: ({ row }) => (
            <Switch
              checked={row.original.enabled}
              onCheckedChange={async (checked) => {
                await updateXrayTemplate({
                  ...row.original,
                  enabled: checked,
                });
                ref.current?.refresh();
              }}
            />
          ),
        },
        {
          accessorKey: "type",
          header: t("column.type", "Type"),
          cell: ({ row }) => (
            <Badge variant="outline">
              {t(`type.${row.original.type}`, row.original.type)}
            </Badge>
          ),
        },
        {
          accessorKey: "name",
          header: t("column.name", "Name"),
        },
        {
          accessorKey: "description",
          header: t("column.description", "Description"),
          cell: ({ row }) => row.original.description || "—",
        },
        {
          accessorKey: "config",
          header: t("column.config", "Config"),
          cell: ({ row }) => <ConfigSummary config={row.original.config} />,
        },
        {
          accessorKey: "updated_at",
          header: t("column.updatedAt", "Updated At"),
          cell: ({ row }) =>
            row.original.updated_at
              ? format(row.original.updated_at, "yyyy-MM-dd HH:mm:ss")
              : "—",
        },
      ]}
      header={{
        title: t("title", "Xray Templates"),
        toolbar: (
          <XrayTemplateForm
            loading={loading}
            onSubmit={async (values) => {
              setLoading(true);
              try {
                await createXrayTemplate(values);
                toast.success(t("message.created", "Created"));
                ref.current?.refresh();
                setLoading(false);
                return true;
              } catch {
                setLoading(false);
                return false;
              }
            }}
            title={t("form.createTitle", "Create Xray Template")}
            trigger={<Button>{t("action.create", "Create")}</Button>}
          />
        ),
      }}
      params={[
        {
          key: "type",
          placeholder: t("filter.type", "Type"),
          options: [
            { label: t("type.inbound", "Inbound"), value: "inbound" },
            { label: t("type.outbound", "Outbound"), value: "outbound" },
            { label: t("type.dns", "DNS"), value: "dns" },
            { label: t("type.routing", "Routing"), value: "routing" },
            { label: t("type.geodata", "Geodata"), value: "geodata" },
          ],
        },
        {
          key: "enabled",
          placeholder: t("filter.enabled", "Enabled"),
          options: [
            { label: t("state.enabled", "Enabled"), value: "true" },
            { label: t("state.disabled", "Disabled"), value: "false" },
          ],
        },
        { key: "search" },
      ]}
      request={async (pagination, filter) => {
        const { data } = await filterXrayTemplateList({
          ...pagination,
          ...filter,
        });
        return {
          list: data.data?.list || [],
          total: data.data?.total || 0,
        };
      }}
    />
  );
}

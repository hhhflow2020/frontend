import { useQuery } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { Switch } from "@workspace/ui/components/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Textarea } from "@workspace/ui/components/textarea";
import { EnhancedInput } from "@workspace/ui/composed/enhanced-input";
import { Icon } from "@workspace/ui/composed/icon";
import {
  bindServerXrayTemplates,
  filterXrayTemplateList,
  queryServerXrayTemplateList,
} from "@workspace/ui/services/admin/server";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { formatJson, safeJsonParse, type XrayTemplateType } from "./config";

type BindingRow = {
  template_id: number;
  sort: number;
  enabled: boolean;
  alias: string;
  variables_json: string;
  subscription_enabled: boolean;
  subscription_name: string;
  subscription_variables_json: string;
};

type VariableHint = {
  key: string;
  type?: string;
  title?: string;
  description?: string;
  defaultValue?: unknown;
  required?: boolean;
};

function stringifyHintValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function collectVariableHints(template: API.XrayTemplate): VariableHint[] {
  const schema = (template.variables_schema || {}) as Record<string, any>;
  const defaults = (template.default_variables || {}) as Record<string, any>;
  const required = Array.isArray(schema.required) ? schema.required : [];
  const properties =
    schema.properties && typeof schema.properties === "object"
      ? schema.properties
      : schema;

  const keys = new Set<string>([
    ...Object.keys(defaults),
    ...Object.keys(properties || {}),
  ]);

  return [...keys].map((key) => {
    const item =
      properties?.[key] && typeof properties[key] === "object"
        ? properties[key]
        : {};
    return {
      key,
      type: item.type,
      title: item.title || item.label,
      description: item.description || item.desc || item.help,
      defaultValue: defaults[key] !== undefined ? defaults[key] : item.default,
      required: required.includes(key) || item.required === true,
    };
  });
}

function renderVariableHints(template: API.XrayTemplate) {
  const hints = collectVariableHints(template);
  if (!hints.length) {
    return (
      <p className="text-muted-foreground text-xs">
        未定义变量结构。变量 JSON 应填写一个对象，模板渲染时可通过 Vars/vars
        读取。
      </p>
    );
  }

  return (
    <div className="space-y-1 rounded border bg-muted/30 p-2 text-xs">
      <div className="font-medium">变量说明</div>
      {hints.map((hint) => (
        <div className="grid gap-1 md:grid-cols-[160px_1fr]" key={hint.key}>
          <div className="font-mono">
            {hint.key}
            {hint.required ? (
              <span className="text-destructive"> *</span>
            ) : null}
          </div>
          <div className="text-muted-foreground">
            {[hint.title, hint.type ? `type: ${hint.type}` : ""]
              .filter(Boolean)
              .join(" · ")}
            {hint.description ? ` · ${hint.description}` : ""}
            {stringifyHintValue(hint.defaultValue)
              ? ` · 默认值: ${stringifyHintValue(hint.defaultValue)}`
              : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

function renderSubscriptionHints(template: API.XrayTemplate) {
  const meta = (template.subscription_meta || {}) as Record<string, any>;
  const keys = Object.keys(meta);
  return (
    <div className="space-y-1 text-muted-foreground text-xs">
      <p>
        订阅变量 JSON
        只用于订阅渲染，可填写每个服务器不同的订阅参数，例如显示名称、
        host、port、sni、transport 或 path。
      </p>
      {keys.length ? (
        <p>
          当前模板订阅元数据字段：{" "}
          <span className="font-mono">{keys.join(", ")}</span>
        </p>
      ) : null}
    </div>
  );
}

function groupPreview(bindings: BindingRow[], templates: API.XrayTemplate[]) {
  const selected = bindings
    .filter((item) => item.enabled)
    .sort((a, b) => a.sort - b.sort)
    .map((item) =>
      templates.find((template) => template.id === item.template_id)
    )
    .filter(Boolean) as API.XrayTemplate[];

  const inbounds = selected
    .filter((item) => item.type === "inbound")
    .map((item) => item.config);
  const outbounds = selected
    .filter((item) => item.type === "outbound")
    .map((item) => item.config);
  const dns = selected
    .filter((item) => item.type === "dns")
    .map((item) => item.config);
  const routing = selected
    .filter((item) => item.type === "routing")
    .map((item) => item.config);

  return {
    inbounds,
    outbounds,
    dns: dns.length === 1 ? dns[0] : dns,
    routing: routing.length === 1 ? routing[0] : routing,
    templates: selected,
  };
}

export default function ServerXrayTemplateBindForm({
  server,
  trigger,
}: {
  server: API.Server;
  trigger: React.ReactNode;
}) {
  const { t } = useTranslation("xray-templates");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bindings, setBindings] = useState<BindingRow[]>([]);

  const { data: templateData } = useQuery({
    enabled: open,
    queryKey: ["xray-template-list-all"],
    queryFn: async () => {
      const { data } = await filterXrayTemplateList({
        page: 1,
        size: 1000,
      });
      return data.data?.list || [];
    },
  });
  const templates = useMemo(() => templateData || [], [templateData]);

  const { data: serverBindingData, refetch } = useQuery({
    enabled: open,
    queryKey: ["server-xray-template-list", server.id],
    queryFn: async () => {
      const { data } = await queryServerXrayTemplateList({
        server_id: server.id,
      });
      return data.data?.list || [];
    },
  });
  const serverBindings = useMemo(
    () => serverBindingData || [],
    [serverBindingData]
  );

  useEffect(() => {
    if (!open) return;
    setBindings(
      serverBindings.map((item) => ({
        template_id: item.template_id,
        sort: item.sort,
        enabled: item.enabled,
        alias: item.alias || item.template?.name || "",
        variables_json: formatJson(item.variables || {}),
        subscription_enabled: item.subscription_enabled ?? true,
        subscription_name: item.subscription_name || "",
        subscription_variables_json: formatJson(
          item.subscription_variables || {}
        ),
      }))
    );
  }, [open, serverBindings]);

  const preview = useMemo(
    () => groupPreview(bindings, templates),
    [bindings, templates]
  );

  function getBinding(templateId: number) {
    return bindings.find((item) => item.template_id === templateId);
  }

  function updateBinding(
    template: API.XrayTemplate,
    patch: Partial<BindingRow>
  ) {
    setBindings((current) => {
      const existing = current.find((item) => item.template_id === template.id);
      if (!existing) {
        return [
          ...current,
          {
            template_id: template.id,
            sort: current.length + 1,
            enabled: true,
            alias: template.name,
            variables_json: formatJson(template.default_variables || {}),
            subscription_enabled: true,
            subscription_name: "",
            subscription_variables_json: "{}",
            ...patch,
          },
        ];
      }
      return current.map((item) =>
        item.template_id === template.id ? { ...item, ...patch } : item
      );
    });
  }

  function removeBinding(templateId: number) {
    setBindings((current) =>
      current.filter((item) => item.template_id !== templateId)
    );
  }

  async function save() {
    setSaving(true);
    try {
      await bindServerXrayTemplates({
        server_id: server.id,
        bindings: bindings
          .sort((a, b) => a.sort - b.sort)
          .map((item) => ({
            template_id: item.template_id,
            sort: item.sort,
            enabled: item.enabled,
            alias: item.alias,
            variables: safeJsonParse(item.variables_json || "", {}),
            subscription_enabled: item.subscription_enabled,
            subscription_name: item.subscription_name,
            subscription_variables: safeJsonParse(
              item.subscription_variables_json || "",
              {}
            ),
          })),
      });
      toast.success(t("message.bound", "Saved"));
      await refetch();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  function renderTemplateList(type: XrayTemplateType) {
    const list = templates.filter((item) => item.type === type);
    if (!list.length) {
      return (
        <div className="rounded border border-dashed p-6 text-center text-muted-foreground text-sm">
          {t("bind.empty", "No templates")}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {list.map((template) => {
          const binding = getBinding(template.id);
          const selected = Boolean(binding);
          return (
            <div className="space-y-3 rounded border p-3" key={template.id}>
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">
                      {template.name}
                    </span>
                    <Badge variant={template.enabled ? "secondary" : "outline"}>
                      {template.enabled
                        ? t("state.enabled", "Enabled")
                        : t("state.disabled", "Disabled")}
                    </Badge>
                  </div>
                  <p className="truncate text-muted-foreground text-xs">
                    {template.description || template.config?.tag || "—"}
                  </p>
                </div>
                <div className="w-24 space-y-1">
                  <EnhancedInput
                    disabled={!selected}
                    min={0}
                    onValueChange={(value) =>
                      updateBinding(template, { sort: Number(value) || 0 })
                    }
                    placeholder="排序"
                    type="number"
                    value={binding?.sort ?? 0}
                  />
                  <p className="text-center text-muted-foreground text-xs">
                    排序
                  </p>
                </div>
                <Switch
                  checked={selected && binding?.enabled !== false}
                  onCheckedChange={(checked) => {
                    if (!checked) {
                      removeBinding(template.id);
                      return;
                    }
                    updateBinding(template, { enabled: true });
                  }}
                />
              </div>
              {selected ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <EnhancedInput
                        onValueChange={(value) =>
                          updateBinding(template, { alias: value })
                        }
                        placeholder={t("bind.alias", "Alias")}
                        value={binding?.alias || ""}
                      />
                      <p className="text-muted-foreground text-xs">
                        {t(
                          "bind.aliasDesc",
                          "别名用于其他模板通过 Ref/ref 引用，例如 {{ .Ref.inbound.main.tag }}。"
                        )}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <EnhancedInput
                        onValueChange={(value) =>
                          updateBinding(template, { subscription_name: value })
                        }
                        placeholder={t(
                          "bind.subscriptionName",
                          "Subscription name template"
                        )}
                        value={binding?.subscription_name || ""}
                      />
                      <p className="text-muted-foreground text-xs">
                        {t(
                          "bind.subscriptionNameDesc",
                          "可选的订阅节点名称 Go 模板。上下文支持 Server/server、Vars/vars 和 Ref/ref。"
                        )}
                      </p>
                    </div>
                  </div>
                  {renderVariableHints(template)}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Textarea
                        className="min-h-28 font-mono text-xs"
                        onChange={(event) =>
                          updateBinding(template, {
                            variables_json: event.target.value,
                          })
                        }
                        placeholder={t("bind.variables", "Variables JSON")}
                        value={binding?.variables_json || "{}"}
                      />
                      <p className="text-muted-foreground text-xs">
                        {t(
                          "bind.variablesDesc",
                          "变量 JSON 必须是对象。它会覆盖模板默认变量，并在渲染时作为 Vars/vars 使用。"
                        )}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded border px-3 py-2">
                        <span className="text-sm">
                          {t(
                            "bind.subscriptionEnabled",
                            "Include in subscription"
                          )}
                        </span>
                        <Switch
                          checked={binding?.subscription_enabled !== false}
                          onCheckedChange={(checked) =>
                            updateBinding(template, {
                              subscription_enabled: checked,
                            })
                          }
                        />
                      </div>
                      {renderSubscriptionHints(template)}
                      <Textarea
                        className="min-h-20 font-mono text-xs"
                        onChange={(event) =>
                          updateBinding(template, {
                            subscription_variables_json: event.target.value,
                          })
                        }
                        placeholder={t(
                          "bind.subscriptionVariables",
                          "Subscription variables JSON"
                        )}
                        value={binding?.subscription_variables_json || "{}"}
                      />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-[760px] max-w-full md:max-w-4xl">
        <SheetHeader>
          <SheetTitle>
            {t("bind.title", "Bind Xray Templates")} · {server.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto px-6 pt-4">
          <Tabs defaultValue="inbound">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="inbound">
                {t("type.inbound", "Inbound")}
              </TabsTrigger>
              <TabsTrigger value="outbound">
                {t("type.outbound", "Outbound")}
              </TabsTrigger>
              <TabsTrigger value="dns">{t("type.dns", "DNS")}</TabsTrigger>
              <TabsTrigger value="routing">
                {t("type.routing", "Routing")}
              </TabsTrigger>
              <TabsTrigger value="preview">
                {t("bind.preview", "Preview")}
              </TabsTrigger>
            </TabsList>
            <TabsContent className="pt-4" value="inbound">
              {renderTemplateList("inbound")}
            </TabsContent>
            <TabsContent className="pt-4" value="outbound">
              {renderTemplateList("outbound")}
            </TabsContent>
            <TabsContent className="pt-4" value="dns">
              {renderTemplateList("dns")}
            </TabsContent>
            <TabsContent className="pt-4" value="routing">
              {renderTemplateList("routing")}
            </TabsContent>
            <TabsContent className="pt-4" value="preview">
              <Textarea
                className="min-h-[420px] font-mono text-xs"
                readOnly
                value={JSON.stringify(preview, null, 2)}
              />
            </TabsContent>
          </Tabs>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 pt-3">
          <Button
            onClick={() => setOpen(false)}
            type="button"
            variant="outline"
          >
            {t("action.cancel", "Cancel")}
          </Button>
          <Button disabled={saving} onClick={save}>
            {saving ? (
              <Icon className="mr-2 animate-spin" icon="mdi:loading" />
            ) : null}
            {t("action.save", "Save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

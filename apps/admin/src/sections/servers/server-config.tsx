"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
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
  generateForwardMTLSCert,
  getNodeConfig,
  updateNodeConfig,
} from "@workspace/ui/services/admin/system";
import { unitConversion } from "@workspace/ui/utils/unit-conversions";
import { DicesIcon } from "lucide-react";
import { uid } from "radash";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

const nodeConfigSchema = z.object({
  node_secret: z.string().optional(),
  node_pull_interval: z.number().optional(),
  node_push_interval: z.number().optional(),
  traffic_report_threshold: z.number().optional(),
  ip_strategy: z.enum(["prefer_ipv4", "prefer_ipv6"]).optional(),
  forward_mtls_enabled: z.boolean().optional(),
  forward_mtls_ca_cert: z.string().optional(),
  forward_mtls_server_cert: z.string().optional(),
  forward_mtls_server_key: z.string().optional(),
  forward_mtls_client_cert: z.string().optional(),
  forward_mtls_client_key: z.string().optional(),
});
type NodeConfigFormData = z.infer<typeof nodeConfigSchema>;

export default function ServerConfig() {
  const { t } = useTranslation("servers");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingMTLS, setGeneratingMTLS] = useState(false);

  const { data: cfgResp, refetch: refetchCfg } = useQuery({
    queryKey: ["getNodeConfig"],
    queryFn: async () => {
      const { data } = await getNodeConfig();
      return data.data as API.NodeConfig | undefined;
    },
    enabled: open,
  });

  const form = useForm<NodeConfigFormData>({
    resolver: zodResolver(nodeConfigSchema),
    defaultValues: {
      node_secret: "",
      node_pull_interval: undefined,
      node_push_interval: undefined,
      traffic_report_threshold: undefined,
      ip_strategy: "prefer_ipv4",
      forward_mtls_enabled: false,
      forward_mtls_ca_cert: "",
      forward_mtls_server_cert: "",
      forward_mtls_server_key: "",
      forward_mtls_client_cert: "",
      forward_mtls_client_key: "",
    },
  });

  useEffect(() => {
    if (cfgResp) {
      form.reset({
        node_secret: cfgResp.node_secret ?? "",
        node_pull_interval: cfgResp.node_pull_interval as number | undefined,
        node_push_interval: cfgResp.node_push_interval as number | undefined,
        traffic_report_threshold: cfgResp.traffic_report_threshold as
          | number
          | undefined,
        ip_strategy:
          (cfgResp.ip_strategy as "prefer_ipv4" | "prefer_ipv6" | undefined) ||
          "prefer_ipv4",
        forward_mtls_enabled: cfgResp.forward_mtls_enabled ?? false,
        forward_mtls_ca_cert: cfgResp.forward_mtls_ca_cert ?? "",
        forward_mtls_server_cert: cfgResp.forward_mtls_server_cert ?? "",
        forward_mtls_server_key: cfgResp.forward_mtls_server_key ?? "",
        forward_mtls_client_cert: cfgResp.forward_mtls_client_cert ?? "",
        forward_mtls_client_key: cfgResp.forward_mtls_client_key ?? "",
      });
    }
  }, [cfgResp, form]);

  async function generateMTLSCertificates() {
    setGeneratingMTLS(true);
    try {
      const { data } = await generateForwardMTLSCert({
        common_name: "ppanel-forward",
        days: 3650,
      });
      const certs = data.data;
      if (!certs) return;
      form.setValue("forward_mtls_enabled", true);
      form.setValue("forward_mtls_ca_cert", certs.forward_mtls_ca_cert || "");
      form.setValue(
        "forward_mtls_server_cert",
        certs.forward_mtls_server_cert || ""
      );
      form.setValue(
        "forward_mtls_server_key",
        certs.forward_mtls_server_key || ""
      );
      form.setValue(
        "forward_mtls_client_cert",
        certs.forward_mtls_client_cert || ""
      );
      form.setValue(
        "forward_mtls_client_key",
        certs.forward_mtls_client_key || ""
      );
      toast.success(
        t(
          "server_config.forward_mtls.generate_success",
          "mTLS certificates generated"
        )
      );
    } finally {
      setGeneratingMTLS(false);
    }
  }

  async function onSubmit(values: NodeConfigFormData) {
    setSaving(true);
    try {
      await updateNodeConfig({
        ...(cfgResp || {}),
        ...values,
      } as API.NodeConfig);
      toast.success(t("server_config.saveSuccess", "Saved successfully"));
      await refetchCfg();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Card>
          <CardContent>
            <div className="flex cursor-pointer items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon
                    className="h-5 w-5 text-primary"
                    icon="mdi:resistor-nodes"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {t("server_config.title", "Node configuration")}
                  </p>
                  <p className="truncate text-muted-foreground text-sm">
                    {t(
                      "server_config.description",
                      "Manage node communication keys, pull/push intervals."
                    )}
                  </p>
                </div>
              </div>
              <Icon className="size-6" icon="mdi:chevron-right" />
            </div>
          </CardContent>
        </Card>
      </SheetTrigger>

      <SheetContent className="w-[720px] max-w-full md:max-w-3xl">
        <SheetHeader>
          <SheetTitle>
            {t("server_config.title", "Node configuration")}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100dvh-48px-36px-36px-env(safe-area-inset-top))] px-6">
          <Tabs className="pt-4" defaultValue="basic">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">
                {t("server_config.tabs.basic", "Basic Configuration")}
              </TabsTrigger>
              <TabsTrigger value="mtls">Forward mTLS</TabsTrigger>
            </TabsList>

            <Form {...form}>
              <form
                className="mt-4"
                id="server-config-form"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <TabsContent className="space-y-4" value="basic">
                  <FormField
                    control={form.control}
                    name="node_secret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t(
                            "server_config.fields.communication_key",
                            "Communication key"
                          )}
                        </FormLabel>
                        <FormControl>
                          <EnhancedInput
                            onValueChange={field.onChange}
                            placeholder={t(
                              "server_config.fields.communication_key_placeholder",
                              "Please enter"
                            )}
                            suffix={
                              <div className="flex h-9 items-center bg-muted px-3">
                                <DicesIcon
                                  className="cursor-pointer"
                                  onClick={() => {
                                    const id = uid(32).toLowerCase();
                                    const formatted = `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
                                    form.setValue("node_secret", formatted);
                                  }}
                                />
                              </div>
                            }
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          {t(
                            "server_config.fields.communication_key_desc",
                            "Used for node authentication."
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="node_pull_interval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t(
                            "server_config.fields.node_pull_interval",
                            "Node pull interval"
                          )}
                        </FormLabel>
                        <FormControl>
                          <EnhancedInput
                            min={0}
                            onValueChange={field.onChange}
                            placeholder={t(
                              "server_config.fields.communication_key_placeholder",
                              "Please enter"
                            )}
                            suffix="S"
                            type="number"
                            value={field.value as number | undefined}
                          />
                        </FormControl>
                        <FormDescription>
                          {t(
                            "server_config.fields.node_pull_interval_desc",
                            "How often the node pulls configuration (seconds)."
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="node_push_interval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t(
                            "server_config.fields.node_push_interval",
                            "Node push interval"
                          )}
                        </FormLabel>
                        <FormControl>
                          <EnhancedInput
                            min={0}
                            onValueChange={field.onChange}
                            placeholder={t(
                              "server_config.fields.communication_key_placeholder",
                              "Please enter"
                            )}
                            step={0.1}
                            suffix="S"
                            type="number"
                            value={field.value as number | undefined}
                          />
                        </FormControl>
                        <FormDescription>
                          {t(
                            "server_config.fields.node_push_interval_desc",
                            "How often the node pushes stats (seconds)."
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="traffic_report_threshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t(
                            "server_config.fields.traffic_report_threshold",
                            "Traffic Report Threshold"
                          )}
                        </FormLabel>
                        <FormControl>
                          <EnhancedInput
                            min={0}
                            onValueChange={(value) => {
                              field.onChange(unitConversion("mbToBits", value));
                            }}
                            placeholder="1"
                            suffix="MB"
                            type="number"
                            value={unitConversion(
                              "bitsToMb",
                              field.value as number | undefined
                            )}
                          />
                        </FormControl>
                        <FormDescription>
                          {t(
                            "server_config.fields.traffic_report_threshold_desc",
                            "Set the minimum threshold for traffic reporting."
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ip_strategy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("server_config.fields.ip_strategy", "IP Strategy")}
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t(
                                  "server_config.fields.ip_strategy_placeholder",
                                  "Select IP strategy"
                                )}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="prefer_ipv4">
                              {t(
                                "server_config.fields.ip_strategy_ipv4",
                                "Prefer IPv4"
                              )}
                            </SelectItem>
                            <SelectItem value="prefer_ipv6">
                              {t(
                                "server_config.fields.ip_strategy_ipv6",
                                "Prefer IPv6"
                              )}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t(
                            "server_config.fields.ip_strategy_desc",
                            "Choose IP version preference for network connections"
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent className="space-y-4" value="mtls">
                  <div className="flex items-start justify-between gap-3 rounded-lg border p-4">
                    <div>
                      <div className="font-medium">Forward mTLS</div>
                      <div className="mt-1 text-muted-foreground text-sm">
                        Require client certificates when forwarders pull the TCP
                        forwarding table.
                      </div>
                    </div>
                    <FormField
                      control={form.control}
                      name="forward_mtls_enabled"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch
                              checked={!!field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    disabled={generatingMTLS}
                    onClick={generateMTLSCertificates}
                    type="button"
                    variant="outline"
                  >
                    <Icon
                      className={generatingMTLS ? "mr-2 animate-spin" : "mr-2"}
                      icon={generatingMTLS ? "mdi:loading" : "mdi:certificate"}
                    />
                    Generate certificates
                  </Button>

                  {(
                    [
                      ["forward_mtls_ca_cert", "CA Certificate"],
                      ["forward_mtls_server_cert", "Server Certificate"],
                      ["forward_mtls_server_key", "Server Private Key"],
                      ["forward_mtls_client_cert", "Client Certificate"],
                      ["forward_mtls_client_key", "Client Private Key"],
                    ] as const
                  ).map(([name, label]) => (
                    <FormField
                      control={form.control}
                      key={name}
                      name={name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{label}</FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-32 font-mono text-xs"
                              onChange={field.onChange}
                              placeholder={`Paste ${label}`}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            {name.includes("_key")
                              ? "Keep this private. Copy it only to the server or forwarder that needs it."
                              : "PEM encoded certificate."}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </TabsContent>
              </form>
            </Form>
          </Tabs>
        </ScrollArea>

        <SheetFooter className="flex-row justify-end gap-2 pt-3">
          <Button
            disabled={saving}
            onClick={() => setOpen(false)}
            variant="outline"
          >
            {t("actions.cancel", "Cancel")}
          </Button>
          <Button disabled={saving} form="server-config-form" type="submit">
            <Icon
              className={saving ? "mr-2 animate-spin" : "hidden"}
              icon="mdi:loading"
            />
            {t("actions.save", "Save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
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
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
  generateRealityKeyPair,
  generateRealityShortId,
} from "../servers/generate";
import {
  buildDnsConfig,
  buildInboundConfig,
  buildOutboundConfig,
  buildRoutingConfig,
  configToFormValues,
  formatJson,
  INBOUND_PROTOCOLS,
  NETWORKS,
  OUTBOUND_PROTOCOLS,
  QUERY_STRATEGIES,
  ROUTING_DOMAIN_STRATEGIES,
  SECURITIES,
  safeJsonParse,
  XRAY_TEMPLATE_TYPES,
  type XrayTemplateType,
} from "./config";

const formSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["inbound", "outbound", "dns", "routing"]),
  description: z.string().optional(),
  enabled: z.boolean(),
  config: z.record(z.string(), z.any()).optional(),
  config_template: z.string().optional(),
  variables_schema_json: z.string().optional(),
  default_variables_json: z.string().optional(),
  subscription_meta_json: z.string().optional(),
  tag: z.string().optional(),
  listen: z.string().optional(),
  port: z.coerce.number().optional(),
  protocol: z.string().optional(),
  settings_json: z.string().optional(),
  network: z.string().optional(),
  security: z.string().optional(),
  host: z.string().optional(),
  path: z.string().optional(),
  service_name: z.string().optional(),
  grpc_authority: z.string().optional(),
  grpc_multi_mode: z.boolean().optional(),
  grpc_idle_timeout: z.coerce.number().optional(),
  grpc_health_check_timeout: z.coerce.number().optional(),
  xhttp_mode: z.string().optional(),
  sni: z.string().optional(),
  allow_insecure: z.boolean().optional(),
  fingerprint: z.string().optional(),
  kcp_mtu: z.coerce.number().optional(),
  kcp_tti: z.coerce.number().optional(),
  kcp_uplink_capacity: z.coerce.number().optional(),
  kcp_downlink_capacity: z.coerce.number().optional(),
  kcp_congestion: z.boolean().optional(),
  kcp_header_type: z.string().optional(),
  raw_settings_json: z.string().optional(),
  kcp_settings_json: z.string().optional(),
  hysteria_settings_json: z.string().optional(),
  sockopt_json: z.string().optional(),
  finalmask_json: z.string().optional(),
  reality_show: z.boolean().optional(),
  reality_target: z.string().optional(),
  reality_xver: z.coerce.number().optional(),
  reality_server_names: z.string().optional(),
  reality_private_key: z.string().optional(),
  reality_public_key: z.string().optional(),
  reality_short_id: z.string().optional(),
  reality_short_ids: z.string().optional(),
  reality_spider_x: z.string().optional(),
  reality_min_client_ver: z.string().optional(),
  reality_max_client_ver: z.string().optional(),
  reality_max_time_diff: z.coerce.number().optional(),
  sniffing: z.boolean().optional(),
  dest_override: z.string().optional(),
  sniffing_metadata_only: z.boolean().optional(),
  sniffing_route_only: z.boolean().optional(),
  sniffing_domains_excluded: z.string().optional(),
  vless_clients_json: z.string().optional(),
  vless_decryption: z.string().optional(),
  vmess_clients_json: z.string().optional(),
  vmess_default_json: z.string().optional(),
  trojan_clients_json: z.string().optional(),
  fallbacks_json: z.string().optional(),
  ss_network: z.string().optional(),
  ss_method: z.string().optional(),
  ss_password: z.string().optional(),
  ss_clients_json: z.string().optional(),
  socks_auth: z.string().optional(),
  socks_udp: z.boolean().optional(),
  socks_ip: z.string().optional(),
  accounts_json: z.string().optional(),
  allow_transparent: z.boolean().optional(),
  dokodemo_address: z.string().optional(),
  dokodemo_port: z.coerce.number().optional(),
  dokodemo_port_map_json: z.string().optional(),
  dokodemo_network: z.string().optional(),
  follow_redirect: z.boolean().optional(),
  wg_secret_key: z.string().optional(),
  wg_address: z.string().optional(),
  wg_peers_json: z.string().optional(),
  wg_mtu: z.coerce.number().optional(),
  wg_no_kernel_tun: z.boolean().optional(),
  wg_reserved_json: z.string().optional(),
  wg_workers: z.coerce.number().optional(),
  wg_domain_strategy: z.string().optional(),
  hysteria_version: z.coerce.number().optional(),
  hysteria_clients_json: z.string().optional(),
  tun_name: z.string().optional(),
  tun_mtu: z.coerce.number().optional(),
  out_address: z.string().optional(),
  out_port: z.coerce.number().optional(),
  out_id: z.string().optional(),
  out_encryption: z.string().optional(),
  out_flow: z.string().optional(),
  out_security: z.string().optional(),
  out_experiments: z.string().optional(),
  out_password: z.string().optional(),
  out_user: z.string().optional(),
  out_pass: z.string().optional(),
  ss_uot: z.boolean().optional(),
  ss_uot_version: z.coerce.number().optional(),
  headers_json: z.string().optional(),
  email: z.string().optional(),
  user_level: z.coerce.number().optional(),
  domain_strategy: z.string().optional(),
  redirect: z.string().optional(),
  fragment_json: z.string().optional(),
  noises_json: z.string().optional(),
  proxy_protocol: z.coerce.number().optional(),
  response_type: z.string().optional(),
  dns_out_network: z.string().optional(),
  dns_out_address: z.string().optional(),
  dns_out_port: z.coerce.number().optional(),
  dns_out_rules_json: z.string().optional(),
  loopback_inbound_tag: z.string().optional(),
  servers: z.string().optional(),
  dns_servers_json: z.string().optional(),
  serve_stale: z.boolean().optional(),
  serve_expired_ttl: z.coerce.number().optional(),
  enable_parallel_query: z.boolean().optional(),
  use_system_hosts: z.boolean().optional(),
  hosts_json: z.string().optional(),
  query_strategy: z.string().optional(),
  disable_cache: z.boolean().optional(),
  disable_fallback: z.boolean().optional(),
  disable_fallback_if_match: z.boolean().optional(),
  client_ip: z.string().optional(),
  routing_domain_strategy: z.string().optional(),
  routing_rules_json: z.string().optional(),
  routing_balancers_json: z.string().optional(),
  advanced_json: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type TemplatePayload = {
  name: string;
  type: XrayTemplateType;
  description?: string;
  enabled?: boolean;
  config: Record<string, any>;
  config_template?: string;
  variables_schema?: Record<string, any>;
  default_variables?: Record<string, any>;
  subscription_meta?: Record<string, any>;
};

function defaultValues(type: XrayTemplateType = "inbound"): FormValues {
  return {
    name: "",
    type,
    description: "",
    enabled: true,
    config: {},
    config_template: "",
    variables_schema_json: "{}",
    default_variables_json: "{}",
    subscription_meta_json: "{}",
    protocol: type === "outbound" ? "freedom" : "vless",
    tag: "",
    listen: "",
    port: undefined,
    settings_json: "{}",
    network: "raw",
    security: "none",
    fingerprint: "chrome",
    grpc_multi_mode: false,
    kcp_congestion: false,
    kcp_header_type: "",
    reality_show: false,
    reality_target: "",
    reality_server_names: "",
    reality_private_key: "",
    reality_public_key: "",
    reality_short_id: "",
    reality_short_ids: "",
    reality_spider_x: "",
    raw_settings_json: "{}",
    kcp_settings_json: "{}",
    hysteria_settings_json: "{}",
    sockopt_json: "{}",
    finalmask_json: "{}",
    vless_clients_json: "[]",
    vless_decryption: "none",
    vmess_clients_json: "[]",
    vmess_default_json: "{}",
    trojan_clients_json: "[]",
    fallbacks_json: "[]",
    ss_network: "tcp",
    ss_method: "",
    ss_password: "",
    ss_clients_json: "[]",
    socks_auth: "noauth",
    socks_udp: false,
    accounts_json: "[]",
    allow_transparent: false,
    dokodemo_address: "localhost",
    dokodemo_port: 0,
    dokodemo_port_map_json: "{}",
    dokodemo_network: "tcp",
    follow_redirect: false,
    wg_secret_key: "",
    wg_address: "10.0.0.1\nfd59:7153:2388:b5fd::1",
    wg_peers_json: "[]",
    wg_mtu: 1420,
    wg_no_kernel_tun: false,
    wg_reserved_json: "[]",
    wg_domain_strategy: "ForceIP",
    hysteria_version: 2,
    hysteria_clients_json: "[]",
    tun_name: "xray0",
    tun_mtu: 1500,
    out_encryption: "none",
    out_security: "auto",
    ss_uot: false,
    ss_uot_version: 2,
    headers_json: "{}",
    fragment_json: "{}",
    noises_json: "[]",
    user_level: 0,
    domain_strategy: "AsIs",
    response_type: "none",
    dns_out_network: "udp",
    dns_out_port: 53,
    dns_out_rules_json: "[]",
    sniffing: true,
    dest_override: "http, tls, quic",
    sniffing_metadata_only: false,
    sniffing_route_only: false,
    sniffing_domains_excluded: "",
    query_strategy: "UseIP",
    hosts_json: "{}",
    servers: "1.1.1.1\n8.8.8.8",
    dns_servers_json: "[]",
    serve_stale: false,
    serve_expired_ttl: undefined,
    enable_parallel_query: false,
    use_system_hosts: false,
    routing_domain_strategy: "AsIs",
    routing_rules_json: "[]",
    routing_balancers_json: "[]",
    advanced_json: "{}",
  };
}

function JsonTextarea({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Textarea
      className="min-h-32 font-mono text-xs"
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      value={value || ""}
    />
  );
}

function SwitchField({
  control,
  name,
  label,
}: {
  control: any;
  name: keyof FormValues;
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="pt-2">
              <Switch
                checked={!!field.value}
                onCheckedChange={field.onChange}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function InputField({
  control,
  name,
  label,
  placeholder,
  type,
  description,
}: {
  control: any;
  name: keyof FormValues;
  label: string;
  placeholder?: string;
  type?: string;
  description?: string;
}) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          {description ? (
            <FormDescription>{description}</FormDescription>
          ) : null}
          <FormControl>
            <EnhancedInput
              onValueChange={field.onChange}
              placeholder={placeholder}
              type={type}
              value={field.value ?? ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SelectField({
  control,
  name,
  label,
  options,
}: {
  control: any;
  name: keyof FormValues;
  label: string;
  options: string[];
}) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function JsonField({
  control,
  name,
  label,
  description,
  placeholder,
}: {
  control: any;
  name: keyof FormValues;
  label: string;
  description?: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          {description ? (
            <FormDescription>{description}</FormDescription>
          ) : null}
          <FormControl>
            <JsonTextarea
              onChange={field.onChange}
              placeholder={placeholder}
              value={field.value}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ProtocolSettingsFields({
  control,
  type,
  protocol,
}: {
  control: any;
  type: XrayTemplateType;
  protocol?: string;
}) {
  if (type === "inbound") {
    if (protocol === "vless") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              control={control}
              label="Decryption"
              name="vless_decryption"
              placeholder="none"
            />
            <InputField
              control={control}
              label="User Level"
              name="user_level"
              type="number"
            />
          </div>
          <JsonField
            control={control}
            description='ClientObject[]: [{"id":"uuid","level":0,"email":"user@example.com","flow":"xtls-rprx-vision"}]'
            label="VLESS Clients"
            name="vless_clients_json"
          />
          <JsonField
            control={control}
            description='FallbackObject[]: [{"dest":80},{"name":"example.com","alpn":"h2","dest":"127.0.0.1:8443"}]'
            label="Fallbacks"
            name="fallbacks_json"
          />
        </div>
      );
    }
    if (protocol === "vmess") {
      return (
        <div className="space-y-4">
          <JsonField
            control={control}
            description='ClientObject[]: [{"id":"uuid","level":0,"email":"user@example.com","alterId":0}]'
            label="VMess Clients"
            name="vmess_clients_json"
          />
          <JsonField
            control={control}
            description='VMess DefaultObject, e.g. {"level":0}'
            label="VMess Default"
            name="vmess_default_json"
          />
        </div>
      );
    }
    if (protocol === "trojan") {
      return (
        <div className="space-y-4">
          <JsonField
            control={control}
            description='ClientObject[]: [{"password":"password","email":"user@example.com","level":0}]'
            label="Trojan Clients"
            name="trojan_clients_json"
          />
          <JsonField
            control={control}
            description='FallbackObject[]: [{"dest":80}]'
            label="Fallbacks"
            name="fallbacks_json"
          />
        </div>
      );
    }
    if (protocol === "shadowsocks") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SelectField
              control={control}
              label="Network"
              name="ss_network"
              options={["tcp", "udp", "tcp,udp"]}
            />
            <InputField
              control={control}
              label="Method"
              name="ss_method"
              placeholder="2022-blake3-aes-128-gcm"
            />
            <InputField control={control} label="Password" name="ss_password" />
            <InputField
              control={control}
              label="Email"
              name="email"
              placeholder="user@example.com"
            />
            <InputField
              control={control}
              label="Level"
              name="user_level"
              type="number"
            />
          </div>
          <JsonField
            control={control}
            description='Optional multi-user ClientObject[]: [{"password":"pass","method":"aes-256-gcm","level":0,"email":"user@example.com"}]'
            label="Clients"
            name="ss_clients_json"
          />
        </div>
      );
    }
    if (protocol === "socks") {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectField
            control={control}
            label="Auth"
            name="socks_auth"
            options={["noauth", "password"]}
          />
          <SwitchField control={control} label="UDP" name="socks_udp" />
          <InputField control={control} label="UDP IP" name="socks_ip" />
          <InputField
            control={control}
            label="User Level"
            name="user_level"
            type="number"
          />
          <div className="md:col-span-2">
            <JsonField
              control={control}
              description='AccountObject[]: [{"user":"username","pass":"password"}]'
              label="Accounts"
              name="accounts_json"
            />
          </div>
        </div>
      );
    }
    if (protocol === "http") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SwitchField
              control={control}
              label="Allow Transparent"
              name="allow_transparent"
            />
            <InputField
              control={control}
              label="User Level"
              name="user_level"
              type="number"
            />
          </div>
          <JsonField
            control={control}
            description='AccountObject[]: [{"user":"username","pass":"password"}]'
            label="Accounts"
            name="accounts_json"
          />
        </div>
      );
    }
    if (protocol === "dokodemo-door") {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InputField
            control={control}
            label="Address"
            name="dokodemo_address"
          />
          <InputField
            control={control}
            label="Target Port"
            name="dokodemo_port"
            type="number"
          />
          <SelectField
            control={control}
            label="Network"
            name="dokodemo_network"
            options={["tcp", "udp", "tcp,udp"]}
          />
          <SwitchField
            control={control}
            label="Follow Redirect"
            name="follow_redirect"
          />
          <InputField
            control={control}
            label="User Level"
            name="user_level"
            type="number"
          />
          <div className="md:col-span-2">
            <JsonField
              control={control}
              description='portMap object: {"5555":"1.1.1.1:7777","5556":":8888"}'
              label="Port Map"
              name="dokodemo_port_map_json"
            />
          </div>
        </div>
      );
    }
    if (protocol === "wireguard") {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputField
              control={control}
              label="Secret Key"
              name="wg_secret_key"
            />
            <InputField
              control={control}
              label="MTU"
              name="wg_mtu"
              type="number"
            />
          </div>
          <JsonField
            control={control}
            description='Peers[]: [{"publicKey":"PUBLIC_KEY","allowedIPs":["0.0.0.0/0","::/0"]}]'
            label="Peers"
            name="wg_peers_json"
          />
        </div>
      );
    }
    if (protocol === "hysteria") {
      return (
        <div className="space-y-4">
          <InputField
            control={control}
            description="官方要求固定为 2。"
            label="Version"
            name="hysteria_version"
            type="number"
          />
          <JsonField
            control={control}
            description='ClientObject[]: [{"auth":"password-or-uuid","level":0,"email":"user@example.com"}]'
            label="Clients"
            name="hysteria_clients_json"
          />
        </div>
      );
    }
    if (protocol === "tun") {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InputField control={control} label="Name" name="tun_name" />
          <InputField
            control={control}
            label="MTU"
            name="tun_mtu"
            type="number"
          />
          <InputField
            control={control}
            label="User Level"
            name="user_level"
            type="number"
          />
        </div>
      );
    }
  }

  if (type === "outbound" && protocol === "dns") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SelectField
            control={control}
            label="Network"
            name="dns_out_network"
            options={["tcp", "udp"]}
          />
          <InputField
            control={control}
            label="Address"
            name="dns_out_address"
            placeholder="1.1.1.1"
          />
          <InputField
            control={control}
            label="Port"
            name="dns_out_port"
            type="number"
          />
          <InputField
            control={control}
            label="User Level"
            name="user_level"
            type="number"
          />
        </div>
        <JsonField
          control={control}
          description='DNS RuleObject[]: [{"action":"reject","domain":["domain:example.com"]},{"action":"direct","qtype":65}]'
          label="Rules"
          name="dns_out_rules_json"
        />
      </div>
    );
  }

  if (type === "outbound" && protocol === "loopback") {
    return (
      <InputField
        control={control}
        description="重新送入路由时使用的 inboundTag。"
        label="Inbound Tag"
        name="loopback_inbound_tag"
      />
    );
  }

  if (type === "outbound" && protocol === "wireguard") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InputField
            control={control}
            label="Secret Key"
            name="wg_secret_key"
          />
          <InputField
            control={control}
            label="MTU"
            name="wg_mtu"
            type="number"
          />
          <SwitchField
            control={control}
            label="No Kernel TUN"
            name="wg_no_kernel_tun"
          />
          <InputField
            control={control}
            label="Workers"
            name="wg_workers"
            type="number"
          />
          <InputField
            control={control}
            label="Domain Strategy"
            name="wg_domain_strategy"
            placeholder="ForceIP"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name="wg_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormDescription>一行一个 WireGuard 本地地址。</FormDescription>
                <FormControl>
                  <Textarea
                    className="min-h-24"
                    onChange={field.onChange}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <JsonField
            control={control}
            description="reserved array: [1,2,3]"
            label="Reserved"
            name="wg_reserved_json"
          />
        </div>
        <JsonField
          control={control}
          description='Peers[]: [{"endpoint":"example.com:51820","publicKey":"PUBLIC_KEY"}]'
          label="Peers"
          name="wg_peers_json"
        />
      </div>
    );
  }

  if (type === "outbound" && protocol === "hysteria") {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InputField
          control={control}
          description="官方要求固定为 2。"
          label="Version"
          name="hysteria_version"
          type="number"
        />
        <InputField control={control} label="Address" name="out_address" />
        <InputField
          control={control}
          label="Port"
          name="out_port"
          type="number"
        />
      </div>
    );
  }

  if (
    type === "outbound" &&
    ["vless", "vmess", "trojan", "shadowsocks", "socks", "http"].includes(
      protocol || ""
    )
  ) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InputField control={control} label="Address" name="out_address" />
          <InputField
            control={control}
            label="Port"
            name="out_port"
            type="number"
          />
          <InputField
            control={control}
            label="Level"
            name="user_level"
            type="number"
          />
          {["vless", "vmess"].includes(protocol || "") ? (
            <InputField control={control} label="ID" name="out_id" />
          ) : null}
          {protocol === "vless" ? (
            <>
              <InputField
                control={control}
                label="Encryption"
                name="out_encryption"
                placeholder="none"
              />
              <InputField
                control={control}
                label="Flow"
                name="out_flow"
                placeholder="xtls-rprx-vision"
              />
            </>
          ) : null}
          {protocol === "vmess" ? (
            <>
              <InputField
                control={control}
                label="Security"
                name="out_security"
                placeholder="auto"
              />
              <InputField
                control={control}
                label="Experiments"
                name="out_experiments"
              />
            </>
          ) : null}
          {protocol === "trojan" ? (
            <InputField
              control={control}
              label="Password"
              name="out_password"
            />
          ) : null}
          {protocol === "shadowsocks" ? (
            <>
              <InputField
                control={control}
                label="Method"
                name="ss_method"
                placeholder="2022-blake3-aes-128-gcm"
              />
              <InputField
                control={control}
                label="Password"
                name="ss_password"
              />
              <SwitchField control={control} label="UoT" name="ss_uot" />
              <InputField
                control={control}
                label="UoT Version"
                name="ss_uot_version"
                type="number"
              />
            </>
          ) : null}
          {["socks", "http"].includes(protocol || "") ? (
            <>
              <InputField control={control} label="User" name="out_user" />
              <InputField control={control} label="Password" name="out_pass" />
            </>
          ) : null}
          {["trojan", "shadowsocks", "socks", "http"].includes(
            protocol || ""
          ) ? (
            <InputField
              control={control}
              label="Email"
              name="email"
              placeholder="user@example.com"
            />
          ) : null}
        </div>
        {protocol === "http" ? (
          <JsonField
            control={control}
            description='HTTP headers object: {"User-Agent":"Mozilla/5.0"}'
            label="Headers"
            name="headers_json"
          />
        ) : null}
      </div>
    );
  }

  return null;
}

export default function XrayTemplateForm({
  trigger,
  title,
  loading,
  initialValues,
  onSubmit,
}: {
  trigger: React.ReactNode;
  title: string;
  loading?: boolean;
  initialValues?: Partial<API.XrayTemplate>;
  onSubmit: (values: TemplatePayload) => Promise<boolean> | boolean;
}) {
  const { t } = useTranslation("xray-templates");
  const [open, setOpen] = useState(false);
  const [advancedTouched, setAdvancedTouched] = useState(false);
  const initialType = initialValues?.type || "inbound";

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues(initialType),
      name: initialValues?.name || "",
      type: initialType,
      description: initialValues?.description || "",
      enabled: initialValues?.enabled ?? true,
      config: initialValues?.config || {},
      config_template: initialValues?.config_template || "",
      variables_schema_json: formatJson(initialValues?.variables_schema || {}),
      default_variables_json: formatJson(
        initialValues?.default_variables || {}
      ),
      subscription_meta_json: formatJson(
        initialValues?.subscription_meta || {}
      ),
      ...configToFormValues(initialType, initialValues?.config),
    },
  });

  const type = useWatch({ control: form.control, name: "type" });
  const protocol = useWatch({ control: form.control, name: "protocol" });
  const security = useWatch({ control: form.control, name: "security" });
  const network = useWatch({ control: form.control, name: "network" });
  const supportsStreamSettings = !(
    (type === "inbound" && ["tun", "wireguard"].includes(protocol || "")) ||
    (type === "outbound" &&
      ["dns", "loopback", "wireguard"].includes(protocol || ""))
  );

  const protocolOptions = useMemo(
    () => (type === "outbound" ? OUTBOUND_PROTOCOLS : INBOUND_PROTOCOLS),
    [type]
  );

  useEffect(() => {
    if (!open) return;
    setAdvancedTouched(false);
    const nextType = initialValues?.type || "inbound";
    form.reset({
      ...defaultValues(nextType),
      name: initialValues?.name || "",
      type: nextType,
      description: initialValues?.description || "",
      enabled: initialValues?.enabled ?? true,
      config: initialValues?.config || {},
      config_template: initialValues?.config_template || "",
      variables_schema_json: formatJson(initialValues?.variables_schema || {}),
      default_variables_json: formatJson(
        initialValues?.default_variables || {}
      ),
      subscription_meta_json: formatJson(
        initialValues?.subscription_meta || {}
      ),
      ...configToFormValues(nextType, initialValues?.config),
    });
  }, [form, initialValues?.id, open]);

  useEffect(() => {
    if (type === "dns" || type === "routing") return;
    const options =
      type === "outbound" ? OUTBOUND_PROTOCOLS : INBOUND_PROTOCOLS;
    if (!options.includes(protocol as any)) {
      form.setValue("protocol", options[0]);
    }
  }, [form, protocol, type]);

  function buildConfig(values: FormValues) {
    const source = advancedTouched ? values : { ...values, advanced_json: "" };
    if (source.type === "routing") {
      return buildRoutingConfig(source);
    }
    if (source.type === "dns") return buildDnsConfig(source);
    if (source.type === "outbound") return buildOutboundConfig(source);
    return buildInboundConfig(source);
  }

  function validateXrayConfig(values: FormValues, config: Record<string, any>) {
    const stream = config.streamSettings || {};
    const reality = stream.realitySettings || {};
    if (values.type !== "inbound" || stream.security !== "reality") {
      return true;
    }
    if (!(reality.target || reality.dest)) {
      form.setError("reality_target", {
        message:
          "REALITY 入站必须填写 Target，例如 ebay.com:443。缺少 target 时 xray-core 会把它当成客户端配置解析。",
      });
      return false;
    }
    if (!reality.serverNames?.length) {
      form.setError("reality_server_names", {
        message:
          "REALITY 入站必须填写 Server Names，例如 ebay.com, www.ebay.com。",
      });
      return false;
    }
    if (!reality.privateKey) {
      form.setError("reality_private_key", {
        message: "REALITY 入站必须填写 Private Key。",
      });
      return false;
    }
    if (!reality.shortIds?.length) {
      form.setError("reality_short_ids", {
        message: "REALITY 入站必须填写 Short IDs。",
      });
      return false;
    }
    return true;
  }

  async function handleSubmit(values: FormValues) {
    const config = buildConfig(values);
    if (!validateXrayConfig(values, config)) return;
    const ok = await onSubmit({
      name: values.name,
      type: values.type,
      description: values.description,
      enabled: values.enabled,
      config,
      config_template: values.config_template,
      variables_schema: safeJsonParse(values.variables_schema_json || "", {}),
      default_variables: safeJsonParse(values.default_variables_json || "", {}),
      subscription_meta: safeJsonParse(values.subscription_meta_json || "", {}),
    });
    if (ok) {
      setOpen(false);
    }
  }

  function syncAdvancedJson() {
    const config = buildConfig(form.getValues());
    form.setValue("advanced_json", formatJson(config));
    setAdvancedTouched(true);
  }

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-[760px] max-w-full md:max-w-4xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100dvh-48px-36px-36px-env(safe-area-inset-top))] px-6">
          <Form {...form}>
            <form
              className="space-y-5 pt-4"
              id="xray-template-form"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.name", "Name")}</FormLabel>
                      <FormControl>
                        <EnhancedInput
                          onValueChange={field.onChange}
                          placeholder={t(
                            "form.namePlaceholder",
                            "Template name"
                          )}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.type", "Type")}</FormLabel>
                      <Select
                        disabled={Boolean(initialValues?.id)}
                        onValueChange={(value) => {
                          const next = value as XrayTemplateType;
                          setAdvancedTouched(false);
                          form.reset({
                            ...defaultValues(next),
                            name: form.getValues("name"),
                            type: next,
                            description: form.getValues("description"),
                            enabled: form.getValues("enabled"),
                          });
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {XRAY_TEMPLATE_TYPES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {t(`type.${item}`, item)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t("form.description", "Description")}
                      </FormLabel>
                      <FormControl>
                        <EnhancedInput
                          onValueChange={field.onChange}
                          placeholder={t(
                            "form.descriptionPlaceholder",
                            "Optional note"
                          )}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <SwitchField
                  control={form.control}
                  label={t("form.enabled", "Enabled")}
                  name="enabled"
                />
              </div>

              <Tabs defaultValue="form">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="form">
                    {t("tabs.form", "Form")}
                  </TabsTrigger>
                  <TabsTrigger value="advanced">
                    {t("tabs.advanced", "Advanced JSON")}
                  </TabsTrigger>
                  <TabsTrigger value="template">
                    {t("tabs.template", "Template")}
                  </TabsTrigger>
                  <TabsTrigger value="subscription">
                    {t("tabs.subscription", "Subscription")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent className="space-y-4 pt-4" value="form">
                  {type === "routing" ? (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="routing_domain_strategy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("form.domainStrategy", "Domain Strategy")}
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ROUTING_DOMAIN_STRATEGIES.map((item) => (
                                  <SelectItem key={item} value={item}>
                                    {item}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="routing_rules_json"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("form.routingRules", "Routing Rules")}
                              </FormLabel>
                              <FormDescription>
                                {t(
                                  "form.routingRulesDesc",
                                  "JSON array of RuleObject. Use inboundTag/outboundTag with template aliases."
                                )}
                              </FormDescription>
                              <FormControl>
                                <JsonTextarea
                                  onChange={field.onChange}
                                  placeholder='[{"type":"field","inboundTag":["{{ .Ref.inbound.main.tag }}"],"outboundTag":"direct"}]'
                                  value={field.value}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="routing_balancers_json"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("form.routingBalancers", "Balancers")}
                              </FormLabel>
                              <FormDescription>
                                {t(
                                  "form.routingBalancersDesc",
                                  "JSON array of BalancerObject."
                                )}
                              </FormDescription>
                              <FormControl>
                                <JsonTextarea
                                  onChange={field.onChange}
                                  placeholder='[{"tag":"auto","selector":["proxy"]}]'
                                  value={field.value}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ) : type !== "dns" ? (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FormField
                          control={form.control}
                          name="protocol"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("form.protocol", "Protocol")}
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {protocolOptions.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="tag"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("form.tag", "Tag")}</FormLabel>
                              <FormControl>
                                <EnhancedInput
                                  onValueChange={field.onChange}
                                  placeholder="proxy-in"
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {type === "inbound" ? (
                          <FormField
                            control={form.control}
                            name="port"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("form.port", "Port")}</FormLabel>
                                <FormControl>
                                  <EnhancedInput
                                    max={65_535}
                                    min={1}
                                    onValueChange={field.onChange}
                                    placeholder="443"
                                    type="number"
                                    value={field.value}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : null}
                        {type === "inbound" ? (
                          <FormField
                            control={form.control}
                            name="listen"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {t("form.listen", "Listen")}
                                </FormLabel>
                                <FormControl>
                                  <EnhancedInput
                                    onValueChange={field.onChange}
                                    placeholder="0.0.0.0"
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : null}
                        {supportsStreamSettings ? (
                          <>
                            <FormField
                              control={form.control}
                              name="network"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t("form.network", "Network")}
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {NETWORKS.map((item) => (
                                        <SelectItem key={item} value={item}>
                                          {item}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="security"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t("form.security", "Security")}
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {SECURITIES.map((item) => (
                                        <SelectItem key={item} value={item}>
                                          {item}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </>
                        ) : null}
                      </div>

                      {supportsStreamSettings &&
                      ["ws", "xhttp", "httpupgrade"].includes(network || "") ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="host"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("form.host", "Host")}</FormLabel>
                                <FormControl>
                                  <EnhancedInput
                                    onValueChange={field.onChange}
                                    placeholder="example.com"
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="path"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("form.path", "Path")}</FormLabel>
                                <FormControl>
                                  <EnhancedInput
                                    onValueChange={field.onChange}
                                    placeholder="/ray"
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : null}

                      {supportsStreamSettings && network === "grpc" ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <InputField
                            control={form.control}
                            label={t("form.serviceName", "Service Name")}
                            name="service_name"
                          />
                          <InputField
                            control={form.control}
                            label={t("form.grpcAuthority", "Authority")}
                            name="grpc_authority"
                          />
                          <SwitchField
                            control={form.control}
                            label={t("form.grpcMultiMode", "Multi Mode")}
                            name="grpc_multi_mode"
                          />
                          <InputField
                            control={form.control}
                            label={t("form.grpcIdleTimeout", "Idle Timeout")}
                            name="grpc_idle_timeout"
                            type="number"
                          />
                          <InputField
                            control={form.control}
                            label={t(
                              "form.grpcHealthCheckTimeout",
                              "Health Check Timeout"
                            )}
                            name="grpc_health_check_timeout"
                            type="number"
                          />
                        </div>
                      ) : null}

                      {supportsStreamSettings && network === "kcp" ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <InputField
                            control={form.control}
                            label="MTU"
                            name="kcp_mtu"
                            type="number"
                          />
                          <InputField
                            control={form.control}
                            label="TTI"
                            name="kcp_tti"
                            type="number"
                          />
                          <InputField
                            control={form.control}
                            label="Uplink Capacity"
                            name="kcp_uplink_capacity"
                            type="number"
                          />
                          <InputField
                            control={form.control}
                            label="Downlink Capacity"
                            name="kcp_downlink_capacity"
                            type="number"
                          />
                          <SwitchField
                            control={form.control}
                            label="Congestion"
                            name="kcp_congestion"
                          />
                          <InputField
                            control={form.control}
                            label="Header Type"
                            name="kcp_header_type"
                            placeholder="none / srtp / utp / wechat-video"
                          />
                        </div>
                      ) : null}

                      {supportsStreamSettings &&
                      ["raw", "tcp", "kcp", "hysteria"].includes(
                        network || ""
                      ) ? (
                        <FormField
                          control={form.control}
                          name={
                            network === "kcp"
                              ? "kcp_settings_json"
                              : network === "hysteria"
                                ? "hysteria_settings_json"
                                : "raw_settings_json"
                          }
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {network === "kcp"
                                  ? t("form.kcpSettings", "KCP Settings")
                                  : network === "hysteria"
                                    ? t(
                                        "form.hysteriaSettings",
                                        "Hysteria Settings"
                                      )
                                    : t("form.rawSettings", "Raw Settings")}
                              </FormLabel>
                              <FormDescription>
                                {network === "kcp"
                                  ? "KcpObject advanced fields. Form values above are merged first, this JSON can override or add rare fields."
                                  : network === "hysteria"
                                    ? "HysteriaObject for streamSettings.hysteriaSettings."
                                    : "RawObject for streamSettings.rawSettings."}
                              </FormDescription>
                              <FormControl>
                                <JsonTextarea
                                  onChange={field.onChange}
                                  value={field.value}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}

                      {supportsStreamSettings &&
                      (security === "tls" ||
                        (security === "reality" && type === "outbound")) ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="sni"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("form.sni", "SNI")}</FormLabel>
                                <FormControl>
                                  <EnhancedInput
                                    onValueChange={field.onChange}
                                    placeholder="example.com"
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {security === "tls" ||
                          (security === "reality" && type === "outbound") ? (
                            <FormField
                              control={form.control}
                              name="fingerprint"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t("form.fingerprint", "Fingerprint")}
                                  </FormLabel>
                                  <FormControl>
                                    <EnhancedInput
                                      onValueChange={field.onChange}
                                      placeholder="chrome"
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ) : null}
                          {security === "tls" ? (
                            <SwitchField
                              control={form.control}
                              label={t("form.allowInsecure", "Allow Insecure")}
                              name="allow_insecure"
                            />
                          ) : null}
                        </div>
                      ) : null}

                      {supportsStreamSettings && security === "reality" ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="flex justify-end gap-2 md:col-span-2">
                            {type === "inbound" ? (
                              <Button
                                onClick={() => {
                                  const pair = generateRealityKeyPair();
                                  form.setValue(
                                    "reality_private_key",
                                    pair.privateKey
                                  );
                                  form.setValue(
                                    "reality_public_key",
                                    pair.publicKey
                                  );
                                }}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                {t("form.generateRealityKey", "Generate Key")}
                              </Button>
                            ) : null}
                            <Button
                              onClick={() => {
                                const next = generateRealityShortId();
                                if (type === "outbound") {
                                  form.setValue("reality_short_id", next);
                                } else {
                                  const current =
                                    form.getValues("reality_short_ids") || "";
                                  form.setValue(
                                    "reality_short_ids",
                                    current ? `${current}, ${next}` : next
                                  );
                                }
                              }}
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              {t("form.generateShortId", "Generate Short ID")}
                            </Button>
                          </div>
                          {type === "inbound" ? (
                            <>
                              <SwitchField
                                control={form.control}
                                label="Show"
                                name="reality_show"
                              />
                              <InputField
                                control={form.control}
                                description="必填。REALITY 服务端目标站点，当前 Xray 字段是 target；例如 ebay.com:443。缺少时会被 xray-core 当成客户端 REALITY 配置解析。"
                                label="Target"
                                name="reality_target"
                                placeholder="example.com:443"
                              />
                              <InputField
                                control={form.control}
                                description="必填。REALITY 服务端允许的 SNI 列表，多个值用英文逗号分隔。"
                                label="Server Names"
                                name="reality_server_names"
                                placeholder="example.com, www.example.com"
                              />
                              <InputField
                                control={form.control}
                                label="XVer"
                                name="reality_xver"
                                type="number"
                              />
                              <InputField
                                control={form.control}
                                label={t("form.realityShortIds", "Short IDs")}
                                name="reality_short_ids"
                                placeholder="comma separated"
                              />
                              <InputField
                                control={form.control}
                                label={t(
                                  "form.realityPrivateKey",
                                  "Private Key"
                                )}
                                name="reality_private_key"
                              />
                              <InputField
                                control={form.control}
                                label="Min Client Ver"
                                name="reality_min_client_ver"
                              />
                              <InputField
                                control={form.control}
                                label="Max Client Ver"
                                name="reality_max_client_ver"
                              />
                              <InputField
                                control={form.control}
                                label="Max Time Diff"
                                name="reality_max_time_diff"
                                type="number"
                              />
                            </>
                          ) : (
                            <>
                              <InputField
                                control={form.control}
                                description="Reality client uses password for the server public key."
                                label="Public Key / Password"
                                name="reality_public_key"
                              />
                              <InputField
                                control={form.control}
                                label="Short ID"
                                name="reality_short_id"
                              />
                              <InputField
                                control={form.control}
                                label="Spider X"
                                name="reality_spider_x"
                                placeholder="/"
                              />
                            </>
                          )}
                        </div>
                      ) : null}

                      {supportsStreamSettings ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="sockopt_json"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {t("form.sockopt", "Sockopt")}
                                </FormLabel>
                                <FormDescription>
                                  SockoptObject JSON, e.g.{" "}
                                  {
                                    '{"mark":255,"tproxy":"tproxy","dialerProxy":"proxy"}'
                                  }
                                </FormDescription>
                                <FormControl>
                                  <JsonTextarea
                                    onChange={field.onChange}
                                    value={field.value}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="finalmask_json"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {t("form.finalmask", "Final Mask")}
                                </FormLabel>
                                <FormDescription>
                                  FinalMaskObject JSON with tcp/udp/quicParams
                                  fields.
                                </FormDescription>
                                <FormControl>
                                  <JsonTextarea
                                    onChange={field.onChange}
                                    value={field.value}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : null}

                      {type === "inbound" ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <SwitchField
                            control={form.control}
                            label={t("form.sniffing", "Sniffing")}
                            name="sniffing"
                          />
                          <SwitchField
                            control={form.control}
                            label={t(
                              "form.sniffingMetadataOnly",
                              "Metadata Only"
                            )}
                            name="sniffing_metadata_only"
                          />
                          <SwitchField
                            control={form.control}
                            label={t("form.sniffingRouteOnly", "Route Only")}
                            name="sniffing_route_only"
                          />
                          <FormField
                            control={form.control}
                            name="dest_override"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {t("form.destOverride", "Dest Override")}
                                </FormLabel>
                                <FormControl>
                                  <EnhancedInput
                                    onValueChange={field.onChange}
                                    placeholder="http, tls, quic"
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="sniffing_domains_excluded"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {t(
                                    "form.sniffingDomainsExcluded",
                                    "Domains Excluded"
                                  )}
                                </FormLabel>
                                <FormControl>
                                  <EnhancedInput
                                    onValueChange={field.onChange}
                                    placeholder="example.com, geosite:cn"
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ) : null}

                      {type === "outbound" && protocol === "freedom" ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="domain_strategy"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t(
                                      "form.domainStrategy",
                                      "Domain Strategy"
                                    )}
                                  </FormLabel>
                                  <FormControl>
                                    <EnhancedInput
                                      onValueChange={field.onChange}
                                      placeholder="AsIs / UseIP / UseIPv4 / UseIPv6"
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="redirect"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>
                                    {t("form.redirect", "Redirect")}
                                  </FormLabel>
                                  <FormControl>
                                    <EnhancedInput
                                      onValueChange={field.onChange}
                                      placeholder="127.0.0.1:3366"
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <InputField
                              control={form.control}
                              label="User Level"
                              name="user_level"
                              type="number"
                            />
                            <InputField
                              control={form.control}
                              label="Proxy Protocol"
                              name="proxy_protocol"
                              type="number"
                            />
                          </div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <JsonField
                              control={form.control}
                              description='Freedom fragment object: {"packets":"tlshello","length":"100-200","interval":"10-20"}'
                              label="Fragment"
                              name="fragment_json"
                            />
                            <JsonField
                              control={form.control}
                              description='Freedom noises array: [{"type":"base64","packet":"...","delay":"10-16"}]'
                              label="Noises"
                              name="noises_json"
                            />
                          </div>
                        </div>
                      ) : null}

                      {type === "outbound" && protocol === "blackhole" ? (
                        <FormField
                          control={form.control}
                          name="response_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("form.responseType", "Response Type")}
                              </FormLabel>
                              <FormControl>
                                <EnhancedInput
                                  onValueChange={field.onChange}
                                  placeholder="http"
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}

                      <ProtocolSettingsFields
                        control={form.control}
                        protocol={protocol}
                        type={type}
                      />

                      <FormField
                        control={form.control}
                        name="settings_json"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("form.settingsJson", "Settings JSON")}
                            </FormLabel>
                            <FormDescription>
                              {t(
                                "form.settingsJsonDesc",
                                "Protocol-specific Xray settings. These fields are kept as JSON so advanced protocol details are not lost."
                              )}
                            </FormDescription>
                            <FormControl>
                              <JsonTextarea
                                onChange={field.onChange}
                                value={field.value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="tag"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("form.tag", "Tag")}</FormLabel>
                              <FormControl>
                                <EnhancedInput
                                  onValueChange={field.onChange}
                                  placeholder="dns"
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="client_ip"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("form.clientIp", "Client IP")}
                              </FormLabel>
                              <FormControl>
                                <EnhancedInput
                                  onValueChange={field.onChange}
                                  placeholder="1.2.3.4"
                                  value={field.value || ""}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="servers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("form.dnsServers", "DNS Servers")}
                            </FormLabel>
                            <FormDescription>
                              {t(
                                "form.dnsServersDesc",
                                "One server per line. Plain strings are supported, e.g. 1.1.1.1, https://dns.google/dns-query."
                              )}
                            </FormDescription>
                            <FormControl>
                              <Textarea
                                className="min-h-28"
                                onChange={field.onChange}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dns_servers_json"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("form.dnsServerObjects", "DNS Server Objects")}
                            </FormLabel>
                            <FormDescription>
                              {t(
                                "form.dnsServerObjectsDesc",
                                "JSON array of DnsServerObject, e.g. address/domains/expectedIPs/skipFallback/queryStrategy."
                              )}
                            </FormDescription>
                            <FormControl>
                              <JsonTextarea
                                onChange={field.onChange}
                                placeholder='[{"address":"https://dns.google/dns-query","domains":["geosite:geolocation-!cn"],"skipFallback":true}]'
                                value={field.value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="query_strategy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("form.queryStrategy", "Query Strategy")}
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {QUERY_STRATEGIES.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <SwitchField
                          control={form.control}
                          label={t("form.disableCache", "Disable Cache")}
                          name="disable_cache"
                        />
                        <SwitchField
                          control={form.control}
                          label={t("form.serveStale", "Serve Stale")}
                          name="serve_stale"
                        />
                        <FormField
                          control={form.control}
                          name="serve_expired_ttl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t("form.serveExpiredTtl", "Serve Expired TTL")}
                              </FormLabel>
                              <FormControl>
                                <EnhancedInput
                                  min={0}
                                  onValueChange={field.onChange}
                                  type="number"
                                  value={field.value}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <SwitchField
                          control={form.control}
                          label={t("form.disableFallback", "Disable Fallback")}
                          name="disable_fallback"
                        />
                        <SwitchField
                          control={form.control}
                          label={t(
                            "form.disableFallbackIfMatch",
                            "Disable Fallback If Match"
                          )}
                          name="disable_fallback_if_match"
                        />
                        <SwitchField
                          control={form.control}
                          label={t(
                            "form.enableParallelQuery",
                            "Enable Parallel Query"
                          )}
                          name="enable_parallel_query"
                        />
                        <SwitchField
                          control={form.control}
                          label={t("form.useSystemHosts", "Use System Hosts")}
                          name="use_system_hosts"
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="hosts_json"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {t("form.hostsJson", "Hosts JSON")}
                            </FormLabel>
                            <FormControl>
                              <JsonTextarea
                                onChange={field.onChange}
                                value={field.value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </TabsContent>

                <TabsContent className="space-y-3 pt-4" value="advanced">
                  <div className="flex justify-end">
                    <Button
                      onClick={syncAdvancedJson}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {t("form.syncJson", "Sync from form")}
                    </Button>
                  </div>
                  <FormField
                    control={form.control}
                    name="advanced_json"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("form.advancedJson", "Advanced JSON")}
                        </FormLabel>
                        <FormControl>
                          <JsonTextarea
                            onChange={(value) => {
                              setAdvancedTouched(true);
                              field.onChange(value);
                            }}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent className="space-y-4 pt-4" value="template">
                  <FormField
                    control={form.control}
                    name="config_template"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("form.configTemplate", "Config Template")}
                        </FormLabel>
                        <FormDescription>
                          {t(
                            "form.configTemplateDesc",
                            "Optional Go template for the final Xray JSON. Context supports Server/server, Vars/vars and Ref/ref."
                          )}
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            className="min-h-52 font-mono text-xs"
                            onChange={field.onChange}
                            placeholder='{"tag":"{{ .Vars.tag }}","port":{{ .Vars.port }}}'
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="variables_schema_json"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("form.variablesSchema", "Variables Schema")}
                          </FormLabel>
                          <FormControl>
                            <JsonTextarea
                              onChange={field.onChange}
                              value={field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="default_variables_json"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("form.defaultVariables", "Default Variables")}
                          </FormLabel>
                          <FormControl>
                            <JsonTextarea
                              onChange={field.onChange}
                              value={field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                <TabsContent className="space-y-4 pt-4" value="subscription">
                  <FormField
                    control={form.control}
                    name="subscription_meta_json"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("form.subscriptionMeta", "Subscription Meta")}
                        </FormLabel>
                        <FormDescription>
                          {t(
                            "form.subscriptionMetaDesc",
                            "Inbound templates can map rendered variables into subscription Proxy fields such as type, port, security, transport and sni."
                          )}
                        </FormDescription>
                        <FormControl>
                          <JsonTextarea
                            onChange={field.onChange}
                            placeholder='{"type":"vless","port":"{{ .Vars.port }}","security":"tls"}'
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </ScrollArea>

        <SheetFooter className="flex-row justify-end gap-2 pt-3">
          <Button
            onClick={() => setOpen(false)}
            type="button"
            variant="outline"
          >
            {t("form.cancel", "Cancel")}
          </Button>
          <Button disabled={loading} onClick={form.handleSubmit(handleSubmit)}>
            {loading ? (
              <Icon className="mr-2 animate-spin" icon="mdi:loading" />
            ) : null}
            {t("form.confirm", "Confirm")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

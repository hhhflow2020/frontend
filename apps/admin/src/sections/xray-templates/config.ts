export type XrayTemplateType = "inbound" | "outbound" | "dns" | "routing";

export const XRAY_TEMPLATE_TYPES: XrayTemplateType[] = [
  "inbound",
  "outbound",
  "dns",
  "routing",
];

export const INBOUND_PROTOCOLS = [
  "vless",
  "vmess",
  "trojan",
  "shadowsocks",
  "socks",
  "http",
  "dokodemo-door",
  "wireguard",
  "hysteria",
  "tun",
] as const;

export const OUTBOUND_PROTOCOLS = [
  "freedom",
  "blackhole",
  "dns",
  "loopback",
  "socks",
  "http",
  "shadowsocks",
  "vless",
  "vmess",
  "trojan",
  "wireguard",
  "hysteria",
] as const;

export const NETWORKS = [
  "raw",
  "tcp",
  "ws",
  "grpc",
  "xhttp",
  "httpupgrade",
  "kcp",
  "hysteria",
] as const;
export const SECURITIES = ["none", "tls", "reality"] as const;
export const QUERY_STRATEGIES = [
  "UseIP",
  "UseIPv4",
  "UseIPv6",
  "UseSystem",
] as const;
export const ROUTING_DOMAIN_STRATEGIES = [
  "AsIs",
  "IPIfNonMatch",
  "IPOnDemand",
] as const;

export function safeJsonParse<T>(value: string, fallback: T): T {
  if (!value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function formatJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function hasAdvancedJson(value?: string) {
  if (!value?.trim()) return false;
  const parsed = safeJsonParse(value, undefined);
  if (parsed === undefined || parsed === null) return false;
  if (
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    Object.keys(parsed).length === 0
  ) {
    return false;
  }
  return true;
}

export function linesToArray(value?: string) {
  return (value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function arrayToLines(value?: unknown) {
  return Array.isArray(value) ? value.join("\n") : "";
}

export function splitCsv(value?: string) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinCsv(value?: unknown) {
  return Array.isArray(value) ? value.join(", ") : "";
}

function emptyToUndefined(value: unknown) {
  return value === "" || value === null ? undefined : value;
}

function numberToUndefined(value: unknown) {
  if (value === "" || value === null || value === undefined) return;
  const number = Number(value);
  return Number.isNaN(number) ? undefined : number;
}

function mergeSettings(
  generated: Record<string, any>,
  extraJson?: string
): Record<string, any> {
  const extra = safeJsonParse<Record<string, any>>(extraJson || "", {});
  return compactObject({ ...generated, ...extra });
}

function omitKeys(value: Record<string, any>, keys: string[]) {
  const result = { ...value };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

function settingsExtra(
  type: XrayTemplateType,
  protocol: string,
  settings: Record<string, any>
) {
  if (type === "inbound") {
    if (["vless", "trojan"].includes(protocol)) {
      return omitKeys(settings, ["clients", "decryption", "fallbacks"]);
    }
    if (protocol === "vmess") {
      return omitKeys(settings, ["clients", "default"]);
    }
    if (protocol === "shadowsocks") {
      return omitKeys(settings, [
        "network",
        "method",
        "password",
        "level",
        "email",
        "clients",
      ]);
    }
    if (protocol === "socks") {
      return omitKeys(settings, ["auth", "accounts", "udp", "ip", "userLevel"]);
    }
    if (protocol === "http") {
      return omitKeys(settings, ["accounts", "allowTransparent", "userLevel"]);
    }
    if (protocol === "dokodemo-door") {
      return omitKeys(settings, [
        "address",
        "port",
        "portMap",
        "network",
        "followRedirect",
        "userLevel",
      ]);
    }
    if (protocol === "wireguard") {
      return omitKeys(settings, ["secretKey", "peers", "mtu"]);
    }
    if (protocol === "hysteria") {
      return omitKeys(settings, ["version", "clients"]);
    }
    if (protocol === "tun") {
      return omitKeys(settings, ["name", "MTU", "UserLevel", "userLevel"]);
    }
  }

  if (type === "outbound") {
    if (protocol === "freedom") {
      return omitKeys(settings, [
        "domainStrategy",
        "redirect",
        "userLevel",
        "fragment",
        "noises",
        "proxyProtocol",
      ]);
    }
    if (protocol === "blackhole") {
      return omitKeys(settings, ["response"]);
    }
    if (protocol === "vless") {
      return omitKeys(settings, [
        "address",
        "port",
        "id",
        "encryption",
        "flow",
        "level",
      ]);
    }
    if (protocol === "vmess") {
      return omitKeys(settings, [
        "address",
        "port",
        "id",
        "security",
        "level",
        "experiments",
      ]);
    }
    if (protocol === "trojan") {
      return omitKeys(settings, [
        "address",
        "port",
        "password",
        "email",
        "level",
      ]);
    }
    if (protocol === "shadowsocks") {
      return omitKeys(settings, [
        "address",
        "port",
        "method",
        "password",
        "level",
        "email",
        "uot",
        "UoTVersion",
      ]);
    }
    if (protocol === "socks") {
      return omitKeys(settings, [
        "address",
        "port",
        "user",
        "pass",
        "level",
        "email",
      ]);
    }
    if (protocol === "http") {
      return omitKeys(settings, [
        "address",
        "port",
        "user",
        "pass",
        "level",
        "email",
        "headers",
      ]);
    }
    if (protocol === "dns") {
      return omitKeys(settings, [
        "network",
        "address",
        "port",
        "userLevel",
        "rules",
      ]);
    }
    if (protocol === "loopback") {
      return omitKeys(settings, ["inboundTag"]);
    }
    if (protocol === "wireguard") {
      return omitKeys(settings, [
        "secretKey",
        "address",
        "peers",
        "noKernelTun",
        "mtu",
        "reserved",
        "workers",
        "domainStrategy",
      ]);
    }
    if (protocol === "hysteria") {
      return omitKeys(settings, ["version", "address", "port"]);
    }
  }

  return settings;
}

export function compactObject<T extends Record<string, any>>(value: T): T {
  const result: Record<string, any> = {};
  for (const [key, item] of Object.entries(value)) {
    if (item === undefined || item === null || item === "") continue;
    if (Array.isArray(item) && item.length === 0) continue;
    if (
      typeof item === "object" &&
      !Array.isArray(item) &&
      Object.keys(item).length === 0
    ) {
      continue;
    }
    result[key] = item;
  }
  return result as T;
}

export function buildStreamSettings(values: Record<string, any>) {
  if (!values.network && (!values.security || values.security === "none")) {
    return;
  }

  const stream: Record<string, any> = compactObject({
    network: values.network || "tcp",
    security:
      values.security && values.security !== "none"
        ? values.security
        : undefined,
  });

  if (values.network === "ws") {
    stream.wsSettings = compactObject({
      path: emptyToUndefined(values.path),
      headers: values.host ? { Host: values.host } : undefined,
    });
  }

  if (values.network === "grpc") {
    stream.grpcSettings = compactObject({
      serviceName: emptyToUndefined(values.service_name),
      authority: emptyToUndefined(values.grpc_authority),
      multiMode: values.grpc_multi_mode || undefined,
      idle_timeout: numberToUndefined(values.grpc_idle_timeout),
      health_check_timeout: numberToUndefined(values.grpc_health_check_timeout),
    });
  }

  if (values.network === "xhttp") {
    stream.xhttpSettings = compactObject({
      path: emptyToUndefined(values.path),
      host: emptyToUndefined(values.host),
      mode: emptyToUndefined(values.xhttp_mode),
    });
  }

  if (values.network === "httpupgrade") {
    stream.httpupgradeSettings = compactObject({
      path: emptyToUndefined(values.path),
      host: emptyToUndefined(values.host),
    });
  }

  if (values.network === "raw" || values.network === "tcp") {
    stream.rawSettings = safeJsonParse(values.raw_settings_json || "", {});
  }

  if (values.network === "kcp") {
    stream.kcpSettings = compactObject({
      mtu: numberToUndefined(values.kcp_mtu),
      tti: numberToUndefined(values.kcp_tti),
      uplinkCapacity: numberToUndefined(values.kcp_uplink_capacity),
      downlinkCapacity: numberToUndefined(values.kcp_downlink_capacity),
      congestion: values.kcp_congestion || undefined,
      header: values.kcp_header_type
        ? { type: values.kcp_header_type }
        : undefined,
      ...safeJsonParse(values.kcp_settings_json || "", {}),
    });
  }

  if (values.network === "hysteria") {
    stream.hysteriaSettings = safeJsonParse(
      values.hysteria_settings_json || "",
      {}
    );
  }

  if (values.security === "tls") {
    stream.tlsSettings = compactObject({
      serverName: emptyToUndefined(values.sni),
      allowInsecure: values.allow_insecure || undefined,
      fingerprint: emptyToUndefined(values.fingerprint),
    });
  }

  if (values.security === "reality") {
    const isOutbound = values.type === "outbound";
    stream.realitySettings = isOutbound
      ? compactObject({
          serverName: emptyToUndefined(values.sni),
          fingerprint: emptyToUndefined(values.fingerprint),
          password: emptyToUndefined(values.reality_public_key),
          shortId: emptyToUndefined(values.reality_short_id),
          spiderX: emptyToUndefined(values.reality_spider_x),
        })
      : compactObject({
          show: values.reality_show || undefined,
          target: emptyToUndefined(values.reality_target),
          xver: numberToUndefined(values.reality_xver),
          serverNames: splitCsv(values.reality_server_names),
          privateKey: emptyToUndefined(values.reality_private_key),
          shortIds: splitCsv(values.reality_short_ids),
          minClientVer: emptyToUndefined(values.reality_min_client_ver),
          maxClientVer: emptyToUndefined(values.reality_max_client_ver),
          maxTimeDiff: numberToUndefined(values.reality_max_time_diff),
        });
  }

  const sockopt = safeJsonParse(values.sockopt_json || "", {});
  if (Object.keys(sockopt).length) {
    stream.sockopt = sockopt;
  }
  const finalmask = safeJsonParse(values.finalmask_json || "", {});
  if (Object.keys(finalmask).length) {
    stream.finalmask = finalmask;
  }

  return stream;
}

function buildInboundProtocolSettings(values: Record<string, any>) {
  const protocol = values.protocol;
  if (protocol === "vless") {
    return mergeSettings(
      {
        clients: safeJsonParse(values.vless_clients_json || "", []),
        decryption: values.vless_decryption || "none",
        fallbacks: safeJsonParse(values.fallbacks_json || "", []),
      },
      values.settings_json
    );
  }
  if (protocol === "vmess") {
    return mergeSettings(
      {
        clients: safeJsonParse(values.vmess_clients_json || "", []),
        default: safeJsonParse(values.vmess_default_json || "", {}),
      },
      values.settings_json
    );
  }
  if (protocol === "trojan") {
    return mergeSettings(
      {
        clients: safeJsonParse(values.trojan_clients_json || "", []),
        fallbacks: safeJsonParse(values.fallbacks_json || "", []),
      },
      values.settings_json
    );
  }
  if (protocol === "shadowsocks") {
    return mergeSettings(
      {
        network: emptyToUndefined(values.ss_network),
        method: emptyToUndefined(values.ss_method),
        password: emptyToUndefined(values.ss_password),
        level: numberToUndefined(values.user_level),
        email: emptyToUndefined(values.email),
        clients: safeJsonParse(values.ss_clients_json || "", []),
      },
      values.settings_json
    );
  }
  if (protocol === "socks") {
    return mergeSettings(
      {
        auth: values.socks_auth || "noauth",
        accounts: safeJsonParse(values.accounts_json || "", []),
        udp: values.socks_udp || undefined,
        ip: emptyToUndefined(values.socks_ip),
        userLevel: numberToUndefined(values.user_level),
      },
      values.settings_json
    );
  }
  if (protocol === "http") {
    return mergeSettings(
      {
        accounts: safeJsonParse(values.accounts_json || "", []),
        allowTransparent: values.allow_transparent || undefined,
        userLevel: numberToUndefined(values.user_level),
      },
      values.settings_json
    );
  }
  if (protocol === "dokodemo-door") {
    return mergeSettings(
      {
        address: emptyToUndefined(values.dokodemo_address),
        port: numberToUndefined(values.dokodemo_port),
        portMap: safeJsonParse(values.dokodemo_port_map_json || "", {}),
        network: emptyToUndefined(values.dokodemo_network),
        followRedirect: values.follow_redirect || undefined,
        userLevel: numberToUndefined(values.user_level),
      },
      values.settings_json
    );
  }
  if (protocol === "wireguard") {
    return mergeSettings(
      {
        secretKey: emptyToUndefined(values.wg_secret_key),
        peers: safeJsonParse(values.wg_peers_json || "", []),
        mtu: numberToUndefined(values.wg_mtu),
      },
      values.settings_json
    );
  }
  if (protocol === "hysteria") {
    return mergeSettings(
      {
        version: numberToUndefined(values.hysteria_version),
        clients: safeJsonParse(values.hysteria_clients_json || "", []),
      },
      values.settings_json
    );
  }
  if (protocol === "tun") {
    return mergeSettings(
      {
        name: emptyToUndefined(values.tun_name),
        MTU: numberToUndefined(values.tun_mtu),
        UserLevel: numberToUndefined(values.user_level),
      },
      values.settings_json
    );
  }
  return safeJsonParse(values.settings_json || "", {});
}

function buildOutboundProtocolSettings(values: Record<string, any>) {
  const protocol = values.protocol;
  if (protocol === "freedom") {
    return mergeSettings(
      {
        domainStrategy: emptyToUndefined(values.domain_strategy),
        redirect: emptyToUndefined(values.redirect),
        userLevel: numberToUndefined(values.user_level),
        fragment: safeJsonParse(values.fragment_json || "", {}),
        noises: safeJsonParse(values.noises_json || "", []),
        proxyProtocol: numberToUndefined(values.proxy_protocol),
      },
      values.settings_json
    );
  }
  if (protocol === "blackhole") {
    return mergeSettings(
      {
        response: { type: values.response_type || "none" },
      },
      values.settings_json
    );
  }
  if (protocol === "vless") {
    return mergeSettings(
      {
        address: emptyToUndefined(values.out_address),
        port: numberToUndefined(values.out_port),
        id: emptyToUndefined(values.out_id),
        encryption: values.out_encryption || "none",
        flow: emptyToUndefined(values.out_flow),
        level: numberToUndefined(values.user_level),
      },
      values.settings_json
    );
  }
  if (protocol === "vmess") {
    return mergeSettings(
      {
        address: emptyToUndefined(values.out_address),
        port: numberToUndefined(values.out_port),
        id: emptyToUndefined(values.out_id),
        security: values.out_security || "auto",
        level: numberToUndefined(values.user_level),
        experiments: emptyToUndefined(values.out_experiments),
      },
      values.settings_json
    );
  }
  if (protocol === "trojan") {
    return mergeSettings(
      {
        address: emptyToUndefined(values.out_address),
        port: numberToUndefined(values.out_port),
        password: emptyToUndefined(values.out_password),
        email: emptyToUndefined(values.email),
        level: numberToUndefined(values.user_level),
      },
      values.settings_json
    );
  }
  if (protocol === "shadowsocks") {
    return mergeSettings(
      {
        address: emptyToUndefined(values.out_address),
        port: numberToUndefined(values.out_port),
        method: emptyToUndefined(values.ss_method),
        password: emptyToUndefined(values.ss_password),
        level: numberToUndefined(values.user_level),
        email: emptyToUndefined(values.email),
        uot: values.ss_uot || undefined,
        UoTVersion: numberToUndefined(values.ss_uot_version),
      },
      values.settings_json
    );
  }
  if (protocol === "socks" || protocol === "http") {
    return mergeSettings(
      {
        address: emptyToUndefined(values.out_address),
        port: numberToUndefined(values.out_port),
        user: emptyToUndefined(values.out_user),
        pass: emptyToUndefined(values.out_pass),
        level: numberToUndefined(values.user_level),
        email: emptyToUndefined(values.email),
        headers:
          protocol === "http"
            ? safeJsonParse(values.headers_json || "", {})
            : undefined,
      },
      values.settings_json
    );
  }
  if (protocol === "dns") {
    return mergeSettings(
      {
        network: emptyToUndefined(values.dns_out_network),
        address: emptyToUndefined(values.dns_out_address),
        port: numberToUndefined(values.dns_out_port),
        userLevel: numberToUndefined(values.user_level),
        rules: safeJsonParse(values.dns_out_rules_json || "", []),
      },
      values.settings_json
    );
  }
  if (protocol === "loopback") {
    return mergeSettings(
      {
        inboundTag: emptyToUndefined(values.loopback_inbound_tag),
      },
      values.settings_json
    );
  }
  if (protocol === "wireguard") {
    return mergeSettings(
      {
        secretKey: emptyToUndefined(values.wg_secret_key),
        address: linesToArray(values.wg_address),
        peers: safeJsonParse(values.wg_peers_json || "", []),
        noKernelTun: values.wg_no_kernel_tun ?? false,
        mtu: numberToUndefined(values.wg_mtu),
        reserved: safeJsonParse(values.wg_reserved_json || "", []),
        workers: numberToUndefined(values.wg_workers),
        domainStrategy: emptyToUndefined(values.wg_domain_strategy),
      },
      values.settings_json
    );
  }
  if (protocol === "hysteria") {
    return mergeSettings(
      {
        version: numberToUndefined(values.hysteria_version),
        address: emptyToUndefined(values.out_address),
        port: numberToUndefined(values.out_port),
      },
      values.settings_json
    );
  }
  return safeJsonParse(values.settings_json || "", {});
}

export function buildInboundConfig(values: Record<string, any>) {
  const settings = buildInboundProtocolSettings(values);
  const streamUnsupported = ["tun", "wireguard"].includes(values.protocol);
  const config = compactObject({
    tag: values.tag,
    listen: values.listen,
    port: values.port ? Number(values.port) : undefined,
    protocol: values.protocol,
    settings,
    streamSettings: streamUnsupported ? undefined : buildStreamSettings(values),
    sniffing: values.sniffing
      ? compactObject({
          enabled: true,
          destOverride: splitCsv(values.dest_override),
          metadataOnly: values.sniffing_metadata_only || undefined,
          routeOnly: values.sniffing_route_only || undefined,
          domainsExcluded: splitCsv(values.sniffing_domains_excluded),
        })
      : undefined,
  });

  return hasAdvancedJson(values.advanced_json)
    ? safeJsonParse(values.advanced_json, config)
    : config;
}

export function buildOutboundConfig(values: Record<string, any>) {
  const protocol = values.protocol;
  const settings = buildOutboundProtocolSettings(values);
  const streamUnsupported = ["dns", "loopback", "wireguard"].includes(protocol);

  const config = compactObject({
    tag: values.tag,
    protocol,
    settings,
    streamSettings: streamUnsupported ? undefined : buildStreamSettings(values),
  });

  return hasAdvancedJson(values.advanced_json)
    ? safeJsonParse(values.advanced_json, config)
    : config;
}

export function buildDnsConfig(values: Record<string, any>) {
  const objectServers = safeJsonParse<any[]>(values.dns_servers_json || "", []);
  const config = compactObject({
    hosts: safeJsonParse(values.hosts_json || "", {}),
    servers: [...linesToArray(values.servers), ...objectServers],
    tag: emptyToUndefined(values.tag),
    clientIp: emptyToUndefined(values.client_ip),
    queryStrategy: values.query_strategy,
    disableCache: values.disable_cache || undefined,
    serveStale: values.serve_stale || undefined,
    serveExpiredTTL: values.serve_expired_ttl
      ? Number(values.serve_expired_ttl)
      : undefined,
    disableFallback: values.disable_fallback || undefined,
    disableFallbackIfMatch: values.disable_fallback_if_match || undefined,
    enableParallelQuery: values.enable_parallel_query || undefined,
    useSystemHosts: values.use_system_hosts || undefined,
  });

  return hasAdvancedJson(values.advanced_json)
    ? safeJsonParse(values.advanced_json, config)
    : config;
}

export function buildRoutingConfig(values: Record<string, any>) {
  const config = compactObject({
    domainStrategy: values.routing_domain_strategy || "AsIs",
    rules: safeJsonParse(values.routing_rules_json || "", []),
    balancers: safeJsonParse(values.routing_balancers_json || "", []),
  });

  return hasAdvancedJson(values.advanced_json)
    ? safeJsonParse(values.advanced_json, config)
    : config;
}

export function configToFormValues(
  type: XrayTemplateType,
  config?: Record<string, any>
) {
  const value = config || {};
  const stream = value.streamSettings || {};
  const ws = stream.wsSettings || {};
  const grpc = stream.grpcSettings || {};
  const xhttp = stream.xhttpSettings || {};
  const httpupgrade = stream.httpupgradeSettings || {};
  const tls = stream.tlsSettings || {};
  const reality = stream.realitySettings || {};
  const settings = value.settings || {};

  if (type === "dns") {
    const servers = Array.isArray(value.servers) ? value.servers : [];
    const stringServers = servers.filter((item) => typeof item === "string");
    const objectServers = servers.filter((item) => typeof item === "object");
    return {
      tag: value.tag || "",
      servers: arrayToLines(stringServers),
      dns_servers_json: formatJson(objectServers),
      hosts_json: formatJson(value.hosts || {}),
      query_strategy: value.queryStrategy || "UseIP",
      disable_cache: !!value.disableCache,
      serve_stale: !!value.serveStale,
      serve_expired_ttl: value.serveExpiredTTL || undefined,
      disable_fallback: !!value.disableFallback,
      disable_fallback_if_match: !!value.disableFallbackIfMatch,
      enable_parallel_query: !!value.enableParallelQuery,
      use_system_hosts: !!value.useSystemHosts,
      client_ip: value.clientIp || "",
      advanced_json: formatJson(value),
    };
  }

  if (type === "routing") {
    return {
      routing_domain_strategy: value.domainStrategy || "AsIs",
      routing_rules_json: formatJson(value.rules || []),
      routing_balancers_json: formatJson(value.balancers || []),
      advanced_json: formatJson(value),
    };
  }

  return {
    tag: value.tag || "",
    listen: value.listen || "",
    port: value.port || undefined,
    protocol: value.protocol || (type === "inbound" ? "vless" : "freedom"),
    settings_json: formatJson(
      settingsExtra(
        type,
        value.protocol || (type === "inbound" ? "vless" : "freedom"),
        settings
      )
    ),
    network: stream.network || "raw",
    security: stream.security || "none",
    host: ws.headers?.Host || xhttp.host || httpupgrade.host || "",
    path: ws.path || xhttp.path || httpupgrade.path || "",
    service_name: grpc.serviceName || "",
    grpc_authority: grpc.authority || "",
    grpc_multi_mode: !!grpc.multiMode,
    grpc_idle_timeout: grpc.idle_timeout || undefined,
    grpc_health_check_timeout: grpc.health_check_timeout || undefined,
    xhttp_mode: xhttp.mode || "auto",
    kcp_mtu: stream.kcpSettings?.mtu || undefined,
    kcp_tti: stream.kcpSettings?.tti || undefined,
    kcp_uplink_capacity: stream.kcpSettings?.uplinkCapacity || undefined,
    kcp_downlink_capacity: stream.kcpSettings?.downlinkCapacity || undefined,
    kcp_congestion: !!stream.kcpSettings?.congestion,
    kcp_header_type: stream.kcpSettings?.header?.type || "",
    raw_settings_json: formatJson(stream.rawSettings || {}),
    kcp_settings_json: formatJson(stream.kcpSettings || {}),
    hysteria_settings_json: formatJson(stream.hysteriaSettings || {}),
    sockopt_json: formatJson(stream.sockopt || {}),
    finalmask_json: formatJson(stream.finalmask || {}),
    sni: tls.serverName || reality.serverName || "",
    allow_insecure: !!tls.allowInsecure,
    fingerprint: tls.fingerprint || reality.fingerprint || "chrome",
    reality_show: !!reality.show,
    reality_target: reality.target || reality.dest || "",
    reality_xver: reality.xver || undefined,
    reality_server_names: joinCsv(reality.serverNames || reality.serverName),
    reality_private_key: reality.privateKey || "",
    reality_public_key: reality.password || reality.publicKey || "",
    reality_short_id: reality.shortId || "",
    reality_short_ids: joinCsv(reality.shortIds),
    reality_spider_x: reality.spiderX || "",
    reality_min_client_ver: reality.minClientVer || "",
    reality_max_client_ver: reality.maxClientVer || "",
    reality_max_time_diff: reality.maxTimeDiff || undefined,
    sniffing: !!value.sniffing?.enabled,
    dest_override: joinCsv(value.sniffing?.destOverride || ["http", "tls"]),
    sniffing_metadata_only: !!value.sniffing?.metadataOnly,
    sniffing_route_only: !!value.sniffing?.routeOnly,
    sniffing_domains_excluded: joinCsv(value.sniffing?.domainsExcluded || []),
    vless_clients_json: formatJson(settings.clients || []),
    vless_decryption: settings.decryption || "none",
    vmess_clients_json: formatJson(settings.clients || []),
    vmess_default_json: formatJson(settings.default || {}),
    trojan_clients_json: formatJson(settings.clients || []),
    fallbacks_json: formatJson(settings.fallbacks || []),
    ss_network: settings.network || "tcp",
    ss_method: settings.method || "",
    ss_password: settings.password || "",
    ss_clients_json: formatJson(settings.clients || []),
    socks_auth: settings.auth || "noauth",
    socks_udp: !!settings.udp,
    socks_ip: settings.ip || "",
    accounts_json: formatJson(settings.accounts || []),
    allow_transparent: !!settings.allowTransparent,
    dokodemo_address: settings.address || "",
    dokodemo_port: settings.port || undefined,
    dokodemo_network: settings.network || "tcp",
    follow_redirect: !!settings.followRedirect,
    dokodemo_port_map_json: formatJson(settings.portMap || {}),
    wg_secret_key: settings.secretKey || "",
    wg_address: arrayToLines(settings.address || []),
    wg_peers_json: formatJson(settings.peers || []),
    wg_mtu: settings.mtu || 1420,
    wg_no_kernel_tun: settings.noKernelTun ?? false,
    wg_reserved_json: formatJson(settings.reserved || []),
    wg_workers: settings.workers || undefined,
    wg_domain_strategy: settings.domainStrategy || "ForceIP",
    hysteria_version: settings.version || 2,
    hysteria_clients_json: formatJson(settings.clients || []),
    tun_name: settings.name || "xray0",
    tun_mtu: settings.MTU || 1500,
    out_address: settings.address || "",
    out_port: settings.port || undefined,
    out_id: settings.id || "",
    out_encryption: settings.encryption || "none",
    out_flow: settings.flow || "",
    out_security: settings.security || "auto",
    out_experiments: settings.experiments || "",
    out_password: settings.password || "",
    out_user: settings.user || "",
    out_pass: settings.pass || "",
    ss_uot: !!settings.uot,
    ss_uot_version: settings.UoTVersion || settings.uotVersion || 2,
    headers_json: formatJson(settings.headers || {}),
    email: settings.email || "",
    user_level: settings.userLevel || settings.level || undefined,
    domain_strategy: settings.domainStrategy || "",
    redirect: settings.redirect || "",
    fragment_json: formatJson(settings.fragment || {}),
    noises_json: formatJson(settings.noises || []),
    proxy_protocol: settings.proxyProtocol || undefined,
    response_type: settings.response?.type || "none",
    dns_out_network: settings.network || "",
    dns_out_address: settings.address || "",
    dns_out_port: settings.port || undefined,
    dns_out_rules_json: formatJson(settings.rules || []),
    loopback_inbound_tag: settings.inboundTag || "",
    advanced_json: formatJson(value),
  };
}

# Xray Agent Installation

`xray-agent` is the node-side process for PPanel. It pulls the server-level Xray configuration from PPanel, writes the effective `current.json`, supervises `xray-core`, hot-reloads supported user lists, and reports traffic plus realtime status back to the panel.

## Runtime Model

```text
PPanel server <----HTTP/WS----> xray-agent ----process/API----> xray-core
```

- PPanel owns servers, Xray templates, template bindings, nodes, subscriptions, and users.
- `xray-agent` pulls `/v2/server/{server_id}/xray-config` and `/v2/server/{server_id}/xray-users`.
- `xray-core` only runs the final rendered config produced by `xray-agent`.

## Quick Start

The admin console’s **Servers → Connect** button generates the recommended Docker command:

```bash
docker run -d --name ppanel-xray-agent --restart unless-stopped --network host \
  -v /var/lib/ppanel/xray-agent:/var/lib/ppanel/xray-agent \
  -e PPANEL_SERVER_URL=https://panel.example.com \
  -e PPANEL_SERVER_ID=1 \
  -e PPANEL_NODE_SECRET=<SECRET> \
  ppanel/xray-agent:latest
```

### Requirements

- 64-bit Linux with Docker, or a host capable of running `xray-agent` and `xray-core`.
- The panel URL must be reachable from the node.
- Firewall rules must allow every inbound port rendered by the server’s Xray templates.
- The server record must already exist in PPanel and have the same **Server ID** and **Node Secret**.

## Configuration

The Docker image can be configured entirely through environment variables:

| Variable | Purpose |
| --- | --- |
| `PPANEL_SERVER_URL` | Panel base URL, for example `https://panel.example.com` |
| `PPANEL_SERVER_ID` | Server ID from PPanel admin |
| `PPANEL_NODE_SECRET` | Node secret from system node configuration |
| `XRAY_AGENT_PULL_INTERVAL` | Config/user polling interval, default `30s` |
| `XRAY_AGENT_STATUS_INTERVAL` | Realtime status interval, default `5s` |
| `XRAY_AGENT_TRAFFIC_INTERVAL` | Traffic report interval, default `30s` |
| `XRAY_AGENT_INTERFACE` | Optional network interface name for rate stats |

For non-Docker deployments, use a JSON config file:

```json
{
  "panel": {
    "base_url": "https://panel.example.com",
    "server_id": 1,
    "secret_key": "<SECRET>"
  },
  "xray": {
    "bin_path": "/usr/local/bin/xray",
    "work_dir": "/var/lib/ppanel/xray-agent",
    "api_port": 10085,
    "inject_api": true,
    "validate_config": true
  },
  "agent": {
    "pull_interval": "30s"
  },
  "report": {
    "status_interval": "5s",
    "traffic_interval": "30s"
  }
}
```

Run it with:

```bash
xray-agent -config /etc/ppanel/xray-agent.json
```

## Mapping to PPanel

1. Create or edit a server under **Maintenance → Servers**.
2. Bind the server to one or more Xray templates. Inbound templates should have stable aliases such as `main`, `grpc-reality`, or `ws-cdn`.
3. Use binding variables to override per-server values, for example:

    ```json
    {
      "port": 20002
    }
    ```

4. Create user-facing nodes under **Nodes** and select the inbound alias that the node should expose.
5. Make sure the node entry port matches the public port users should connect to. It can be different from the rendered Xray listen port when a load balancer, CDN, or port-forwarding layer is used.

## Operations

```bash
docker logs -f ppanel-xray-agent
docker restart ppanel-xray-agent
docker pull ppanel/xray-agent:latest
```

Useful files when using the default Docker volume:

- `/var/lib/ppanel/xray-agent/current.json` - active rendered Xray config.
- `/var/lib/ppanel/xray-agent/last_good.json` - last config that validated successfully.
- `/var/lib/ppanel/xray-agent/stats_cursor.json` - traffic stats cursor.

## Troubleshooting

- If the panel shows the server offline, check `PPANEL_SERVER_URL`, `PPANEL_SERVER_ID`, and `PPANEL_NODE_SECRET`.
- If Xray fails to start, inspect `current.json` and `last_good.json`; invalid template output usually shows up there first.
- If users cannot connect, verify the node’s inbound alias, the rendered inbound port, and firewall/CDN forwarding rules.
- If traffic does not report, verify Xray API injection is enabled and the API port is not occupied.

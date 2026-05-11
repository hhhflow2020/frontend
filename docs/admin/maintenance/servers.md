# Server Management

Manage physical servers, Xray template bindings, runtime status, and global node-agent communication settings.

## Page Components

### Dynamic Multiplier

Define traffic billing multipliers for time periods. The multiplier is applied when traffic reports are processed.

### Node Configuration

This card only controls agent communication basics:

- **Node Secret**: authentication key used by `xray-agent`.
- **Node Pull Interval**: how often nodes pull config/users.
- **Node Push Interval**: compatibility setting for push-style status intervals.
- **Traffic Report Threshold**: byte threshold for traffic reporting.
- **IP Strategy**: prefer IPv4 or IPv6 where applicable.

DNS, outbound, routing, blocking, and protocol-specific settings are configured through **Xray Templates**, not here.

### Server List

The table displays:

- server name and region/address;
- realtime status from `xray-agent` over WebSocket;
- CPU, memory, disk, and network rate;
- operations such as edit, connect, delete, copy, and Xray template binding.

## Server Form

The server form contains only physical server metadata:

- **Name**
- **Country**
- **City**
- **Address**
- **Sort**

Protocols are no longer configured on the server form. Configure Xray in **Xray Templates**, then bind templates to a server.

## Xray Template Binding

Use **Bind Xray Templates** on a server to attach one or more templates:

- **Inbound** templates render into top-level `inbounds`.
- **Outbound** templates render into top-level `outbounds`.
- **DNS** templates are merged into top-level `dns`.
- **Routing** templates are merged into top-level `routing`.

Each binding has:

- **Alias**: stable name used by nodes and template references.
- **Variables**: per-server overrides, for example `{ "port": 20002 }`.
- **Sort**: merge/render order.
- **Enabled**: whether this binding is active.

The final preview shows the pure Xray config that `xray-agent` will pull.

## One-Click Installation

Click **Connect** to generate a Docker command for `xray-agent`:

```bash
docker run -d --name ppanel-xray-agent --restart unless-stopped --network host \
  -v /var/lib/ppanel/xray-agent:/var/lib/ppanel/xray-agent \
  -e PPANEL_SERVER_URL=https://panel.example.com \
  -e PPANEL_SERVER_ID=1 \
  -e PPANEL_NODE_SECRET=<SECRET> \
  ppanel/xray-agent:latest
```

Run this command on the target server. The agent pulls server-level Xray config, starts `xray-core`, reports realtime status, and sends traffic usage.

## Relationship With Nodes

Servers own Xray template bindings. Nodes are user-facing entries that select one server inbound alias and define subscription-facing address/port.

```text
Server
  └─ inbound alias: grpc-reality
       ├─ Node: HK Direct, address 203.0.113.10, port 20002
       └─ Node: HK CDN, address hk.example.com, port 443
```

The node port is what clients see. The actual Xray listen port comes from the rendered inbound template and binding variables.

## Realtime Status

`xray-agent` reports CPU, memory, disk, network speed, and traffic through server APIs and WebSocket. The admin server list subscribes to realtime updates from PPanel.

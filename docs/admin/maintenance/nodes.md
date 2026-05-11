# Node Management

Nodes are the user-facing endpoints shown in subscriptions. A node belongs to one server and points to one server-bound Xray inbound alias. The server runs `xray-agent`; the node controls how users see and connect to that inbound.

## Node List

The table shows all user-facing nodes.

**Columns:**

- **Enabled**: Whether the node is visible in subscriptions.
- **Name**: Display name shown in client subscriptions.
- **Address:Port**: Public entry address and port for users.
- **Server**: Physical server or VPS associated with the node.
- **Inbound:Port**: Xray inbound alias selected from the server’s bound inbound templates, plus the node entry port.
- **Tags**: Permission and product grouping tags.

## Node Form

### Server

Select the server that owns the Xray configuration. The form will load enabled inbound template bindings from that server.

### Inbound

Select one of the server’s enabled inbound aliases. This does not create a new Xray inbound; it links the node to an inbound template already bound to the server.

Examples:

- `main`
- `grpc-reality`
- `ws-cdn`

### Name

Display name shown in user subscriptions.

### Address

The public entry address users connect to. It can be the server IP, a domain, a CDN hostname, or a load balancer address.

### Port

The public entry port users connect to. The form can autofill from the selected inbound’s rendered port, but the value is intentionally editable.

This lets one Xray inbound be exposed differently per node:

- Direct node: public port equals Xray listen port.
- CDN node: public port may be `443` while Xray listens behind the CDN.
- Port forwarding: public port can differ from the local Xray port.

### Tags

Tags are used for product/plan binding and grouping. A product can include nodes directly or include all nodes with selected tags.

## Autofill

When selecting a server, the form can autofill:

- node name from server name;
- entry address from server address;
- the first available inbound alias;
- port from the inbound template or binding variables.

Manual edits are respected. Once a field is changed by hand, the form avoids overwriting it unless the server or inbound is reselected.

## Relationship Between Templates, Servers, and Nodes

```text
Xray Template
  └─ bound to Server with alias and variables
       └─ rendered by xray-agent into xray-core config
            └─ selected by one or more user-facing Nodes
```

Example:

```text
Server: Hong Kong-HK01
Inbound binding:
  alias: grpc-reality
  variables: { "port": 20002 }

Nodes:
  Hong Kong 01 Direct
    inbound: grpc-reality
    address: 203.0.113.10
    port: 20002

  Hong Kong 01 CDN
    inbound: grpc-reality
    address: hk01.example.com
    port: 443
```

## Important Notes

1. The inbound must already be bound and enabled on the selected server.
2. The node port is the subscription/client-facing port; the Xray listen port comes from the rendered inbound template.
3. If the two ports differ, make sure CDN, load balancer, NAT, or firewall rules forward traffic correctly.
4. Deleting a node removes it from subscriptions; disabling is safer for temporary maintenance.
5. Plan tags should be designed before large-scale node creation.

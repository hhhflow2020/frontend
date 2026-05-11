# 服务器管理

用于管理物理服务器、Xray 模板绑定、运行状态，以及节点端通信基础配置。

## 页面组成

### 动态倍率配置

定义不同时段的流量计费倍率。节点上报流量后，系统会按当前时段倍率处理流量统计。

### 节点配置

这个卡片只保留 agent 通信基础项：

- **节点密钥**：`xray-agent` 调用服务端 API 的认证密钥。
- **节点拉取间隔**：节点拉取配置/用户的间隔。
- **节点推送间隔**：兼容推送式状态上报间隔。
- **流量报告阈值**：触发流量上报的字节阈值。
- **IP 策略**：在适用场景中优先 IPv4 或 IPv6。

DNS、outbound、routing、屏蔽规则和协议细节都不再在这里配置，而是在 **Xray 模板** 中配置。

### 服务器列表

表格展示：

- 服务器名称和地区/地址；
- `xray-agent` 通过 WebSocket 上报的实时状态；
- CPU、内存、磁盘、网络速率；
- 编辑、连接、删除、复制、绑定 Xray 模板等操作。

## 服务器表单

服务器表单只包含物理服务器基础信息：

- **名称**
- **国家**
- **城市**
- **地址**
- **排序**

服务器表单不再配置协议。需要先在 **Xray 模板** 中配置 Xray，再将模板绑定到服务器。

## Xray 模板绑定

在服务器操作中使用 **绑定 Xray 模板** 可以给服务器挂载多个模板：

- **Inbound** 模板渲染到顶层 `inbounds`。
- **Outbound** 模板渲染到顶层 `outbounds`。
- **DNS** 模板会合并到顶层 `dns`。
- **Routing** 模板会合并到顶层 `routing`。

每个绑定包含：

- **Alias**：稳定名称，供节点和模板引用。
- **Variables**：每台服务器的差异化覆盖，例如 `{ "port": 20002 }`。
- **Sort**：合并/渲染顺序。
- **Enabled**：是否启用该绑定。

最终预览展示的是 `xray-agent` 会拉取的纯净 Xray 配置。

## 一键安装

点击 **连接** 会生成 `xray-agent` 的 Docker 启动命令：

```bash
docker run -d --name ppanel-xray-agent --restart unless-stopped --network host \
  -v /var/lib/ppanel/xray-agent:/var/lib/ppanel/xray-agent \
  -e PPANEL_SERVER_URL=https://panel.example.com \
  -e PPANEL_SERVER_ID=1 \
  -e PPANEL_NODE_SECRET=<SECRET> \
  ppanel/xray-agent:latest
```

在目标服务器执行该命令后，agent 会拉取服务器级 Xray 配置，启动 `xray-core`，上报实时状态和用户流量。

## 与节点的关系

服务器拥有 Xray 模板绑定。节点是面向用户的入口，它选择某台服务器上的一个 inbound alias，并定义订阅里展示的地址和端口。

```text
服务器
  └─ inbound alias: grpc-reality
       ├─ 节点: HK Direct, address 203.0.113.10, port 20002
       └─ 节点: HK CDN, address hk.example.com, port 443
```

节点端口是客户端看到的端口。Xray 实际监听端口来自最终渲染的 inbound 模板和服务器绑定变量。

## 实时状态

`xray-agent` 通过服务端 API 和 WebSocket 上报 CPU、内存、磁盘、网络速率和流量。admin 服务器列表会从 PPanel 订阅实时状态。

# Xray Agent 安装

`xray-agent` 是 PPanel 的节点端进程。它从 PPanel 拉取服务器级 Xray 配置，生成最终的 `current.json`，托管 `xray-core`，对支持的协议热更新用户列表，并向面板上报流量和实时状态。

## 运行模型

```text
PPanel server <----HTTP/WS----> xray-agent ----process/API----> xray-core
```

- PPanel 管理服务器、Xray 模板、模板绑定、节点、订阅和用户。
- `xray-agent` 拉取 `/v2/server/{server_id}/xray-config` 和 `/v2/server/{server_id}/xray-users`。
- `xray-core` 只运行 `xray-agent` 生成后的最终配置。

## 快速开始

后台 **服务器管理 → 连接** 按钮会生成推荐的 Docker 命令：

```bash
docker run -d --name ppanel-xray-agent --restart unless-stopped --network host \
  -v /var/lib/ppanel/xray-agent:/var/lib/ppanel/xray-agent \
  -e PPANEL_SERVER_URL=https://panel.example.com \
  -e PPANEL_SERVER_ID=1 \
  -e PPANEL_NODE_SECRET=<SECRET> \
  ppanel/xray-agent:latest
```

### 环境要求

- 64 位 Linux，已安装 Docker；或能直接运行 `xray-agent` 与 `xray-core`。
- 节点服务器可以访问面板地址。
- 防火墙放通服务器绑定的 Xray inbound 模板最终渲染出的端口。
- 面板中已存在对应服务器记录，并使用匹配的 **Server ID** 与 **Node Secret**。

## 配置

Docker 镜像可以完全通过环境变量配置：

| 变量 | 作用 |
| --- | --- |
| `PPANEL_SERVER_URL` | 面板地址，例如 `https://panel.example.com` |
| `PPANEL_SERVER_ID` | 后台服务器 ID |
| `PPANEL_NODE_SECRET` | 系统节点配置中的节点密钥 |
| `XRAY_AGENT_PULL_INTERVAL` | 配置/用户拉取间隔，默认 `30s` |
| `XRAY_AGENT_STATUS_INTERVAL` | 实时状态上报间隔，默认 `5s` |
| `XRAY_AGENT_TRAFFIC_INTERVAL` | 流量上报间隔，默认 `30s` |
| `XRAY_AGENT_INTERFACE` | 可选，网络速率统计使用的网卡名 |

非 Docker 部署可以使用 JSON 配置文件：

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

启动命令：

```bash
xray-agent -config /etc/ppanel/xray-agent.json
```

## 与面板的映射关系

1. 在 **运维管理 → 服务器管理** 创建或编辑服务器。
2. 给服务器绑定一个或多个 Xray 模板。入站模板建议使用稳定 alias，例如 `main`、`grpc-reality`、`ws-cdn`。
3. 使用绑定变量覆盖每台服务器的差异化值，例如：

    ```json
    {
      "port": 20002
    }
    ```

4. 在 **节点管理** 中创建面向用户的节点，并选择该节点对应的 inbound alias。
5. 节点入口端口是用户连接端口；当使用负载均衡、CDN 或端口转发时，它可以不同于 Xray 实际监听端口。

## 运维命令

```bash
docker logs -f ppanel-xray-agent
docker restart ppanel-xray-agent
docker pull ppanel/xray-agent:latest
```

默认 Docker 挂载目录中的常用文件：

- `/var/lib/ppanel/xray-agent/current.json` - 当前生效的 Xray 配置。
- `/var/lib/ppanel/xray-agent/last_good.json` - 最近一次校验通过的配置。
- `/var/lib/ppanel/xray-agent/stats_cursor.json` - 流量统计游标。

## 故障排查

- 面板显示服务器离线时，检查 `PPANEL_SERVER_URL`、`PPANEL_SERVER_ID`、`PPANEL_NODE_SECRET`。
- Xray 启动失败时，查看 `current.json` 和 `last_good.json`，模板渲染错误通常会先体现在这里。
- 用户无法连接时，检查节点绑定的 inbound alias、最终渲染出的 inbound 端口，以及防火墙/CDN/端口转发规则。
- 流量不上报时，确认 Xray API 注入已开启，且 API 端口未被占用。

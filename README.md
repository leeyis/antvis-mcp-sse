# MCP Chart Render - SSE 服务器

这是一个基于 Model Context Protocol (MCP) 的图表渲染服务器，使用 Server-Sent Events (SSE) 传输协议。

## 🚀 快速部署

### 方法一：直接启动

```bash
# 1. 安装依赖
npm install

# 2. 启动服务器
npm start
# 或者
./start.sh
```

### 方法二：Docker 部署

```bash
# 构建镜像
docker build -t chart-render-sse .

# 运行容器
docker run -p 3001:3001 chart-render-sse

# 或使用 docker-compose
docker-compose up -d
```

## 📋 服务器端点

| 端点 | 方法 | 功能 | 描述 |
|------|------|------|------|
| `/health` | GET | 健康检查 | 返回服务器状态和活跃连接数 |
| `/sse` | GET | SSE连接 | 建立 Server-Sent Events 连接 |
| `/messages` | POST | MCP消息 | 处理 MCP 协议消息 |

## 🔧 环境配置

创建 `.env` 文件（参考 `env.example`）：

```bash
# 服务器端口
PORT=3001

# SSE端点路径
ENDPOINT=/messages

# 日志级别
LOG_LEVEL=info
```

## 🧪 测试验证

### 1. 健康检查
```bash
curl http://localhost:3001/health
```

### 2. 运行完整测试
```bash
node test-sse.js
```

### 3. 使用真实 MCP 客户端
```bash
node test-mcp.js
```

## 📊 MCP 功能

### 工具 (Tools)

#### `render_chart`
生成图表并保存为 PNG 图片。

**参数：**
```json
{
  "chartConfig": {
    "type": "line",
    "data": [...],
    "options": {...}
  }
}
```

**示例调用：**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "render_chart",
    "arguments": {
      "chartConfig": {
        "type": "line",
        "data": [
          {"x": "2023-01", "y": 100},
          {"x": "2023-02", "y": 120},
          {"x": "2023-03", "y": 140}
        ]
      }
    }
  }
}
```

### 资源 (Resources)

#### 图片资源
- **URI 格式**: `image://{filename}`
- **功能**: 访问生成的图表图片
- **MIME Type**: `image/png`

## 🔌 客户端连接

### SSE 连接流程

1. **建立 SSE 连接**
   ```bash
   curl -N http://localhost:3001/sse
   ```
   
2. **获取会话信息**
   服务器会发送包含 sessionId 的端点信息：
   ```
   event: endpoint
   data: /messages?sessionId=xxxxx
   ```

3. **发送 MCP 消息**
   ```bash
   curl -X POST http://localhost:3001/messages?sessionId=xxxxx \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
   ```

### 使用 JavaScript 客户端

```javascript
// 建立 SSE 连接
const eventSource = new EventSource('http://localhost:3001/sse');

eventSource.onmessage = function(event) {
  console.log('收到消息:', event.data);
};

// 发送 MCP 消息
async function sendMCPMessage(message) {
  const response = await fetch('http://localhost:3001/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  });
  
  return await response.json();
}
```

## 🏗️ 架构说明

### MCP SSE 协议

这个服务器实现了 MCP 的 SSE 传输层：

1. **双向通信**
   - 客户端 → 服务器：HTTP POST 到 `/messages`
   - 服务器 → 客户端：Server-Sent Events 从 `/sse`

2. **会话管理**
   - 每个 SSE 连接对应一个会话
   - 会话 ID 自动生成并通过 SSE 返回
   - 支持多个并发会话

3. **协议兼容性**
   - 完全符合 MCP 2024-11-05 规范
   - 支持工具调用、资源访问等核心功能

### 文件结构

```
chart-render/
├── server.js           # 主服务器文件
├── package.json        # 依赖配置
├── start.sh           # 启动脚本
├── test-sse.js        # 基础测试
├── test-mcp.js        # MCP 客户端测试
├── Dockerfile         # Docker 配置
├── docker-compose.yml # Docker Compose 配置
├── env.example        # 环境变量示例
└── images/            # 生成的图片存储目录
```

## 🐛 故障排除

### 常见问题

1. **端口占用**
   ```bash
   # 检查端口占用
   lsof -i :3001
   
   # 修改端口
   export PORT=3002
   npm start
   ```

2. **依赖安装失败**
   ```bash
   # 清理并重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **SSE 连接失败**
   ```bash
   # 检查服务器状态
   curl http://localhost:3001/health
   
   # 查看服务器日志
   # 日志会输出到控制台
   ```

## 📈 性能和扩展

### 性能特点
- 支持多个并发 SSE 连接
- 异步图表渲染，不阻塞其他请求
- 自动会话清理，防止内存泄漏

### 扩展建议
- 生产环境建议使用 PM2 或类似工具进行进程管理
- 可以添加 Redis 进行会话存储，支持集群部署
- 建议配置 Nginx 作为反向代理，处理静态文件服务

## 📝 更新日志

### v1.0.0
- ✅ 从 Express REST API 转换为 MCP SSE 服务器
- ✅ 支持标准 MCP 协议（工具、资源）
- ✅ 实现图表渲染功能
- ✅ 添加健康检查和测试工具
- ✅ 完善文档和部署方案

## 📄 许可证

ISC License

---

🎯 **部署成功！** 您的 MCP Chart Render SSE 服务器现在已经可以使用了。 
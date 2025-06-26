# AntVis MCP SSE - 专业图表渲染服务器

这是一个基于 Model Context Protocol (MCP) 的**专业图表渲染服务器**，支持 8 种图表类型，具备外部访问能力、性能优化和Docker容器化部署。

## ✨ 核心特性

- 🎯 **8种专用图表工具** - 线图、柱图、条图、饼图、面积图、散点图、双轴图、直方图
- 🌐 **外部访问支持** - 可配置主机名/IP，支持跨机器访问
- ⚡ **性能优化** - 图表缓存、异步渲染、时间监控
- 🐳 **一键部署** - 简化的Docker Compose部署，所有配置集中管理
- 📊 **HTTP URL访问** - 生成可直接访问的图片URL
- 🔒 **企业级安全** - 非root用户运行，安全沙箱
- 📈 **实时监控** - SSE连接状态、性能指标、健康检查

## 🚀 快速开始

### 一键部署（推荐）

```bash
# 1. 克隆项目
git clone <repository-url>
cd antvis-mcp-sse

# 2. 修改外部访问IP（编辑docker-compose.yml中的HOST值）
# 将 HOST=192.168.10.187 改为您的实际IP地址

# 3. 构建并启动服务
docker build -t antvis-chart-sse:latest .
docker compose up -d

# 4. 验证服务
curl http://YOUR_IP:7001/health
```

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 设置环境变量并启动
export HOST=YOUR_IP  # 替换为您的实际IP
export PORT=7001
npm start
```

## 📊 MCP 工具列表

| 工具名称 | 图表类型 | 适用场景 |
|---------|---------|---------| 
| `render_line_chart` | 线图 | 趋势分析、时间序列数据 |
| `render_column_chart` | 柱图 | 分类数据比较、排名分析 |
| `render_bar_chart` | 条图 | 水平对比、长标签数据 |
| `render_pie_chart` | 饼图 | 占比分析、构成分析 |
| `render_area_chart` | 面积图 | 累积数据、趋势填充 |
| `render_scatter_chart` | 散点图 | 相关性分析、分布研究 |
| `render_dual_axes_chart` | 双轴图 | 不同量级数据对比 |
| `render_histogram_chart` | 直方图 | 数据分布、频率分析 |

每个工具都支持：
- ✅ 完整的数据验证和错误处理
- ✅ 丰富的样式定制选项
- ✅ 缓存机制提升性能
- ✅ 返回可外部访问的HTTP URL

## ⚙️ 配置说明

### 环境变量配置

所有配置都在 `docker-compose.yml` 中集中管理：

```yaml
environment:
  - PORT=7001                    # 服务端口
  - ENDPOINT=/message            # SSE端点路径
  - NODE_ENV=production          # 运行环境
  - HOST=192.168.10.187         # 外部访问主机（修改为您的IP）
  - LOG_LEVEL=info              # 日志级别
  - IMAGES_DIR=/app/images      # 图片存储目录
  - MAX_IMAGE_SIZE=10           # 最大图片大小限制(MB)
```

### 修改外部访问地址

编辑 `docker-compose.yml` 文件，修改 `HOST` 环境变量：

```yaml
# 本机访问
- HOST=localhost

# 局域网访问
- HOST=192.168.1.100

# 公网访问（如果有公网IP或域名）
- HOST=your-domain.com
```

## 📁 项目结构

```
antvis-mcp-sse/
├── server.js              # 主服务器代码
├── Dockerfile             # Docker构建配置
├── docker-compose.yml     # 容器编排配置
├── package.json           # 项目依赖
├── README.md              # 项目文档
├── .dockerignore          # Docker构建忽略
├── .gitignore             # Git忽略配置
└── images/                # 图片存储目录
```

## 🔧 工具使用示例

### 基础饼图

```json
{
  "name": "render_pie_chart",
  "arguments": {
    "title": "销售占比分析",
    "data": [
      {"category": "产品A", "value": 30},
      {"category": "产品B", "value": 25},
      {"category": "产品C", "value": 45}
    ],
    "config": {
      "angleField": "value",
      "colorField": "category"
    }
  }
}
```

**返回示例：**
```json
{
  "success": true,
  "filename": "pie_chart_1234567890.png",
  "path": "/app/images/pie_chart_1234567890.png",
  "url": "http://192.168.10.187:7001/images/pie_chart_1234567890.png",
  "timestamp": "2024-12-25T10:30:00.000Z"
}
```

### 高级双轴图

```json
{
  "name": "render_dual_axes_chart",
  "arguments": {
    "title": "销售额与利润率对比",
    "data": [
      {"month": "1月", "sales": 1000, "profit_rate": 15},
      {"month": "2月", "sales": 1200, "profit_rate": 18}
    ],
    "config": {
      "xField": "month",
      "yField": ["sales", "profit_rate"],
      "geometryOptions": [
        {"geometry": "column", "color": "#5B8FF9"},
        {"geometry": "line", "color": "#5AD8A6"}
      ]
    }
  }
}
```

## 📈 性能特性

### 智能缓存系统
- 基于配置哈希的图表缓存
- 最大缓存100个图表，自动清理
- 缓存命中可减少90%的渲染时间

### 异步渲染引擎
- 非阻塞图表生成
- 并发处理多个渲染请求
- 实时性能监控和日志

### 监控指标
- 渲染时间统计
- 缓存命中率
- SSE连接状态
- 系统资源使用

## 🐳 Docker 部署

### 构建镜像

```bash
# 标准构建
docker build -t antvis-chart-sse:latest .

# 无缓存构建
docker build --no-cache -t antvis-chart-sse:latest .
```

### 容器管理

```bash
# 启动服务
docker compose up -d

# 查看日志
docker compose logs -f antvis-mcp

# 停止服务
docker compose down

# 重启服务
docker compose restart
```

### 健康检查

容器自带健康检查，访问 `/health` 端点：

```bash
curl http://YOUR_IP:7001/health
# 返回: {"status":"ok","timestamp":"2024-12-25T10:30:00.000Z"}
```

## 🛠️ 故障排除

### 常见问题

**1. 图片URL无法访问**
```bash
# 检查HOST环境变量设置
docker compose exec antvis-mcp env | grep HOST

# 确认防火墙端口开放
sudo ufw allow 7001
```

**2. 容器启动失败**
```bash
# 查看详细日志
docker compose logs antvis-mcp

# 检查端口占用
netstat -tulpn | grep 7001
```

**3. 图表渲染缓慢**
```bash
# 查看缓存命中率
docker compose logs antvis-mcp | grep "缓存"

# 监控容器资源
docker stats antvis-mcp
```

**4. SSE连接频繁断开**
```bash
# 这是正常现象，IDE会自动重连
# 可通过日志级别控制详细程度
# 在docker-compose.yml中设置: LOG_LEVEL=warn
```

### 性能优化建议

**生产环境**
- 使用SSD存储提升图片写入速度
- 配置Nginx反向代理进行负载均衡
- 设置适当的容器资源限制
- 定期清理历史图片文件

**开发环境**
- 使用本地volume挂载加速开发
- 启用详细日志便于调试
- 配置热重载便于代码修改

## 📚 API 文档

### MCP 标准接口

本服务完全兼容 MCP (Model Context Protocol) 标准：

- **工具发现**: 自动注册8个图表渲染工具
- **参数验证**: 严格的JSON Schema验证
- **错误处理**: 标准化错误响应格式
- **SSE通信**: 实时双向通信支持

### 数据格式支持

**输入数据格式**
- JSON数组格式
- Chart.js兼容格式
- 自动数据类型转换

**输出格式**
- PNG图片文件
- 可配置图片质量
- HTTP可访问URL

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 支持

如果您遇到问题或有建议，请：

1. 查看 [FAQ](#故障排除) 部分
2. 检查 [GitHub Issues](../../issues)
3. 创建新的 Issue 描述问题

---

**快速开始命令总结：**

```bash
# 完整部署流程
git clone <repository-url> && cd antvis-mcp-sse
# 编辑 docker-compose.yml 中的 HOST 为您的实际IP地址
docker build -t antvis-chart-sse:latest .
docker compose up -d
# 验证服务状态
curl http://YOUR_IP:7001/health
docker compose ps antvis-mcp
```

🎉 现在您可以通过MCP客户端使用8个强大的图表渲染工具了！ 
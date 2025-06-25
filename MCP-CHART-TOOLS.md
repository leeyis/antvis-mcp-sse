# 📊 MCP Chart Render 图表工具详细说明

## 🛠️ 可用工具列表

### 1. 📈 `render_line_chart` - 折线图

**用途**: 显示数据随时间变化的趋势

**参数**:
- `data` (必需): 数据数组
  - `time`: 时间点（字符串或数字）
  - `value`: 对应的数值
- `title` (可选): 图表标题
- `axisXTitle` (可选): X轴标题  
- `axisYTitle` (可选): Y轴标题

**示例**:
```json
{
  "data": [
    { "time": 2018, "value": 91.9 },
    { "time": 2019, "value": 99.1 },
    { "time": 2020, "value": 101.6 },
    { "time": 2021, "value": 114.4 },
    { "time": 2022, "value": 121 }
  ],
  "title": "年销售额趋势",
  "axisXTitle": "年份",
  "axisYTitle": "销售额（亿元）"
}
```

---

### 2. 📊 `render_column_chart` - 柱状图

**用途**: 比较不同类别的数值

**参数**:
- `data` (必需): 数据数组
  - `category`: 类别名称
  - `value`: 对应的数值
  - `group` (可选): 分组名称（用于分组或堆叠图）
- `group` (可选): 是否启用分组显示
- `stack` (可选): 是否启用堆叠显示
- `title` (可选): 图表标题
- `axisXTitle` (可选): X轴标题
- `axisYTitle` (可选): Y轴标题

**基础柱状图示例**:
```json
{
  "data": [
    { "category": "2015年", "value": 80 },
    { "category": "2016年", "value": 140 },
    { "category": "2017年", "value": 220 }
  ],
  "title": "年度收入",
  "axisXTitle": "年份",
  "axisYTitle": "金额（百万元）"
}
```

**分组柱状图示例**:
```json
{
  "data": [
    { "category": "北京", "value": 825.6, "group": "油车" },
    { "category": "北京", "value": 60.2, "group": "新能源车" },
    { "category": "上海", "value": 450, "group": "油车" },
    { "category": "上海", "value": 95, "group": "新能源车" }
  ],
  "group": true,
  "title": "城市汽车销量对比",
  "axisXTitle": "城市",
  "axisYTitle": "销量（万辆）"
}
```

---

### 3. 📋 `render_bar_chart` - 条形图

**用途**: 水平方向的柱状图，适合类别名称较长的场景

**参数**: 与柱状图相同

**示例**:
```json
{
  "data": [
    { "category": "产品经理", "value": 85000 },
    { "category": "软件工程师", "value": 95000 },
    { "category": "数据分析师", "value": 75000 }
  ],
  "title": "职位平均薪资",
  "axisXTitle": "薪资（元）",
  "axisYTitle": "职位"
}
```

---

### 4. 🥧 `render_pie_chart` - 饼图

**用途**: 显示各部分占整体的比例

**参数**:
- `data` (必需): 数据数组
  - `category`: 类别名称
  - `value`: 对应的数值（不支持百分比）
- `innerRadius` (可选): 内半径，设置为0.6可制作环图
- `title` (可选): 图表标题

**饼图示例**:
```json
{
  "data": [
    { "category": "移动端", "value": 450 },
    { "category": "桌面端", "value": 320 },
    { "category": "平板端", "value": 180 }
  ],
  "title": "用户设备分布"
}
```

**环图示例**:
```json
{
  "data": [
    { "category": "城镇人口", "value": 63.89 },
    { "category": "乡村人口", "value": 36.11 }
  ],
  "innerRadius": 0.6,
  "title": "全国人口居住对比"
}
```

---

### 5. 📉 `render_area_chart` - 面积图

**用途**: 显示数据随时间变化的趋势和总量

**参数**:
- `data` (必需): 数据数组
  - `time`: 时间点
  - `value`: 对应的数值
  - `group` (可选): 分组名称（用于堆叠面积图）
- `stack` (可选): 是否启用堆叠显示
- `title` (可选): 图表标题
- `axisXTitle` (可选): X轴标题
- `axisYTitle` (可选): Y轴标题

**基础面积图示例**:
```json
{
  "data": [
    { "time": "1月", "value": 23.895 },
    { "time": "2月", "value": 23.695 },
    { "time": "3月", "value": 23.655 }
  ],
  "title": "股票价格变化",
  "axisXTitle": "月份",
  "axisYTitle": "价格"
}
```

**堆叠面积图示例**:
```json
{
  "data": [
    { "time": "2019年", "value": 150, "group": "北京" },
    { "time": "2020年", "value": 160, "group": "北京" },
    { "time": "2019年", "value": 100, "group": "上海" },
    { "time": "2020年", "value": 110, "group": "上海" }
  ],
  "stack": true,
  "title": "城市数据对比",
  "axisXTitle": "年份",
  "axisYTitle": "数值"
}
```

---

### 6. 📍 `render_scatter_chart` - 散点图

**用途**: 显示两个变量之间的关系

**参数**:
- `data` (必需): 数据数组
  - `x`: X轴数值
  - `y`: Y轴数值
- `title` (可选): 图表标题
- `axisXTitle` (可选): X轴标题
- `axisYTitle` (可选): Y轴标题

**示例**:
```json
{
  "data": [
    { "x": 25, "y": 5000 },
    { "x": 35, "y": 7000 },
    { "x": 45, "y": 10000 }
  ],
  "title": "年龄与收入关系",
  "axisXTitle": "年龄",
  "axisYTitle": "收入"
}
```

---

### 7. ⚖️ `render_dual_axes_chart` - 双轴图

**用途**: 显示两个不同单位或量级的数据系列

**参数**:
- `categories` (必需): X轴分类数组
- `series` (必需): 数据系列数组，最多支持2个系列
  - `type`: 图表类型（'line' 或 'column'）
  - `data`: 数据数组
  - `axisYTitle` (可选): Y轴标题
- `title` (可选): 图表标题
- `axisXTitle` (可选): X轴标题

**示例**:
```json
{
  "categories": ["2018", "2019", "2020", "2021", "2022"],
  "series": [
    {
      "type": "column",
      "data": [91.9, 99.1, 101.6, 114.4, 121],
      "axisYTitle": "销售额（亿元）"
    },
    {
      "type": "line", 
      "data": [5.5, 6.0, 6.2, 7.0, 7.5],
      "axisYTitle": "利润率（%）"
    }
  ],
  "title": "销售额与利润率",
  "axisXTitle": "年份"
}
```

---

### 8. 📊 `render_histogram_chart` - 直方图

**用途**: 显示数据的分布情况

**参数**:
- `data` (必需): 数据数组
  - `value`: 数值
- `binNumber` (可选): 分箱数量，默认为10
- `title` (可选): 图表标题

**示例**:
```json
{
  "data": [
    { "value": 78 },
    { "value": 88 },
    { "value": 60 },
    { "value": 100 },
    { "value": 95 }
  ],
  "binNumber": 5,
  "title": "考试成绩分布"
}
```

---

## 🚀 使用方法

### 1. 连接MCP服务器
```bash
# 建立SSE连接
curl -N http://localhost:3001/sse
```

### 2. 初始化连接
```bash
curl -X POST "http://localhost:3001/messages?sessionId={sessionId}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"tools":{},"resources":{}},"clientInfo":{"name":"client","version":"1.0.0"}}}'
```

### 3. 获取工具列表
```bash
curl -X POST "http://localhost:3001/messages?sessionId={sessionId}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

### 4. 调用图表工具
```bash
curl -X POST "http://localhost:3001/messages?sessionId={sessionId}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"render_line_chart","arguments":{"data":[{"time":2023,"value":100}],"title":"测试折线图"}}}'
```

---

## 📁 资源访问

生成的图表可通过以下方式访问：

### 1. 列出所有图片
```bash
curl -X POST "http://localhost:3001/messages?sessionId={sessionId}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"resources/list"}'
```

### 2. 读取图片内容
```bash
curl -X POST "http://localhost:3001/messages?sessionId={sessionId}" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":5,"method":"resources/read","params":{"uri":"image://line_chart_1234567890.png"}}'
```

---

## ⚙️ 注意事项

1. **数据格式**: 严格按照每个工具的参数格式传入数据
2. **数值类型**: 所有数值字段必须是数字类型，不支持字符串
3. **必需字段**: 确保提供所有标记为"必需"的参数
4. **文件命名**: 生成的图片文件名格式为 `{图表类型}_chart_{时间戳}.png`
5. **错误处理**: 如果渲染失败，会返回详细的错误信息

---

**更新时间**: 2025-01-25  
**版本**: 2.0.0 
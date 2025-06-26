#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { render } = require('@antv/gpt-vis-ssr');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const express = require('express');
const crypto = require('crypto');
const https = require('https');
const http = require('http');

class ChartRenderMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'chart-render',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // 确保images目录存在
    this.imagesDir = path.join(__dirname, 'images');
    if (!fsSync.existsSync(this.imagesDir)) {
      fsSync.mkdirSync(this.imagesDir, { recursive: true });
    }

    // 初始化端口号变量
    this.port = null;

    // 图表缓存
    this.chartCache = new Map();

    // 设置错误处理
    this.setupErrorHandling();
    this.setupHandlers();
    
    // 存储传输层实例
    this.transports = {};
  }

  setupErrorHandling() {
    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      this.logError('未捕获的异常', error);
      process.exit(1);
    });

    // 处理未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      this.logError('未处理的Promise拒绝', reason);
      // 不退出进程，记录错误即可
    });
  }

  logInfo(message, ...args) {
    console.error(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  }

  logError(message, error) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
    if (error) {
      console.error('错误详情:', error);
    }
  }

  setupHandlers() {
    // 注册工具列表处理器
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'render_line_chart',
            description: '渲染折线图 - 用于显示数据随时间变化的趋势',
            inputSchema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  description: '数据数组，每个元素包含时间和数值',
                  items: {
                    type: 'object',
                    properties: {
                      time: { type: ['string', 'number'], description: '时间点（如年份、月份）' },
                      value: { type: 'number', description: '对应的数值' }
                    },
                    required: ['time', 'value']
                  }
                },
                title: { type: 'string', description: '图表标题（可选）' },
                axisXTitle: { type: 'string', description: 'X轴标题（可选）' },
                axisYTitle: { type: 'string', description: 'Y轴标题（可选）' }
              },
              required: ['data']
            }
          },
          {
            name: 'render_column_chart',
            description: '渲染柱状图 - 用于比较不同类别的数值',
            inputSchema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  description: '数据数组，每个元素包含类别和数值',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string', description: '类别名称' },
                      value: { type: 'number', description: '对应的数值' },
                      group: { type: 'string', description: '分组名称（用于分组或堆叠图，可选）' }
                    },
                    required: ['category', 'value']
                  }
                },
                group: { type: 'boolean', description: '是否启用分组显示' },
                stack: { type: 'boolean', description: '是否启用堆叠显示' },
                title: { type: 'string', description: '图表标题（可选）' },
                axisXTitle: { type: 'string', description: 'X轴标题（可选）' },
                axisYTitle: { type: 'string', description: 'Y轴标题（可选）' }
              },
              required: ['data']
            }
          },
          {
            name: 'render_bar_chart',
            description: '渲染条形图 - 水平方向的柱状图，适合类别名称较长的场景',
            inputSchema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  description: '数据数组，每个元素包含类别和数值',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string', description: '类别名称' },
                      value: { type: 'number', description: '对应的数值' },
                      group: { type: 'string', description: '分组名称（用于分组或堆叠图，可选）' }
                    },
                    required: ['category', 'value']
                  }
                },
                group: { type: 'boolean', description: '是否启用分组显示' },
                stack: { type: 'boolean', description: '是否启用堆叠显示' },
                title: { type: 'string', description: '图表标题（可选）' },
                axisXTitle: { type: 'string', description: 'X轴标题（可选）' },
                axisYTitle: { type: 'string', description: 'Y轴标题（可选）' }
              },
              required: ['data']
            }
          },
          {
            name: 'render_pie_chart',
            description: '渲染饼图 - 用于显示各部分占整体的比例',
            inputSchema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  description: '数据数组，每个元素包含类别和数值',
                  items: {
                    type: 'object',
                    properties: {
                      category: { type: 'string', description: '类别名称' },
                      value: { type: 'number', description: '对应的数值（不支持百分比）' }
                    },
                    required: ['category', 'value']
                  }
                },
                innerRadius: { type: 'number', description: '内半径，设置为0.6可制作环图' },
                title: { type: 'string', description: '图表标题（可选）' }
              },
              required: ['data']
            }
          },
          {
            name: 'render_area_chart',
            description: '渲染面积图 - 用于显示数据随时间变化的趋势和总量',
            inputSchema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  description: '数据数组，每个元素包含时间、数值和可选的分组',
                  items: {
                    type: 'object',
                    properties: {
                      time: { type: ['string', 'number'], description: '时间点' },
                      value: { type: 'number', description: '对应的数值' },
                      group: { type: 'string', description: '分组名称（用于堆叠面积图，可选）' }
                    },
                    required: ['time', 'value']
                  }
                },
                stack: { type: 'boolean', description: '是否启用堆叠显示（需要group字段）' },
                title: { type: 'string', description: '图表标题（可选）' },
                axisXTitle: { type: 'string', description: 'X轴标题（可选）' },
                axisYTitle: { type: 'string', description: 'Y轴标题（可选）' }
              },
              required: ['data']
            }
          },
          {
            name: 'render_scatter_chart',
            description: '渲染散点图 - 用于显示两个变量之间的关系',
            inputSchema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  description: '数据数组，每个元素包含X和Y坐标',
                  items: {
                    type: 'object',
                    properties: {
                      x: { type: 'number', description: 'X轴数值' },
                      y: { type: 'number', description: 'Y轴数值' }
                    },
                    required: ['x', 'y']
                  }
                },
                title: { type: 'string', description: '图表标题（可选）' },
                axisXTitle: { type: 'string', description: 'X轴标题（可选）' },
                axisYTitle: { type: 'string', description: 'Y轴标题（可选）' }
              },
              required: ['data']
            }
          },
          {
            name: 'render_dual_axes_chart',
            description: '渲染双轴图 - 用于显示两个不同单位或量级的数据系列',
            inputSchema: {
              type: 'object',
              properties: {
                categories: {
                  type: 'array',
                  description: 'X轴分类数组',
                  items: { type: 'string' }
                },
                series: {
                  type: 'array',
                  description: '数据系列数组，最多支持2个系列',
                  items: {
                    type: 'object',
                    properties: {
                      type: { type: 'string', enum: ['line', 'column'], description: '图表类型：line（折线）或column（柱状）' },
                      data: { type: 'array', items: { type: 'number' }, description: '数据数组' },
                      axisYTitle: { type: 'string', description: 'Y轴标题' }
                    },
                    required: ['type', 'data']
                  }
                },
                title: { type: 'string', description: '图表标题（可选）' },
                axisXTitle: { type: 'string', description: 'X轴标题（可选）' }
              },
              required: ['categories', 'series']
            }
          },
          {
            name: 'render_histogram_chart',
            description: '渲染直方图 - 用于显示数据的分布情况',
            inputSchema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  description: '数据数组，每个元素包含一个数值',
                  items: {
                    type: 'object',
                    properties: {
                      value: { type: 'number', description: '数值' }
                    },
                    required: ['value']
                  }
                },
                binNumber: { type: 'number', description: '分箱数量，默认为10' },
                title: { type: 'string', description: '图表标题（可选）' }
              },
              required: ['data']
            }
          }
        ],
      };
    });

    // 注册工具调用处理器
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'render_line_chart':
          return await this.handleRenderChart('line', args);
        case 'render_column_chart':
          return await this.handleRenderChart('column', args);
        case 'render_bar_chart':
          return await this.handleRenderChart('bar', args);
        case 'render_pie_chart':
          return await this.handleRenderChart('pie', args);
        case 'render_area_chart':
          return await this.handleRenderChart('area', args);
        case 'render_scatter_chart':
          return await this.handleRenderChart('scatter', args);
        case 'render_dual_axes_chart':
          return await this.handleRenderChart('dual-axes', args);
        case 'render_histogram_chart':
          return await this.handleRenderChart('histogram', args);
        default:
          throw new Error(`未知的工具: ${name}`);
      }
    });

    // 注册资源列表处理器
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const imageFiles = fs.readdirSync(this.imagesDir)
        .filter(file => file.endsWith('.png'))
        .map(file => ({
          uri: `image://${file}`,
          name: file,
          description: `生成的图表图片: ${file}`,
          mimeType: 'image/png',
        }));

      return {
        resources: imageFiles,
      };
    });

    // 注册资源读取处理器
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      if (!uri.startsWith('image://')) {
        throw new Error(`不支持的资源URI: ${uri}`);
      }

      const filename = uri.replace('image://', '');
      const imagePath = path.join(this.imagesDir, filename);

      if (!fs.existsSync(imagePath)) {
        throw new Error(`图片文件不存在: ${filename}`);
      }

      const imageData = fs.readFileSync(imagePath);
      
      return {
        contents: [
          {
            uri,
            mimeType: 'image/png',
            blob: imageData.toString('base64'),
          },
        ],
      };
    });
  }

  transformDataFormat(chartType, args) {
    const { data, ...restArgs } = args;
  
    // 检查是否是类Chart.js格式
    if (data && typeof data === 'object' && !Array.isArray(data) && (data.labels || data.categories) && data.datasets) {
      this.logInfo('检测到类Chart.js数据格式，正在进行转换...');
      
      const labels = data.labels || data.categories;
      const values = data.datasets && data.datasets[0] ? data.datasets[0].data : [];
  
      if (!labels || !values || labels.length !== values.length) {
        this.logError('数据格式不兼容: labels/categories 和 datasets[0].data 长度不匹配');
        // 返回原始参数，让下游处理错误
        return args;
      }
      
      let transformedData;
      
      switch(chartType) {
          case 'line':
          case 'area':
              transformedData = labels.map((label, index) => ({
                  time: label,
                  value: values[index]
              }));
              break;
          case 'scatter':
              // 假设Chart.js的散点图数据也用labels/values表示
              transformedData = labels.map((label, index) => ({
                  x: label, 
                  y: values[index]
              }));
              break;
          case 'pie':
          case 'bar':
          case 'column':
          default:
               transformedData = labels.map((label, index) => ({
                  category: label,
                  value: values[index]
               }));
              break;
      }
  
      const finalArgs = { ...restArgs, data: transformedData };
      
      // 尝试从Chart.js的options中提取标题
      const chartJsTitle = args.options?.plugins?.title?.text;
      if (chartJsTitle && !finalArgs.title) {
          finalArgs.title = chartJsTitle;
      }
      
      this.logInfo('数据转换完成');
      return finalArgs;
    }
  
    // 如果不是需要转换的格式，直接返回原样
    return args;
  }

  async handleRenderChart(chartType, args) {
    const startTime = Date.now();
    try {
      this.logInfo(`接收到${chartType}图表渲染请求`);
      
      const transformedArgs = this.transformDataFormat(chartType, args);

      // 构建标准的图表配置
      const chartConfig = {
        type: chartType,
        ...transformedArgs
      };

      // 生成配置哈希用于缓存
      const configHash = crypto.createHash('md5').update(JSON.stringify(chartConfig)).digest('hex');
      const cachedResult = this.chartCache.get(configHash);
      
      if (cachedResult) {
        this.logInfo(`使用缓存图表，哈希: ${configHash}`);
        const cacheTime = Date.now() - startTime;
        this.logInfo(`缓存命中，耗时: ${cacheTime}ms`);
        return cachedResult;
      }

      // 渲染开始时间
      const renderStart = Date.now();
      this.logInfo(`开始渲染图表，配置哈希: ${configHash}`);

      // 使用antv/gpt-vis-ssr渲染图表
      const vis = await render(chartConfig);
      const buffer = vis.toBuffer();
      const renderTime = Date.now() - renderStart;

      // 生成唯一文件名
      const timestamp = Date.now();
      const filename = `${chartType}_chart_${timestamp}.png`;
      const outputPath = path.join(this.imagesDir, filename);

      // 异步保存图片文件
      const fileStart = Date.now();
      await fs.writeFile(outputPath, buffer);
      const fileTime = Date.now() - fileStart;

      const totalTime = Date.now() - startTime;
      this.logInfo(`图表渲染完成 - 渲染:${renderTime}ms, 文件:${fileTime}ms, 总计:${totalTime}ms`);

      // 构建图片URL（智能协议选择：优先HTTPS，回退HTTP）
      const host = process.env.HOST || 'localhost';
      const enableHttps = process.env.ENABLE_HTTPS === 'true';
      const enableHttp = process.env.ENABLE_HTTP !== 'false';
      
      // 获取端口配置
      const httpPort = parseInt(process.env.HTTP_PORT) || 80;
      const httpsPort = parseInt(process.env.HTTPS_PORT) || 443;
      
      // 智能选择协议（优先HTTPS）
      const protocol = enableHttps ? 'https' : 'http';
      const currentPort = protocol === 'https' ? httpsPort : httpPort;
      
      // 智能端口处理：标准端口不显示，非标准端口显示
      let portStr = '';
      if (protocol === 'https' && currentPort !== 443) {
        portStr = `:${currentPort}`;
      } else if (protocol === 'http' && currentPort !== 80) {
        portStr = `:${currentPort}`;
      }
      
      const imageUrl = `${protocol}://${host}${portStr}/images/${filename}`;
      
      // 添加调试日志
      this.logInfo(`URL生成信息 - 协议:${protocol}(HTTPS:${enableHttps}), 主机:${host}, 端口:${currentPort}, 完整URL:${imageUrl}`);
      
      // 生成相对协议URL（自动匹配页面协议，解决混合内容问题）
      const relativeProtocolUrl = `//${host}${portStr}/images/${filename}`;
      
      // 同时生成HTTP和HTTPS两种URL供备选使用
      const httpUrl = `http://${host}${httpPort !== 80 ? `:${httpPort}` : ''}/images/${filename}`;
      const httpsUrl = `https://${host}${httpsPort !== 443 ? `:${httpsPort}` : ''}/images/${filename}`;

      const result = {
        content: [
          {
            type: 'text',
            text: `${chartType}图表渲染成功！`,
          },
          {
            type: 'text', 
            text: `生成的图片文件: ${filename}`,
          },
          {
            type: 'text',
            text: `文件路径: ${outputPath}`,
          },
          {
            type: 'text',
            text: `文件大小: ${Math.round(buffer.length / 1024)}KB`,
          },
          {
            type: 'text',
            text: `主要访问URL: ${imageUrl}`,
          },
          {
            type: 'text',
            text: `HTTPS访问URL: ${httpsUrl}`,
          },
          {
            type: 'text',
            text: `HTTP访问URL: ${httpUrl}`,
          },
          {
            type: 'text',
            text: `相对协议URL（推荐HTTPS环境）: ${relativeProtocolUrl}`,
          },
          {
            type: 'text',
            text: `资源URI: image://${filename}`,
          },
          {
            type: 'text',
            text: `渲染耗时: ${totalTime}ms`,
          },
        ],
      };

      // 缓存结果（限制缓存大小）
      if (this.chartCache.size >= 100) {
        const firstKey = this.chartCache.keys().next().value;
        this.chartCache.delete(firstKey);
      }
      
      // 增强缓存信息，包含多种URL格式
      const cacheData = {
        ...result,
        metadata: {
          filename,
          outputPath,
          imageUrl,
          relativeProtocolUrl,
          fileSize: buffer.length,
          renderTime: totalTime,
          timestamp: Date.now()
        }
      };
      
      this.chartCache.set(configHash, cacheData);

      return result;
    } catch (error) {
      this.logError(`${chartType}图表渲染失败`, error);
      
      return {
        content: [
          {
            type: 'text',
            text: `${chartType}图表渲染失败: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  async createSSEServer() {
    const app = express();
    app.use(express.json());

    // 添加静态文件服务中间件，提供图片访问URL
    app.use('/images', express.static(this.imagesDir));

    // SSE endpoint - 建立SSE连接
    app.get('/sse', async (req, res) => {
      try {
        // 记录连接来源信息
        const clientInfo = {
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          referer: req.get('Referer'),
          origin: req.get('Origin')
        };
        this.logInfo('建立新的SSE连接', clientInfo);
        
        // 创建 SSE transport，让它自己生成会话ID
        const transport = new SSEServerTransport('/messages', res);
        
        // 连接到MCP服务器
        await this.server.connect(transport);
        
        // 从transport中获取实际的会话ID
        const sessionId = transport.sessionId;
        
        // 存储transport
        this.transports[sessionId] = transport;
        
        // 清理连接
        res.on('close', () => {
          this.logInfo(`SSE连接关闭: ${sessionId}`);
          delete this.transports[sessionId];
        });
        
        this.logInfo(`SSE连接已建立，会话ID: ${sessionId}`);
      } catch (error) {
        this.logError('SSE连接失败', error);
        if (!res.headersSent) {
          res.status(500).send('SSE连接失败');
        }
      }
    });

    // Messages endpoint - 处理客户端POST消息
    app.post('/messages', async (req, res) => {
      try {
        // 从query参数或header中获取会话ID
        const sessionId = req.query.sessionId || req.headers['x-session-id'];
        
        this.logInfo(`处理消息，会话ID: ${sessionId}`);
        
        if (!sessionId) {
          return res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: '缺少sessionId参数'
            },
            id: req.body?.id || null
          });
        }
        
        const transport = this.transports[sessionId];
        if (!transport) {
          return res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: `未找到会话ID为 ${sessionId} 的SSE传输层`
            },
            id: req.body?.id || null
          });
        }

        // 使用transport处理消息
        await transport.handlePostMessage(req, res, req.body);
      } catch (error) {
        this.logError('处理消息失败', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: `内部服务器错误: ${error.message}`
            },
            id: req.body?.id || null
          });
        }
      }
    });

    // 健康检查端点
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        activeConnections: Object.keys(this.transports).length
      });
    });

    return app;
  }

  async run() {
    const httpPort = process.env.HTTP_PORT || 80;
    const httpsPort = process.env.HTTPS_PORT || 443;
    const enableHttps = process.env.ENABLE_HTTPS === 'true';
    const enableHttp = process.env.ENABLE_HTTP !== 'false'; // 默认启用HTTP
    
    // 设置主端口（用于URL生成，优先HTTPS）
    this.port = enableHttps ? httpsPort : httpPort;
    
    try {
      const app = await this.createSSEServer();
      const servers = [];

      // 启动HTTP服务器
      if (enableHttp) {
        const httpServer = http.createServer(app);
        httpServer.listen(httpPort, () => {
          this.logInfo(`HTTP服务器已启动`);
          this.logInfo(`- 端口: ${httpPort}`);
          this.logInfo(`- SSE端点: http://localhost:${httpPort}/sse`);
          this.logInfo(`- 消息端点: http://localhost:${httpPort}/messages`);
          this.logInfo(`- 健康检查: http://localhost:${httpPort}/health`);
        });
        servers.push(httpServer);
      }

      // 启动HTTPS服务器
      if (enableHttps) {
        const sslConfig = await this.getSSLConfig();
        if (sslConfig) {
          const httpsServer = https.createServer(sslConfig, app);
          httpsServer.listen(httpsPort, () => {
            this.logInfo(`HTTPS服务器已启动`);
            this.logInfo(`- 端口: ${httpsPort}`);
            this.logInfo(`- SSE端点: https://localhost:${httpsPort}/sse`);
            this.logInfo(`- 消息端点: https://localhost:${httpsPort}/messages`);
            this.logInfo(`- 健康检查: https://localhost:${httpsPort}/health`);
          });
          servers.push(httpsServer);
        } else {
          this.logError('HTTPS启用失败', new Error('无法获取SSL证书配置'));
        }
      }

      if (servers.length === 0) {
        throw new Error('没有启动任何服务器');
      }

      this.logInfo(`MCP Chart Render SSE服务器启动完成`);
      this.logInfo(`- HTTP${enableHttp ? '已启用' : '已禁用'}: ${httpPort}`);
      this.logInfo(`- HTTPS${enableHttps ? '已启用' : '已禁用'}: ${httpsPort}`);
      this.logInfo(`- 主协议: ${enableHttps ? 'HTTPS' : 'HTTP'}`);
      
    } catch (error) {
      this.logError('服务器启动失败', error);
      throw error;
    }
  }

  // 生成自签名SSL证书（用于开发和内网环境）
  async generateSelfSignedCert() {
    const certDir = path.join(__dirname, 'ssl');
    const keyPath = path.join(certDir, 'key.pem');
    const certPath = path.join(certDir, 'cert.pem');
    
    // 检查证书是否已存在
    if (fsSync.existsSync(keyPath) && fsSync.existsSync(certPath)) {
      this.logInfo('SSL证书已存在，使用现有证书');
      return { keyPath, certPath };
    }
    
    // 创建ssl目录
    if (!fsSync.existsSync(certDir)) {
      fsSync.mkdirSync(certDir, { recursive: true });
    }
    
    try {
      // 使用openssl生成自签名证书
      const { execSync } = require('child_process');
      const host = process.env.HOST || 'localhost';
      
      // 生成私钥
      execSync(`openssl genrsa -out ${keyPath} 2048`, { stdio: 'pipe' });
      
      // 生成证书
      execSync(`openssl req -new -x509 -key ${keyPath} -out ${certPath} -days 365 -subj "/C=CN/ST=State/L=City/O=Organization/CN=${host}"`, { stdio: 'pipe' });
      
      this.logInfo('自签名SSL证书生成成功');
      return { keyPath, certPath };
    } catch (error) {
      this.logError('SSL证书生成失败', error);
      return null;
    }
  }

  // 获取SSL证书配置
  async getSSLConfig() {
    // 优先使用外部提供的证书
    const externalKeyPath = process.env.SSL_KEY_PATH;
    const externalCertPath = process.env.SSL_CERT_PATH;
    
    if (externalKeyPath && externalCertPath && fsSync.existsSync(externalKeyPath) && fsSync.existsSync(externalCertPath)) {
      this.logInfo('使用外部SSL证书');
      return {
        key: await fs.readFile(externalKeyPath),
        cert: await fs.readFile(externalCertPath)
      };
    }
    
    // 如果启用HTTPS但没有外部证书，生成自签名证书
    if (process.env.ENABLE_HTTPS === 'true') {
      const certInfo = await this.generateSelfSignedCert();
      if (certInfo) {
        return {
          key: await fs.readFile(certInfo.keyPath),
          cert: await fs.readFile(certInfo.certPath)
        };
      }
    }
    
    return null;
  }
}

// 启动服务器
if (require.main === module) {
  const server = new ChartRenderMCPServer();
  server.run().catch((error) => {
    console.error('服务器启动失败:', error);
    process.exit(1);
  });
}

module.exports = ChartRenderMCPServer;
#!/usr/bin/env node

/**
 * 完整的图表渲染功能测试
 * 演示如何通过 MCP SSE 服务器生成图表
 */

const { EventSource } = require('eventsource');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class ChartRenderTester {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.sessionId = null;
    this.eventSource = null;
  }

  async establishSSEConnection() {
    return new Promise((resolve, reject) => {
      console.log('🔗 建立 SSE 连接...');
      
      this.eventSource = new EventSource(`${this.baseUrl}/sse`);
      
      this.eventSource.onopen = () => {
        console.log('✅ SSE 连接已建立');
      };
      
      this.eventSource.onmessage = (event) => {
        console.log('📨 收到 SSE 消息:', event.data);
        
        // 解析端点信息获取 session ID
        if (event.data.includes('/messages?sessionId=')) {
          const match = event.data.match(/sessionId=([^&\s]+)/);
          if (match) {
            this.sessionId = match[1];
            console.log(`🆔 获取到会话 ID: ${this.sessionId}`);
            resolve();
          }
        }
      };
      
      this.eventSource.onerror = (error) => {
        console.error('❌ SSE 连接错误:', error);
        reject(error);
      };
      
      // 超时处理
      setTimeout(() => {
        if (!this.sessionId) {
          reject(new Error('SSE 连接超时'));
        }
      }, 5000);
    });
  }

  async sendMCPMessage(message) {
    if (!this.sessionId) {
      throw new Error('需要先建立 SSE 连接');
    }

    const url = `${this.baseUrl}/messages?sessionId=${this.sessionId}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error(`HTTP 错误: ${response.status}`);
    }

    return await response.json();
  }

  async initializeMCP() {
    console.log('🚀 初始化 MCP 连接...');
    
    const initMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {}
        },
        clientInfo: {
          name: 'chart-test-client',
          version: '1.0.0'
        }
      }
    };

    const response = await this.sendMCPMessage(initMessage);
    console.log('✅ MCP 初始化成功:', response);
    return response;
  }

  async listTools() {
    console.log('📋 获取可用工具列表...');
    
    const listMessage = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    };

    const response = await this.sendMCPMessage(listMessage);
    console.log('✅ 工具列表:', response);
    return response;
  }

  async renderChart() {
    console.log('📊 开始渲染图表...');
    
    const chartConfig = {
      type: 'line',
      data: [
        { x: '2023-01', y: 100 },
        { x: '2023-02', y: 120 },
        { x: '2023-03', y: 140 },
        { x: '2023-04', y: 110 },
        { x: '2023-05', y: 160 }
      ],
      options: {
        title: '月度销售趋势',
        xField: 'x',
        yField: 'y',
        smooth: true
      }
    };

    const renderMessage = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'render_chart',
        arguments: {
          chartConfig: chartConfig
        }
      }
    };

    const response = await this.sendMCPMessage(renderMessage);
    console.log('✅ 图表渲染完成:', response);
    return response;
  }

  async listResources() {
    console.log('📁 获取可用资源列表...');
    
    const listMessage = {
      jsonrpc: '2.0',
      id: 4,
      method: 'resources/list'
    };

    const response = await this.sendMCPMessage(listMessage);
    console.log('✅ 资源列表:', response);
    return response;
  }

  close() {
    if (this.eventSource) {
      this.eventSource.close();
      console.log('🔌 SSE 连接已关闭');
    }
  }

  async runFullTest() {
    console.log('=== MCP Chart Render 完整功能测试 ===\n');

    try {
      // 1. 建立 SSE 连接
      await this.establishSSEConnection();
      console.log('');

      // 2. 初始化 MCP
      await this.initializeMCP();
      console.log('');

      // 3. 列出可用工具
      await this.listTools();
      console.log('');

      // 4. 渲染图表
      await this.renderChart();
      console.log('');

      // 5. 列出生成的资源
      await this.listResources();
      console.log('');

      console.log('🎉 所有测试完成！');
      console.log('📂 请检查 images/ 目录查看生成的图表');

    } catch (error) {
      console.error('💥 测试失败:', error);
      throw error;
    } finally {
      this.close();
    }
  }
}

// 运行测试
if (require.main === module) {
  const tester = new ChartRenderTester();
  tester.runFullTest().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = ChartRenderTester; 
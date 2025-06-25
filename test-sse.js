#!/usr/bin/env node

/**
 * SSE MCP 服务器简单测试脚本
 * 测试基本的 HTTP 端点和连接功能
 */

const http = require('http');

class SSEMCPTester {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  async testHealthCheck() {
    return new Promise((resolve, reject) => {
      console.log('🏥 测试健康检查端点...');
      
      http.get(`${this.baseUrl}/health`, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            console.log('✅ 健康检查通过:', health);
            resolve(health);
          } catch (error) {
            console.error('❌ 健康检查解析失败:', error);
            reject(error);
          }
        });
      }).on('error', (error) => {
        console.error('❌ 健康检查请求失败:', error);
        reject(error);
      });
    });
  }

  async testSSEConnection() {
    return new Promise((resolve, reject) => {
      console.log('🔗 测试SSE连接...');
      
      const req = http.get(`${this.baseUrl}/sse`, (res) => {
        console.log('✅ SSE连接建立成功');
        console.log(`状态码: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        
        res.on('data', (chunk) => {
          console.log('📨 收到SSE数据:', chunk.toString());
        });
        
        // 等待2秒后关闭连接
        setTimeout(() => {
          req.destroy();
          console.log('🔌 SSE连接已关闭');
          resolve();
        }, 2000);
      });
      
      req.on('error', (error) => {
        console.error('❌ SSE连接失败:', error);
        reject(error);
      });
    });
  }

  async testMCPInitialize() {
    return new Promise((resolve, reject) => {
      console.log('🚀 测试MCP初始化...');
      
      const postData = JSON.stringify({
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
            name: 'test-client',
            version: '1.0.0'
          }
        }
      });

      const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            console.log(`📡 MCP响应状态: ${res.statusCode}`);
            console.log('📋 MCP响应数据:', data);
            resolve(data);
          } catch (error) {
            console.error('❌ MCP响应解析失败:', error);
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ MCP请求失败:', error);
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  async runAllTests() {
    console.log('=== MCP Chart Render SSE服务器测试 ===\n');

    try {
      // 测试健康检查
      await this.testHealthCheck();
      console.log('');

      // 测试SSE连接
      await this.testSSEConnection();
      console.log('');

      // 测试MCP初始化
      await this.testMCPInitialize();
      console.log('');

      console.log('🎉 所有测试完成！');
    } catch (error) {
      console.error('💥 测试失败:', error);
      process.exit(1);
    }
  }
}

// 运行测试
if (require.main === module) {
  const tester = new SSEMCPTester();
  tester.runAllTests().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = SSEMCPTester; 
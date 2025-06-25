#!/usr/bin/env node

/**
 * MCP Chart Render SSE服务器测试脚本
 * 用于验证服务器是否正常运行和MCP协议是否正确实现
 */

const { SSEClientTransport } = require('@modelcontextprotocol/sdk/client/sse.js');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');

class MCPTester {
  constructor(serverUrl = 'http://localhost:3001/message') {
    this.serverUrl = serverUrl;
    this.client = null;
  }

  async connect() {
    try {
      console.log(`🔗 连接到MCP服务器: ${this.serverUrl}`);
      
      const transport = new SSEClientTransport(this.serverUrl);
      this.client = new Client(
        {
          name: 'test-client',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await this.client.connect(transport);
      console.log('✅ 连接成功');
      return true;
    } catch (error) {
      console.error('❌ 连接失败:', error.message);
      return false;
    }
  }

  async testListTools() {
    try {
      console.log('\n📋 测试工具列表...');
      const tools = await this.client.listTools();
      
      console.log('✅ 工具列表获取成功:');
      tools.tools.forEach(tool => {
        console.log(`   - ${tool.name}: ${tool.description}`);
      });
      
      return tools.tools.length > 0;
    } catch (error) {
      console.error('❌ 工具列表获取失败:', error.message);
      return false;
    }
  }

  async testRenderChart() {
    try {
      console.log('\n🎨 测试图表渲染工具...');
      
      const testConfig = {
        chartConfig: {
          type: 'bar',
          data: [
            { name: 'A', value: 10 },
            { name: 'B', value: 20 },
            { name: 'C', value: 15 }
          ],
          title: 'MCP测试图表',
          width: 400,
          height: 300
        }
      };

      const result = await this.client.callTool('render_chart', testConfig);
      
      if (result.isError) {
        console.error('❌ 图表渲染失败:', result.content[0].text);
        return false;
      }

      console.log('✅ 图表渲染成功:');
      result.content.forEach(content => {
        console.log(`   ${content.text}`);
      });
      
      return true;
    } catch (error) {
      console.error('❌ 图表渲染测试失败:', error.message);
      return false;
    }
  }

  async testListResources() {
    try {
      console.log('\n📁 测试资源列表...');
      const resources = await this.client.listResources();
      
      console.log('✅ 资源列表获取成功:');
      resources.resources.forEach(resource => {
        console.log(`   - ${resource.name} (${resource.uri})`);
      });
      
      return true;
    } catch (error) {
      console.error('❌ 资源列表获取失败:', error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.close();
        console.log('\n🔌 连接已关闭');
      } catch (error) {
        console.error('关闭连接时出错:', error.message);
      }
    }
  }

  async runTests() {
    console.log('=== MCP Chart Render SSE服务器测试 ===\n');

    // 连接测试
    const connected = await this.connect();
    if (!connected) {
      console.log('\n❌ 测试失败: 无法连接到服务器');
      console.log('请确保服务器正在运行: npm start 或 ./start.sh');
      return;
    }

    let allTestsPassed = true;

    // 工具列表测试
    const toolsTest = await this.testListTools();
    allTestsPassed = allTestsPassed && toolsTest;

    // 图表渲染测试
    const renderTest = await this.testRenderChart();
    allTestsPassed = allTestsPassed && renderTest;

    // 资源列表测试
    const resourcesTest = await this.testListResources();
    allTestsPassed = allTestsPassed && resourcesTest;

    // 断开连接
    await this.disconnect();

    // 测试结果
    console.log('\n=== 测试结果 ===');
    if (allTestsPassed) {
      console.log('🎉 所有测试通过！MCP服务器运行正常');
    } else {
      console.log('⚠️  部分测试失败，请检查服务器配置');
    }
  }
}

// 运行测试
if (require.main === module) {
  const tester = new MCPTester();
  tester.runTests().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

module.exports = MCPTester; 
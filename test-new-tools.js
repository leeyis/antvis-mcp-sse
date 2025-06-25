#!/usr/bin/env node

const EventSource = require('eventsource');

// 动态导入node-fetch
let fetch;
import('node-fetch').then(module => {
  fetch = module.default;
  // 启动测试
  testMCPServer();
});

// 测试用例
const testCases = [
  {
    name: '折线图测试',
    tool: 'render_line_chart',
    args: {
      data: [
        { time: "2023-01", value: 100 },
        { time: "2023-02", value: 120 },
        { time: "2023-03", value: 140 }
      ],
      title: "月度增长趋势",
      axisXTitle: "月份",
      axisYTitle: "数值"
    }
  },
  {
    name: '柱状图测试',
    tool: 'render_column_chart',
    args: {
      data: [
        { category: "北京", value: 825.6 },
        { category: "上海", value: 450 },
        { category: "深圳", value: 506 }
      ],
      title: "城市数据对比",
      axisXTitle: "城市",
      axisYTitle: "数值"
    }
  },
  {
    name: '饼图测试',
    tool: 'render_pie_chart',
    args: {
      data: [
        { category: "移动端", value: 450 },
        { category: "桌面端", value: 320 },
        { category: "平板端", value: 180 }
      ],
      title: "用户设备分布"
    }
  },
  {
    name: '散点图测试',
    tool: 'render_scatter_chart',
    args: {
      data: [
        { x: 25, y: 5000 },
        { x: 35, y: 7000 },
        { x: 45, y: 10000 }
      ],
      title: "年龄与收入关系",
      axisXTitle: "年龄",
      axisYTitle: "收入"
    }
  }
];

function testMCPServer() {
  if (!fetch) {
    console.error('❌ node-fetch 模块加载失败');
    return;
  }

  console.log('🚀 开始测试MCP Chart Render服务器...\n');
  
  const es = new EventSource('http://localhost:3001/sse');
  let sessionId = null;

  es.onopen = async () => {
    // EventSource的URL中没有直接的方式获取自定义头或参数，
    // 但我们的服务器实现会在第一个消息中发送sessionId
    // 这是一个变通的方法来获取它。
    console.log('🔗 SSE连接已打开...');
  };
  
  es.onmessage = async (event) => {
    try {
      // 我们的服务器实现会在第一个事件中发送一个包含sessionId的注释
      if (event.data.includes('sessionId')) {
        const match = event.data.match(/sessionId=([a-f0-9-]+)/);
        if (match && !sessionId) {
          sessionId = match[1];
          console.log(`🆔 成功提取会话ID: ${sessionId}\n`);
          
          // 获取到ID后，开始执行测试流程
          await runTests(sessionId);

          // 完成测试后关闭连接
          es.close();
        }
      }
    } catch (error) {
      console.error('❌ 处理SSE消息时出错:', error);
      es.close();
    }
  };

  es.onerror = (err) => {
    console.error('❌ EventSource 错误:', err);
    es.close();
  };
}

async function runTests(sessionId) {
  try {
    // 1. 初始化MCP连接
    console.log('1️⃣ 初始化MCP连接...');
    const initResponse = await fetch(`http://localhost:3001/messages?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {}, resources: {} },
          clientInfo: { name: 'test-client', version: '1.0.0' }
        }
      })
    });
    const initResult = await initResponse.json();
    console.log('✅ 初始化结果:', initResult.result ? '成功' : '失败');
    
    // 2. 获取工具列表
    console.log('\n2️⃣ 获取工具列表...');
    const toolsResponse = await fetch(`http://localhost:3001/messages?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list'
      })
    });
    const toolsResult = await toolsResponse.json();
    if (toolsResult.result && toolsResult.result.tools) {
      console.log('✅ 可用工具:');
      toolsResult.result.tools.forEach((tool, index) => {
        console.log(`   ${index + 1}. ${tool.name}`);
      });
    }
    
    // 3. 测试图表工具
    console.log('\n3️⃣ 依次测试图表工具...');
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n  -> 📊 [${i+1}/${testCases.length}] ${testCase.name}`);
      try {
        const toolResponse = await fetch(`http://localhost:3001/messages?sessionId=${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 10 + i,
            method: 'tools/call',
            params: { name: testCase.tool, arguments: testCase.args }
          })
        });
        const toolResult = await toolResponse.json();
        if (toolResult.result && toolResult.result.content) {
          console.log('  ✅ 渲染成功:', toolResult.result.content.find(c => c.text.includes('成功')).text);
        } else if (toolResult.error) {
          console.log('  ❌ 渲染失败:', toolResult.error.message);
        } else {
          console.log('  ⚠️ 未知响应格式:', JSON.stringify(toolResult));
        }
      } catch (error) {
        console.log('  ❌ 工具调用错误:', error.message);
      }
    }
    
    // 4. 检查生成的图片
    console.log('\n4️⃣ 检查生成的图片资源...');
    const resourcesResponse = await fetch(`http://localhost:3001/messages?sessionId=${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 50,
        method: 'resources/list'
      })
    });
    const resourcesResult = await resourcesResponse.json();
    if (resourcesResult.result && resourcesResult.result.resources) {
      console.log('📁 发现图片文件:');
      resourcesResult.result.resources.forEach((resource, index) => {
        console.log(`   ${index + 1}. ${resource.name}`);
      });
    }
    
    console.log('\n🎉 所有测试已完成！');
    
  } catch (error) {
    console.error('❌ 测试流程执行失败:', error.message);
  }
}

// 运行测试 (注释掉，因为已在import后调用)
// if (require.main === module) {
//   testMCPServer();
// } 
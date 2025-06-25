#!/usr/bin/env node

const EventSource = require('eventsource');
const fetch = require('node-fetch');

// 测试用例
const testCases = [
  {
    name: '简单折线图',
    config: {
      type: 'line',
      data: [
        { x: '2023-01', y: 100 },
        { x: '2023-02', y: 120 },
        { x: '2023-03', y: 140 }
      ]
    }
  },
  {
    name: '修复后的柱状图',
    config: {
      type: 'bar',
      data: {
        labels: ['2019', '2020', '2021', '2022', '2023'],
        values: [99.1, 101.6, 114.4, 121, 126.1]
      },
      style: {
        title: '中国GDP年度增长 (万亿人民币)',
        xLabel: '年份',
        yLabel: 'GDP',
        color: 'steelblue'
      }
    }
  },
  {
    name: '饼图测试',
    config: {
      type: 'pie',
      data: [
        { category: 'A', value: 30 },
        { category: 'B', value: 25 },
        { category: 'C', value: 45 }
      ]
    }
  }
];

async function testMCPServer() {
  console.log('=== MCP Chart Render 修复测试 ===\n');

  for (const testCase of testCases) {
    console.log(`🧪 测试案例: ${testCase.name}`);
    
    try {
      await testSingleChart(testCase.config);
      console.log(`✅ ${testCase.name} - 成功\n`);
    } catch (error) {
      console.log(`❌ ${testCase.name} - 失败: ${error.message}\n`);
    }
    
    // 等待1秒再进行下一个测试
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function testSingleChart(chartConfig) {
  return new Promise((resolve, reject) => {
    let sessionId = null;
    let eventSource = null;
    
    const timeout = setTimeout(() => {
      if (eventSource) eventSource.close();
      reject(new Error('测试超时'));
    }, 10000);

    // 建立SSE连接
    eventSource = new EventSource('http://localhost:3001/sse');
    
    eventSource.onopen = () => {
      console.log('  🔗 SSE连接已建立');
    };

    eventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.sessionId && !sessionId) {
          sessionId = data.sessionId;
          console.log(`  🆔 会话ID: ${sessionId}`);
          
          // 初始化MCP连接
          await sendMCPMessage(sessionId, {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: { tools: {}, resources: {} },
              clientInfo: { name: 'test-client', version: '1.0.0' }
            }
          });
          
          // 渲染图表
          const response = await sendMCPMessage(sessionId, {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
              name: 'render_chart',
              arguments: { chartConfig }
            }
          });
          
          console.log('  📊 图表渲染响应:', JSON.stringify(response, null, 2));
          
          clearTimeout(timeout);
          eventSource.close();
          resolve(response);
        }
      } catch (error) {
        clearTimeout(timeout);
        eventSource.close();
        reject(error);
      }
    };

    eventSource.onerror = (error) => {
      console.log('  ❌ SSE连接错误:', error);
      clearTimeout(timeout);
      eventSource.close();
      reject(new Error('SSE连接失败'));
    };
  });
}

async function sendMCPMessage(sessionId, message) {
  const response = await fetch(`http://localhost:3001/messages?sessionId=${sessionId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/health');
    if (response.ok) {
      console.log('✅ 服务器运行正常\n');
      return true;
    }
  } catch (error) {
    console.log('❌ 服务器未运行，请先启动: node server.js\n');
    return false;
  }
}

// 主函数
async function main() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    process.exit(1);
  }
  
  await testMCPServer();
  console.log('🎉 测试完成');
}

main().catch(console.error); 
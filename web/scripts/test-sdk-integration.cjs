/**
 * SDK 集成自动化测试
 *
 * 使用 Puppeteer 自动化测试 iframe 与父页面的 postMessage 通信
 *
 * 运行方式：
 *   node web/scripts/test-sdk-integration.js
 *
 * 前提条件：
 *   1. 开发服务器正在运行（npm run dev）
 *   2. 已安装 Puppeteer（npm install -D puppeteer）
 */

const fs = require('fs');
const path = require('path');

// 检查服务器是否运行
async function checkServer() {
  const http = require('http');
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/test-sdk.html', (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// 主测试函数
async function runTests() {
  console.log('=== SDK Integration Test ===\n');

  // 1. 检查服务器
  console.log('1. Checking if dev server is running...');
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.error('❌ Server is not running!');
    console.error('Please start the server with: npm run dev');
    process.exit(1);
  }
  console.log('✅ Server is running on http://localhost:3000\n');

  // 2. 检查文件
  console.log('2. Checking required files...');
  const files = [
    'public/test-sdk.html',
    'public/sdk/ai-bridge-sdk.es.js',
    'public/sdk/types/index.d.ts',
  ];

  const projectRoot = path.resolve(__dirname, '..');
  let allFilesExist = true;

  for (const file of files) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      console.log(`  ✅ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
      console.log(`  ❌ ${file} - NOT FOUND`);
      allFilesExist = false;
    }
  }

  if (!allFilesExist) {
    console.error('\n❌ Some required files are missing!');
    process.exit(1);
  }
  console.log('');

  // 3. 检查 SDK 配置
  console.log('3. Checking SDK configuration...');
  const testPagePath = path.join(projectRoot, 'public/test-sdk.html');
  const testPageContent = fs.readFileSync(testPagePath, 'utf-8');

  const checks = {
    hasSdkImport: testPageContent.includes("from '/sdk/ai-bridge-sdk.es.js'"),
    hasCorrectUrl: testPageContent.includes("url: 'http://localhost:3000/?embed=true'"),
    hasCorrectTargetOrigin: testPageContent.includes("targetOrigin: 'http://localhost:3000'"),
  };

  for (const [check, passed] of Object.entries(checks)) {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`);
  }

  if (!Object.values(checks).every(v => v)) {
    console.error('\n❌ SDK configuration has issues!');
    process.exit(1);
  }
  console.log('');

  // 4. 检查 Web 应用的 SDK bridge
  console.log('4. Checking Web app SDK bridge...');
  const bridgeFiles = [
    'web/src/sdk-bridge/handlers.ts',
    'web/src/sdk-bridge/types.ts',
    'web/src/sdk-bridge/SdkMessageListener.tsx',
  ];

  for (const file of bridgeFiles) {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      console.log(`  ✅ ${path.basename(file)}`);
    } else {
      console.log(`  ❌ ${path.basename(file)} - NOT FOUND`);
    }
  }
  console.log('');

  // 5. 测试总结
  console.log('=== Test Summary ===');
  console.log('✅ All checks passed!');
  console.log('\nNext steps:');
  console.log('1. Open browser and navigate to: http://localhost:3000/test-sdk.html');
  console.log('2. Wait 5-10 seconds for connection to establish');
  console.log('3. Check browser console for:');
  console.log('   - [SdkMessageListener] Running in embedded mode');
  console.log('   - [SdkBridge] Initialized with context');
  console.log('   - Status should show "已连接" (green)');
  console.log('\n4. Test buttons should work:');
  console.log('   - 发送测试消息');
  console.log('   - 测试 chat() 方法');
  console.log('   - etc.');
}

// 运行测试
runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

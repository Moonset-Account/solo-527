'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { I18nDiffChecker } = require('../src/index');

function generateLocaleFile(numKeys, withPlaceholders = false, nested = true) {
  const data = {};
  for (let i = 0; i < numKeys; i++) {
    const key = nested ? `level1.level2.key${i}` : `key${i}`;
    let value = `这是第 ${i} 条翻译文案`;
    if (withPlaceholders && i % 3 === 0) {
      value = `用户 {username}，您有 {count} 条消息`;
    }
    const parts = key.split('.');
    let target = data;
    for (let j = 0; j < parts.length - 1; j++) {
      if (!target[parts[j]]) {
        target[parts[j]] = {};
      }
      target = target[parts[j]];
    }
    target[parts[parts.length - 1]] = value;
  }
  return data;
}

function generateMissingKeys(baseData, missingPercent) {
  const keys = Object.keys(require('../lib/key-checker').flattenObject(baseData));
  const numToRemove = Math.floor(keys.length * missingPercent);
  const keysToRemove = keys.slice(0, numToRemove);
  const localeData = JSON.parse(JSON.stringify(baseData));
  const { getValueByKey } = require('../lib/key-checker');
  for (const key of keysToRemove) {
    const parts = key.split('.');
    let target = localeData;
    for (let i = 0; i < parts.length - 1; i++) {
      target = target[parts[i]];
    }
    delete target[parts[parts.length - 1]];
  }
  return localeData;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatMs(ms) {
  if (ms < 1) return (ms * 1000).toFixed(2) + ' μs';
  if (ms < 1000) return ms.toFixed(2) + ' ms';
  return (ms / 1000).toFixed(2) + ' s';
}

async function runBenchmark(name, baseData, localeData, options = {}, iterations = 5) {
  const checker = new I18nDiffChecker(options);
  const times = [];
  const memoryUsages = [];

  console.log(`\n▶ 基准测试: ${name}`);
  console.log('─'.repeat(60));

  for (let i = 0; i < iterations; i++) {
    global.gc && global.gc();
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = process.hrtime();

    const result = await checker.check(
      { data: baseData, path: 'memory', source: 'memory' },
      { data: localeData, path: 'memory', source: 'memory' },
      options
    );

    const elapsed = process.hrtime(startTime);
    const elapsedMs = elapsed[0] * 1000 + elapsed[1] / 1e6;
    const endMemory = process.memoryUsage().heapUsed;
    const memoryUsed = Math.max(0, endMemory - startMemory);

    times.push(elapsedMs);
    memoryUsages.push(memoryUsed);

    process.stdout.write(`  迭代 ${i + 1}/${iterations}: ${formatMs(elapsedMs)}, ${formatBytes(memoryUsed)}\r`);
  }
  console.log();

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const avgMemory = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
  const baseSize = Buffer.byteLength(JSON.stringify(baseData), 'utf8');
  const localeSize = Buffer.byteLength(JSON.stringify(localeData), 'utf8');

  console.log(`  平均耗时: ${formatMs(avgTime)}`);
  console.log(`  最小耗时: ${formatMs(minTime)}`);
  console.log(`  最大耗时: ${formatMs(maxTime)}`);
  console.log(`  平均内存: ${formatBytes(avgMemory)}`);
  console.log(`  基准文件大小: ${formatBytes(baseSize)}`);
  console.log(`  目标文件大小: ${formatBytes(localeSize)}`);

  return {
    name,
    avgTime,
    minTime,
    maxTime,
    avgMemory,
    baseSize,
    localeSize
  };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           i18n-diff-checker 性能基准测试                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`\n系统信息:`);
  console.log(`  操作系统: ${os.platform()} ${os.release()} (${os.arch()})`);
  console.log(`  CPU: ${os.cpus()[0].model}`);
  console.log(`  内存: ${formatBytes(os.totalmem())}`);
  console.log(`  Node.js: ${process.version}`);
  console.log(`  运行时: ${new Date().toISOString()}`);

  const results = [];

  const base100 = generateLocaleFile(100, true);
  const locale100 = generateMissingKeys(base100, 0.1);
  results.push(await runBenchmark('100 键 (10% 缺失)', base100, locale100, {}, 10));

  const base1000 = generateLocaleFile(1000, true);
  const locale1000 = generateMissingKeys(base1000, 0.1);
  results.push(await runBenchmark('1000 键 (10% 缺失)', base1000, locale1000, {}, 5));

  const base10000 = generateLocaleFile(10000, true);
  const locale10000 = generateMissingKeys(base10000, 0.1);
  results.push(await runBenchmark('10000 键 (10% 缺失)', base10000, locale10000, {}, 3));

  const base100000 = generateLocaleFile(100000, true);
  const locale100000 = generateMissingKeys(base100000, 0.05);
  results.push(await runBenchmark('100000 键 (5% 缺失)', base100000, locale100000, {}, 2));

  const baseWithAll = generateLocaleFile(1000, true);
  const localeWithAll = JSON.parse(JSON.stringify(baseWithAll));
  localeWithAll['level1']['level2']['key5'] = '错误的占位符 {wrong}';
  localeWithAll['level1']['level2']['key10'] = '';
  results.push(await runBenchmark(
    '1000 键 (含占位符错误、空值)',
    baseWithAll,
    localeWithAll,
    { maxLength: 100, requireReview: false },
    5
  ));

  console.log('\n' + '═'.repeat(60));
  console.log('📊 基准测试汇总');
  console.log('─'.repeat(60));
  console.log(
    '测试名称'.padEnd(35) +
    '平均耗时'.padStart(12) +
    '平均内存'.padStart(12)
  );
  console.log('─'.repeat(60));
  for (const r of results) {
    console.log(
      r.name.padEnd(35) +
      formatMs(r.avgTime).padStart(12) +
      formatBytes(r.avgMemory).padStart(12)
    );
  }
  console.log('═'.repeat(60));
  console.log('\n✓ 基准测试完成');

  const reportPath = path.join(__dirname, 'benchmark-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    systemInfo: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      cpu: os.cpus()[0].model,
      totalMemory: os.totalmem(),
      nodeVersion: process.version
    },
    timestamp: new Date().toISOString(),
    results
  }, null, 2));
  console.log(`\n报告已保存: ${reportPath}`);
}

main().catch(console.error);

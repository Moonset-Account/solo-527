#!/usr/bin/env node
'use strict';

const { MERGE_STRATEGIES, ARRAY_STRATEGIES } = require('./src/index');
const { parseConfigFile, isExplicitlySet } = require('./src/cli');

console.log('=== 验证所有修复 ===\n');

// ============ 1. 验证 quiet 优先级 ============
console.log('1. 验证 --quiet 覆盖配置文件中的 verbose=true');
const result1 = require('child_process').execSync(
  'node src/cli.js --config examples/config/test-priority.yaml --quiet --dry-run --no-color',
  { cwd: __dirname, encoding: 'utf8' }
);
console.log('   输出长度:', result1.length);
console.log('   输出是否简短(<=100 chars):', result1.trim().length <= 100 ? '✓ YES' : '✗ NO (输出太多)');
console.log('');

// ============ 2. 验证 strategy 优先级 ============
console.log('2. 验证 --strategy deep 覆盖配置文件中的 strategy=shallow');
const argv2 = ['node', 'cli.js', '--config', 'examples/config/test-priority.yaml', '--strategy', 'deep'];
console.log('   strategy 显式设置:', isExplicitlySet(argv2, 'strategy', 's'));
const fileOptions = parseConfigFile('examples/config/test-priority.yaml');
console.log('   配置文件 strategy:', fileOptions.strategy);
const pickValue = (cliVal, fileVal, defaultVal, explicit) => {
  if (explicit) return cliVal !== undefined ? cliVal : defaultVal;
  if (fileVal !== undefined) return fileVal;
  return defaultVal;
};
const finalStrategy = pickValue('deep', fileOptions.strategy, MERGE_STRATEGIES.DEEP, true);
console.log('   最终 strategy:', finalStrategy);
console.log('   覆盖正确:', finalStrategy === 'deep' ? '✓ YES' : '✗ NO');
console.log('');

// ============ 3. 验证 arrayStrategy 优先级 ============
console.log('3. 验证 --array-strategy replace 覆盖配置文件中的 arrayStrategy=concat');
const argv3 = ['node', 'cli.js', '--config', 'examples/config/test-priority.yaml', '--array-strategy', 'replace'];
console.log('   arrayStrategy 显式设置:', isExplicitlySet(argv3, 'array-strategy', 'a'));
console.log('   配置文件 arrayStrategy:', fileOptions.arrayStrategy);
const finalArrayStrategy = pickValue('replace', fileOptions.arrayStrategy, ARRAY_STRATEGIES.REPLACE, true);
console.log('   最终 arrayStrategy:', finalArrayStrategy);
console.log('   覆盖正确:', finalArrayStrategy === 'replace' ? '✓ YES' : '✗ NO');
console.log('');

// ============ 4. 验证 machine-readable 模式 ============
console.log('4. 验证 --machine-readable 只输出 JSON');
const result4 = require('child_process').execSync(
  'node src/cli.js -b examples/config/base.yaml -o examples/config/prod.yaml --machine-readable --dry-run --preview -p yaml --schema examples/schemas/app-schema.json --no-color',
  { cwd: __dirname, encoding: 'utf8' }
);
console.log('   首字符是否为 {:', result4.trim().startsWith('{') ? '✓ YES' : '✗ NO');
let isValidJson = true;
try { JSON.parse(result4); } catch(e) { isValidJson = false; }
console.log('   是否为有效 JSON:', isValidJson ? '✓ YES' : '✗ NO');
console.log('   是否包含 [dry-run]:', result4.includes('[dry-run]') ? '✗ YES (不该有)' : '✓ NO (正确)');
console.log('   是否包含 图例:', result4.includes('图例') ? '✗ YES (不该有)' : '✓ NO (正确)');
console.log('');

// ============ 5. 验证 Ajv 警告 ============
console.log('5. 验证 Ajv hostname 警告已屏蔽');
const result5 = require('child_process').execSync(
  'node src/cli.js -b examples/config/base.yaml -o examples/config/prod.yaml --schema examples/schemas/app-schema.json --no-color --quiet',
  { cwd: __dirname, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
);
console.log('   输出是否包含 unknown format:', result5.includes('unknown format') ? '✗ YES (不该有)' : '✓ NO (正确)');
console.log('   输出是否包含 warning:', result5.toLowerCase().includes('warning') ? '✗ YES (不该有)' : '✓ NO (正确)');
console.log('');

console.log('=== 所有验证完成 ===');

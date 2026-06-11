#!/usr/bin/env node
'use strict';

const { isExplicitlySet } = require('./src/cli');

console.log('=== 测试 isExplicitlySet 函数 ===');

const testCases = [
  { argv: ['node', 'test', '--strategy', 'deep'], longName: 'strategy', shortName: 's', expected: true },
  { argv: ['node', 'test', '-s', 'deep'], longName: 'strategy', shortName: 's', expected: true },
  { argv: ['node', 'test', '--strategy=deep'], longName: 'strategy', shortName: 's', expected: true },
  { argv: ['node', 'test', '--quiet'], longName: 'quiet', shortName: 'q', expected: true },
  { argv: ['node', 'test', '-q'], longName: 'quiet', shortName: 'q', expected: true },
  { argv: ['node', 'test', '--no-conflicts'], longName: 'conflicts', shortName: null, expected: true },
  { argv: ['node', 'test', '--detect-conflicts'], longName: 'conflicts', shortName: null, expected: true },
  { argv: ['node', 'test', '--base', 'file.yaml'], longName: 'base', shortName: 'b', expected: true },
  { argv: ['node', 'test', '--array-strategy', 'replace'], longName: 'array-strategy', shortName: 'a', expected: true },
  { argv: ['node', 'test', '-a=replace'], longName: 'array-strategy', shortName: 'a', expected: true },
  { argv: ['node', 'test', '--other'], longName: 'strategy', shortName: 's', expected: false },
  { argv: ['node', 'test'], longName: 'strategy', shortName: 's', expected: false },
];

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = isExplicitlySet(tc.argv, tc.longName, tc.shortName);
  const status = result === tc.expected ? '✓' : '✗';
  if (result === tc.expected) {
    passed++;
  } else {
    failed++;
  }
  console.log(`${status} argv=[${tc.argv.slice(2).join(' ')}] --${tc.longName}=${result} (expected ${tc.expected})`);
}

console.log('');
console.log(`通过: ${passed}, 失败: ${failed}`);

if (failed > 0) process.exit(1);

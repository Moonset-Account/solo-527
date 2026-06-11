'use strict';

const { isStatusKey, getContentKeyForStatusKey, collectContentKeys } = require('./lib/constants');
const { getAllKeys } = require('./lib/key-checker');

console.log('=== 新 isStatusKey 验证（有 contentKeys 上下文）===');

const baseData = {
  common: {
    greeting: 'Hello',
    welcome: 'Welcome'
  },
  order: {
    label: 'Order'
  }
};
const localeData = {
  common: {
    greeting: '你好',
    greeting_status: 'approved',
    'greeting.status': 'approved',
    welcome: '欢迎',
    welcome_review: 'draft',
  },
  order: {
    label: '订单',
    label_status: 'approved',
    status_label: '状态标签',
    order_status_label: '订单状态标签'
  },
  review_title: '审核标题'
};

const { contentKeys } = collectContentKeys(baseData, localeData, getAllKeys);
console.log('已识别的内容键:', [...contentKeys]);
console.log('');

const testCases = [
  { key: 'common.greeting_status', expected: true, desc: 'greeting 存在 → greeting_status 是状态键' },
  { key: 'common.greeting.status', expected: true, desc: 'greeting 存在 → greeting.status 是状态键' },
  { key: 'common.welcome_review', expected: true, desc: 'welcome 存在 → welcome_review 是状态键' },
  { key: 'order.label_status', expected: true, desc: 'order.label 存在 → order.label_status 是状态键' },
  { key: 'order.status_label', expected: false, desc: 'status_label 去掉后缀是 status，不存在 → 普通键' },
  { key: 'order.order_status_label', expected: false, desc: 'order_status_label 去掉后缀是 order_status，不存在 → 普通键' },
  { key: 'review_title', expected: false, desc: 'review_title 去掉后缀是 review，不存在 → 普通键' },
  { key: 'common.extra_regular', expected: false, desc: 'extra_regular 不是状态后缀结尾 → 普通键' }
];

let passed = 0, failed = 0;
for (const tc of testCases) {
  const actual = isStatusKey(tc.key, contentKeys);
  if (actual === tc.expected) {
    console.log('✓', tc.desc, `(${tc.key})`);
    passed++;
  } else {
    console.log('✗', tc.desc, `(${tc.key}, 期望: ${tc.expected}, 实际: ${actual})`);
    failed++;
  }
}

console.log('\n=== getContentKeyForStatusKey ===');
console.log('common.greeting_status →', getContentKeyForStatusKey('common.greeting_status'));
console.log('common.greeting.status →', getContentKeyForStatusKey('common.greeting.status'));
console.log('common.welcome_review →', getContentKeyForStatusKey('common.welcome_review'));

console.log('\n=== 结果: 通过', passed + '/' + (passed + failed), '===');
process.exit(failed > 0 ? 1 : 0);

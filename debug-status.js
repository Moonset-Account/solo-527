'use strict';

const { checkKeyAlignment } = require('./lib/key-checker');
const { checkReviewStatus } = require('./lib/value-checker');
const { DEFAULT_CONFIG } = require('./lib/constants');

console.log('=== 验证 1: order_status_label / review_title 是否被误判为状态键 ===');
const base1 = { greeting: 'Hello' };
const locale1 = {
  greeting: '你好',
  greeting_status: 'approved',
  order_status_label: '订单状态标签',
  review_title: '评论标题',
  status_page: '状态页面'
};
const result1 = checkKeyAlignment(base1, locale1, { strictMode: true });
console.log('extra_key 数量:', result1.errors.filter(e => e.type === 'extra_key').length);
console.log('extra_key 列表:', result1.errors.filter(e => e.type === 'extra_key').map(e => e.key));
console.log('期望: order_status_label, review_title, status_page 都是 extra_key');
console.log('实际是否正确:',
  result1.errors.filter(e => e.type === 'extra_key').length === 3 &&
  result1.errors.some(e => e.key === 'order_status_label') &&
  result1.errors.some(e => e.key === 'review_title') &&
  result1.errors.some(e => e.key === 'status_page')
    ? '✅ 正确' : '❌ 错误'
);

console.log('\n=== 验证 2: 点号状态键 (greeting.status) 识别 ===');
const base2 = { greeting: 'Hello', welcome: 'Welcome' };
const locale2 = {
  greeting: '你好',
  'greeting.status': 'approved',
  welcome: '欢迎',
  'welcome.review': 'draft'
};
const result2 = checkKeyAlignment(base2, locale2, { strictMode: true });
console.log('extra_key 数量:', result2.errors.filter(e => e.type === 'extra_key').length);
console.log('extra_key 列表:', result2.errors.filter(e => e.type === 'extra_key').map(e => e.key));
console.log('期望: 0 个 extra_key (greeting.status 和 welcome.review 都是状态元数据)');
console.log('实际是否正确:', result2.errors.filter(e => e.type === 'extra_key').length === 0 ? '✅ 正确' : '❌ 错误');
console.log('statusKeys 统计:', result2.stats.statusKeys);

console.log('\n=== 验证 3: require-review 读取点号状态键 ===');
const config = { reviewStatus: { enabled: true, requiredStatus: ['approved'] } };
const result3 = checkReviewStatus(locale2, config, {});
console.log('审核状态错误数量:', result3.errors.length);
if (result3.errors.length > 0) {
  console.log('错误详情:');
  result3.errors.forEach(e => {
    console.log('  key:', e.key, 'status:', e.details.actualStatus);
  });
}
console.log('期望: 1 个错误 (welcome 状态为 draft)，key 是 welcome，不是 welcome.review');
console.log('实际是否正确:',
  result3.errors.length === 1 && result3.errors[0].key === 'welcome'
    ? '✅ 正确' : '❌ 错误'
);

console.log('\n=== 验证 4: 没有对应内容键的状态后缀键仍是 extra_key ===');
const base4 = { greeting: 'Hello' };
const locale4 = {
  greeting: '你好',
  nonexistent_status: 'approved',
  'missing.status': 'draft'
};
const result4 = checkKeyAlignment(base4, locale4, { strictMode: true });
console.log('extra_key 数量:', result4.errors.filter(e => e.type === 'extra_key').length);
console.log('extra_key 列表:', result4.errors.filter(e => e.type === 'extra_key').map(e => e.key));
console.log('期望: nonexistent_status 和 missing.status 都是 extra_key');
console.log('实际是否正确:',
  result4.errors.filter(e => e.type === 'extra_key').length === 2 &&
  result4.errors.some(e => e.key === 'nonexistent_status') &&
  result4.errors.some(e => e.key === 'missing.status')
    ? '✅ 正确' : '❌ 错误'
);

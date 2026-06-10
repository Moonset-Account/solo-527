import { describe, it, expect } from 'vitest';
import { runAllChecks } from '../src/core/checker';
import type { FlatLocaleFile, Locale } from '../src/types';

describe('综合检查引擎 runAllChecks', () => {
  const baseData: FlatLocaleFile = {
    'greeting': { value: 'Hello {name}!' },
    'farewell': { value: 'Goodbye, see you tomorrow.' },
    'item.count': {
      value: '{count, plural, one {1 item} other {# items}}',
    },
    'profile.name': { value: 'Display Name', status: 'approved' },
    'profile.email': { value: 'Email Address', status: 'approved' },
    'a.b.c': { value: 'Nested value' },
  };

  const zhData: FlatLocaleFile = {
    'greeting': { value: '你好 {username}！' },
    'farewell': { value: '再见，明天见。' },
    'item.count': { value: '共 {count} 项。' },
    'profile.name': { value: '展示名称', status: 'approved' },
    'profile.email': { value: '邮箱地址', status: 'pending' },
    'legacy.feature': { value: '遗留功能键（多余）' },
    'a.b.c': { value: '嵌套值' },
  };

  const opts = {
    includeMissing: true,
    includeExtra: true,
    includePlaceholder: true,
    includeLength: true,
    includeStatus: true,
    includeValueDiff: true,
    placeholderPattern: /\{(\w+)\}/g,
    maxLengthRatio: 2.0,
    minLengthRatio: 0.3,
    minLengthThreshold: 5,
    requireApproved: true,
    warnOnDraft: true,
  };

  const report = runAllChecks({
    baseLocale: 'en' as Locale,
    targetLocales: ['zh-CN' as Locale],
    loadedData: { en: baseData, 'zh-CN': zhData },
    options: opts,
  });

  it('摘要统计数字正确', () => {
    expect(report.summary.totalBaseKeys).toBe(6);
    expect(report.summary.totalTargetKeys['zh-CN']).toBe(7);
    expect(report.summary.missingCount['zh-CN']).toBe(0);
    expect(report.summary.extraCount['zh-CN']).toBe(1);
  });

  it('正确识别占位符不匹配：{name} vs {username}', () => {
    const greetingMismatch = report.placeholderMismatches.find(
      (p) => p.key === 'greeting' && p.locale === 'zh-CN'
    );
    expect(greetingMismatch).toBeDefined();
    expect(greetingMismatch!.basePlaceholders).toEqual(['name']);
    expect(greetingMismatch!.targetPlaceholders).toEqual(['username']);
  });

  it('ICU plural 正确提取 count，且与目标 count 一致', () => {
    const itemCountMatch = report.placeholderMismatches.find(
      (p) => p.key === 'item.count'
    );
    expect(itemCountMatch).toBeUndefined();
  });

  it('正确识别多余的键 legacy.feature', () => {
    const extra = report.extraKeys.find(
      (e) => e.key === 'legacy.feature' && e.locale === 'zh-CN'
    );
    expect(extra).toBeDefined();
  });

  it('状态检查：pending 状态识别为未审核通过', () => {
    const statusIssue = report.statusIssues.find(
      (s) => s.key === 'profile.email' && s.locale === 'zh-CN'
    );
    expect(statusIssue).toBeDefined();
    expect(statusIssue!.isUnapproved).toBe(true);
    expect(statusIssue!.status).toBe('pending');
  });

  it('值差异检测：所有不同值的键都被识别（共5个有差异）', () => {
    const diffKeys = report.valueDiffs.map((d) => d.key);
    expect(diffKeys).toContain('greeting');
    expect(diffKeys).toContain('farewell');
    expect(diffKeys).toContain('profile.email');
    expect(diffKeys).toContain('a.b.c');
    expect(diffKeys).toContain('item.count');
    expect(diffKeys).toContain('profile.name');
    expect(diffKeys).toHaveLength(6);
  });

  it('生成的 JSON 报告可被 JSON.parse 序列化和反序列化', () => {
    const serialized = JSON.stringify(report);
    const parsed = JSON.parse(serialized);
    expect(parsed.baseLocale).toBe('en');
    expect(parsed.targetLocales).toEqual(['zh-CN']);
    expect(Array.isArray(parsed.missingKeys)).toBe(true);
    expect(Array.isArray(parsed.placeholderMismatches)).toBe(true);
    expect(typeof parsed.summary.totalBaseKeys).toBe('number');
  });

  it('完成率计算正确：6/6 = 100%', () => {
    expect(report.summary.completionRate['zh-CN']).toBe(100);
  });

  it('元数据字段齐全', () => {
    expect(report.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(new Date(report.generatedAt).getTime()).toBeGreaterThan(0);
  });
});

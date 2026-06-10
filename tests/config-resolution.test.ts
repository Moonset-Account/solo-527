import { describe, it, expect } from 'vitest';
import { resolveOptions } from '../src/config';
import type { CliArgs } from '../src/types';

describe('配置优先级 & CLI 覆盖', () => {
  const baseArgs: CliArgs = {
    base: 'en',
    locale: ['zh-CN'],
    localeDir: './examples/locales',
  };

  it('默认值：保守模式只启用缺失/多余/占位符', () => {
    const opts = resolveOptions(baseArgs);
    expect(opts.includeMissing).toBe(true);
    expect(opts.includeExtra).toBe(true);
    expect(opts.includePlaceholder).toBe(true);
    expect(opts.includeLength).toBe(false);
    expect(opts.includeStatus).toBe(false);
    expect(opts.includeValueDiff).toBe(false);
    expect(opts.failOn).toBe('error');
  });

  it('--all 覆盖为：所有检查项全部启用', () => {
    const opts = resolveOptions({ ...baseArgs, allChecks: true });
    expect(opts.includeMissing).toBe(true);
    expect(opts.includeExtra).toBe(true);
    expect(opts.includePlaceholder).toBe(true);
    expect(opts.includeLength).toBe(true);
    expect(opts.includeStatus).toBe(true);
    expect(opts.includeValueDiff).toBe(true);
  });

  it('CLI 单项禁用会覆盖默认：--no-extra（通过 extra=false）', () => {
    const opts = resolveOptions({ ...baseArgs, extra: false });
    expect(opts.includeExtra).toBe(false);
    expect(opts.includeMissing).toBe(true);
  });

  it('CLI 单项启用覆盖默认：--length', () => {
    const opts = resolveOptions({ ...baseArgs, length: true });
    expect(opts.includeLength).toBe(true);
  });

  it('--locale 覆盖默认目标语言列表', () => {
    const opts = resolveOptions({ ...baseArgs, locale: ['ja', 'ko'] });
    expect(opts.locales).toEqual(['ja', 'ko']);
    expect(opts.locales).not.toContain('en');
  });

  it('--base 和 --locale 相同时自动过滤掉基准', () => {
    const opts = resolveOptions({
      base: 'en',
      locale: ['en', 'ja', 'zh-CN'],
      localeDir: './examples/locales',
    });
    expect(opts.locales).not.toContain('en');
    expect(opts.locales).toContain('ja');
    expect(opts.base).toBe('en');
  });

  it('--fail-on warning 覆盖默认 error', () => {
    const opts = resolveOptions({ ...baseArgs, failOn: 'warning' });
    expect(opts.failOn).toBe('warning');
  });

  it('--concurrency 和 --retries 受上下限约束', () => {
    const opts = resolveOptions({
      ...baseArgs,
      concurrency: 999,
      retries: 99,
    });
    expect(opts.concurrency).toBe(32);
    expect(opts.maxRetries).toBe(10);

    const opts2 = resolveOptions({
      ...baseArgs,
      concurrency: 0,
      retries: -1,
    });
    expect(opts2.concurrency).toBe(1);
    expect(opts2.maxRetries).toBe(0);
  });

  it('空目标语言列表抛出可读错误', () => {
    expect(() =>
      resolveOptions({
        base: 'en',
        locale: ['en'],
        localeDir: './examples/locales',
      })
    ).toThrow(/目标语言列表不能为空/);
  });

  it('JSON 报告格式选择：--json', () => {
    const opts = resolveOptions({ ...baseArgs, json: true });
    expect(opts.reportFormat).toBe('json');
  });

  it('Markdown 报告格式选择：--markdown', () => {
    const opts = resolveOptions({
      ...baseArgs,
      md: true,
    } as CliArgs & { md?: boolean });
    expect(opts.reportFormat).toBe('markdown');
  });

  it('CSV 报告格式选择：--csv', () => {
    const opts = resolveOptions({ ...baseArgs, csv: true });
    expect(opts.reportFormat).toBe('csv');
  });
});

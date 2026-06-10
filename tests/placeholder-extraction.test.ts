import { describe, it, expect } from 'vitest';
import { extractPlaceholders } from '../src/core/checker';

const DEFAULT_PATTERN = /\{(\w+)\}/g;

describe('占位符提取 (ICU MessageFormat 支持)', () => {
  it('提取简单的 {name} 占位符', () => {
    const result = extractPlaceholders('Hello {username}!', DEFAULT_PATTERN);
    expect(result).toEqual(['username']);
  });

  it('提取多个简单占位符', () => {
    const result = extractPlaceholders(
      'Welcome {user}, your order {orderId} is ready.',
      DEFAULT_PATTERN
    );
    expect(result).toEqual(['orderId', 'user']);
  });

  it('正确提取 ICU plural 中的 count 参数', () => {
    const icuText =
      'You have {count, plural, one {1 item} other {# items}} in your cart.';
    const result = extractPlaceholders(icuText, DEFAULT_PATTERN);
    expect(result).toEqual(['count']);
  });

  it('提取 ICU select 中的占位符', () => {
    const icuText =
      '{gender, select, male {He} female {She} other {They}} liked the post.';
    const result = extractPlaceholders(icuText, DEFAULT_PATTERN);
    expect(result).toEqual(['gender']);
  });

  it('提取 ICU selectordinal 中的参数', () => {
    const icuText =
      'It is the {num, selectordinal, one {#st} two {#nd} few {#rd} other {#th}} time.';
    const result = extractPlaceholders(icuText, DEFAULT_PATTERN);
    expect(result).toEqual(['num']);
  });

  it('提取带类型的 ICU 占位符 {name, type}', () => {
    const icuText = 'Price: {price, number, ::currency/USD}';
    const result = extractPlaceholders(icuText, DEFAULT_PATTERN);
    expect(result).toEqual(['price']);
  });

  it('提取 ICU 日期/时间占位符', () => {
    const icuText = 'Arrived on {date, date, long} at {time, time, short}.';
    const result = extractPlaceholders(icuText, DEFAULT_PATTERN);
    expect(result).toEqual(['date', 'time']);
  });

  it('混合简单占位符和复杂 ICU 占位符', () => {
    const icuText =
      '{username} has {count, plural, one {1 message} other {# messages}} from {sender}.';
    const result = extractPlaceholders(icuText, DEFAULT_PATTERN);
    expect(result).toEqual(['count', 'sender', 'username']);
  });

  it('忽略嵌套花括号中的字面量', () => {
    const icuText =
      '{count, plural, one {1 个苹果} other {# 个苹果}} 共计 {totalPrice}.';
    const result = extractPlaceholders(icuText, DEFAULT_PATTERN);
    expect(result).toEqual(['count', 'totalPrice']);
  });

  it('空字符串返回空数组', () => {
    expect(extractPlaceholders('', DEFAULT_PATTERN)).toEqual([]);
  });

  it('没有占位符时返回空数组', () => {
    expect(extractPlaceholders('Hello World', DEFAULT_PATTERN)).toEqual([]);
  });

  it('去重：重复占位符只出现一次', () => {
    expect(
      extractPlaceholders('{a} plus {a} equals {b}', DEFAULT_PATTERN)
    ).toEqual(['a', 'b']);
  });

  it('使用自定义占位符模式（双花括号 [[name]]）', () => {
    const customPattern = /\[\[(\w+)\]\]/g;
    expect(
      extractPlaceholders('Hello [[user]], welcome to [[app]]!', customPattern)
    ).toEqual(['app', 'user']);
  });

  it('使用自定义模式时 ICU 语法仍能识别顶层名', () => {
    const customPattern = /%\((\w+)\)s/g;
    const text =
      '%(user)s has %(count, plural, one {1 item} other {# items})s';
    const result = extractPlaceholders(text, customPattern);
    expect(result).toContain('user');
  });
});

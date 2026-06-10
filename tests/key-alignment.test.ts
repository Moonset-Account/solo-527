import { describe, it, expect } from 'vitest';
import { getBaseAndTargetKeys } from '../src/core/loader';
import type { FlatLocaleFile } from '../src/types';

describe('键对齐与三方集合运算', () => {
  const base: FlatLocaleFile = {
    'a.b': { value: 'ab-en' },
    'a.c': { value: 'ac-en' },
    'b.x': { value: 'bx-en' },
    'common.1': { value: 'c1-en' },
    'common.2': { value: 'c2-en' },
  };

  it('完全一致的键集', () => {
    const target: FlatLocaleFile = { ...base };
    const result = getBaseAndTargetKeys(base, target);
    expect(result.allKeys).toHaveLength(5);
    expect(result.baseOnly).toEqual([]);
    expect(result.targetOnly).toEqual([]);
    expect(result.common).toHaveLength(5);
  });

  it('基准有缺失的键（目标少了 a.c 和 common.2）', () => {
    const target: FlatLocaleFile = {
      'a.b': { value: 'ab-zh' },
      'b.x': { value: 'bx-zh' },
      'common.1': { value: 'c1-zh' },
    };
    const result = getBaseAndTargetKeys(base, target);
    expect(result.baseOnly).toEqual(['a.c', 'common.2']);
    expect(result.targetOnly).toEqual([]);
    expect(result.common).toHaveLength(3);
  });

  it('目标有多余的键（extra.only1, extra.only2）', () => {
    const target: FlatLocaleFile = {
      ...base,
      'extra.only1': { value: 'eo1' },
      'extra.only2': { value: 'eo2' },
    };
    const result = getBaseAndTargetKeys(base, target);
    expect(result.baseOnly).toEqual([]);
    expect(result.targetOnly).toEqual(['extra.only1', 'extra.only2']);
    expect(result.common).toHaveLength(5);
  });

  it('混合情况：同时存在缺失、多余和公共', () => {
    const target: FlatLocaleFile = {
      'a.b': { value: 'ab' },
      'common.1': { value: 'c1' },
      'common.2': { value: 'c2' },
      'z.new': { value: 'zn' },
    };
    const result = getBaseAndTargetKeys(base, target);
    expect(result.baseOnly).toEqual(['a.c', 'b.x']);
    expect(result.targetOnly).toEqual(['z.new']);
    expect(result.common).toEqual(['a.b', 'common.1', 'common.2']);
    expect(result.allKeys).toEqual([
      'a.b', 'a.c', 'b.x', 'common.1', 'common.2', 'z.new',
    ]);
  });

  it('输出结果按字典序排序', () => {
    const b: FlatLocaleFile = {
      'z.z': { value: '' },
      'a.a': { value: '' },
      'm.m': { value: '' },
    };
    const t: FlatLocaleFile = {
      'b.b': { value: '' },
      'a.a': { value: '' },
    };
    const result = getBaseAndTargetKeys(b, t);
    expect(result.allKeys).toEqual(['a.a', 'b.b', 'm.m', 'z.z']);
    expect(result.baseOnly).toEqual(['m.m', 'z.z']);
    expect(result.targetOnly).toEqual(['b.b']);
    expect(result.common).toEqual(['a.a']);
  });

  it('空基准文件时', () => {
    const b: FlatLocaleFile = {};
    const t: FlatLocaleFile = { a: { value: '1' }, b: { value: '2' } };
    const result = getBaseAndTargetKeys(b, t);
    expect(result.baseOnly).toEqual([]);
    expect(result.targetOnly).toEqual(['a', 'b']);
    expect(result.common).toEqual([]);
  });

  it('空目标文件时', () => {
    const b: FlatLocaleFile = { a: { value: '1' }, b: { value: '2' } };
    const t: FlatLocaleFile = {};
    const result = getBaseAndTargetKeys(b, t);
    expect(result.baseOnly).toEqual(['a', 'b']);
    expect(result.targetOnly).toEqual([]);
    expect(result.common).toEqual([]);
  });
});

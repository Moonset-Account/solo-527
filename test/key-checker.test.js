'use strict';

const {
  flattenObject,
  getAllKeys,
  getValueByKey,
  checkKeyAlignment,
  getMissingKeys
} = require('../lib/key-checker');
const { ERROR_TYPES, SEVERITY } = require('../lib/constants');

describe('key-checker', () => {
  describe('flattenObject', () => {
    test('should flatten nested object', () => {
      const obj = {
        a: {
          b: {
            c: 'value'
          },
          d: 'another'
        },
        e: 'flat'
      };
      const result = flattenObject(obj);
      expect(result).toEqual({
        'a.b.c': 'value',
        'a.d': 'another',
        'e': 'flat'
      });
    });

    test('should handle arrays as values', () => {
      const obj = {
        items: ['a', 'b', 'c'],
        nested: {
          arr: [1, 2, 3]
        }
      };
      const result = flattenObject(obj);
      expect(result).toEqual({
        'items': ['a', 'b', 'c'],
        'nested.arr': [1, 2, 3]
      });
    });

    test('should handle empty object', () => {
      expect(flattenObject({})).toEqual({});
    });
  });

  describe('getAllKeys', () => {
    test('should return all flattened keys', () => {
      const obj = {
        common: {
          greeting: 'Hello',
          welcome: 'Welcome'
        },
        user: {
          name: 'Name'
        }
      };
      const keys = getAllKeys(obj);
      expect(keys).toEqual(expect.arrayContaining([
        'common.greeting',
        'common.welcome',
        'user.name'
      ]));
      expect(keys.length).toBe(3);
    });
  });

  describe('getValueByKey', () => {
    test('should get value by dotted key', () => {
      const obj = {
        common: {
          greeting: 'Hello, {name}!'
        }
      };
      expect(getValueByKey(obj, 'common.greeting')).toBe('Hello, {name}!');
    });

    test('should return undefined for missing key', () => {
      const obj = { a: { b: 'value' } };
      expect(getValueByKey(obj, 'a.c')).toBeUndefined();
      expect(getValueByKey(obj, 'x.y')).toBeUndefined();
    });

    test('should prefer literal dotted key over nested path at root level', () => {
      const obj = { 'a.b': 'literal', a: { b: 'nested' } };
      expect(getValueByKey(obj, 'a.b')).toBe('literal');
    });

    test('should prefer literal dotted key over nested path at intermediate level', () => {
      const obj = { parent: { 'x.y': 'literal-in-nested', x: { y: 'nested-path' } } };
      expect(getValueByKey(obj, 'parent.x.y')).toBe('literal-in-nested');
    });

    test('should fall back to nested path when no literal key exists', () => {
      const obj = { parent: { x: { y: 'deep' } } };
      expect(getValueByKey(obj, 'parent.x.y')).toBe('deep');
    });

    test('should handle simple keys without dots', () => {
      const obj = { simple: 'value' };
      expect(getValueByKey(obj, 'simple')).toBe('value');
    });

    test('should handle null/undefined input safely', () => {
      expect(getValueByKey(null, 'a.b')).toBeUndefined();
      expect(getValueByKey(undefined, 'a.b')).toBeUndefined();
      expect(getValueByKey({}, 'a')).toBeUndefined();
    });
  });

  describe('checkKeyAlignment', () => {
    const baseData = {
      common: {
        greeting: 'Hello',
        welcome: 'Welcome',
        loading: 'Loading'
      },
      user: {
        name: 'Name'
      }
    };

    test('should detect missing keys', () => {
      const localeData = {
        common: {
          greeting: '你好'
        }
      };
      const result = checkKeyAlignment(baseData, localeData);
      const missingErrors = result.errors.filter(e => e.type === ERROR_TYPES.MISSING_KEY);
      expect(missingErrors.length).toBe(3);
      expect(missingErrors.map(e => e.key)).toEqual(expect.arrayContaining([
        'common.welcome',
        'common.loading',
        'user.name'
      ]));
    });

    test('should detect extra keys as warnings by default', () => {
      const localeData = {
        common: {
          greeting: '你好',
          welcome: '欢迎',
          loading: '加载中',
          extra: '额外'
        },
        user: {
          name: '姓名'
        }
      };
      const result = checkKeyAlignment(baseData, localeData);
      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0].type).toBe(ERROR_TYPES.EXTRA_KEY);
      expect(result.warnings[0].key).toBe('common.extra');
    });

    test('should treat extra keys as errors in strict mode', () => {
      const localeData = {
        common: {
          greeting: '你好',
          welcome: '欢迎',
          loading: '加载中',
          extra: '额外'
        },
        user: {
          name: '姓名'
        }
      };
      const result = checkKeyAlignment(baseData, localeData, { strictMode: true });
      const extraErrors = result.errors.filter(e => e.type === ERROR_TYPES.EXTRA_KEY);
      expect(extraErrors.length).toBe(1);
      expect(extraErrors[0].severity).toBe(SEVERITY.ERROR);
    });

    test('should detect empty values', () => {
      const localeData = {
        common: {
          greeting: '',
          welcome: '欢迎',
          loading: '加载中'
        },
        user: {
          name: '姓名'
        }
      };
      const result = checkKeyAlignment(baseData, localeData);
      const emptyErrors = result.errors.filter(e => e.type === ERROR_TYPES.EMPTY_VALUE);
      expect(emptyErrors.length).toBe(1);
      expect(emptyErrors[0].key).toBe('common.greeting');
    });

    test('should return correct stats', () => {
      const localeData = {
        common: {
          greeting: '你好',
          welcome: '欢迎'
        }
      };
      const result = checkKeyAlignment(baseData, localeData);
      expect(result.stats.totalBaseKeys).toBe(4);
      expect(result.stats.totalLocaleKeys).toBe(2);
      expect(result.stats.missingKeys).toBe(2);
      expect(result.stats.alignedKeys).toBe(2);
    });
  });

  describe('getMissingKeys', () => {
    test('should return nested object of missing keys', () => {
      const baseData = {
        common: {
          greeting: 'Hello',
          welcome: 'Welcome',
          loading: 'Loading'
        },
        user: {
          name: 'Name',
          email: 'Email'
        }
      };
      const localeData = {
        common: {
          greeting: '你好'
        }
      };
      const missing = getMissingKeys(baseData, localeData);
      expect(missing).toEqual({
        common: {
          welcome: 'Welcome',
          loading: 'Loading'
        },
        user: {
          name: 'Name',
          email: 'Email'
        }
      });
    });

    test('should return empty object when no missing keys', () => {
      const baseData = { a: '1', b: '2' };
      const localeData = { a: '一', b: '二' };
      expect(getMissingKeys(baseData, localeData)).toEqual({});
    });
  });

  describe('status key filtering', () => {
    test('should not treat _status suffix keys as extra_key in strict mode', () => {
      const baseData = {
        common: {
          greeting: 'Hello'
        }
      };
      const localeData = {
        common: {
          greeting: '你好',
          greeting_status: 'approved',
          greeting_review: 'translated'
        }
      };
      const result = checkKeyAlignment(baseData, localeData, { strictMode: true });
      const extraErrors = result.errors.filter(e => e.type === ERROR_TYPES.EXTRA_KEY);
      expect(extraErrors.length).toBe(0);
      expect(result.warnings.length).toBe(0);
    });

    test('should not treat .status suffix keys as extra_key in strict mode', () => {
      const baseData = {
        common: {
          greeting: 'Hello'
        }
      };
      const localeData = {
        common: {
          greeting: '你好'
        },
        'common.greeting.status': 'approved',
        'common.greeting.review': 'translated'
      };
      const result = checkKeyAlignment(baseData, localeData, { strictMode: true });
      const extraErrors = result.errors.filter(e => e.type === ERROR_TYPES.EXTRA_KEY);
      expect(extraErrors.length).toBe(0);
    });

    test('should still detect real extra keys alongside status keys', () => {
      const baseData = {
        common: {
          greeting: 'Hello'
        }
      };
      const localeData = {
        common: {
          greeting: '你好',
          greeting_status: 'approved',
          extra_regular_key: '真的多余键'
        }
      };
      const result = checkKeyAlignment(baseData, localeData, { strictMode: true });
      const extraErrors = result.errors.filter(e => e.type === ERROR_TYPES.EXTRA_KEY);
      expect(extraErrors.length).toBe(1);
      expect(extraErrors[0].key).toBe('common.extra_regular_key');
    });

    test('should include status key count in stats', () => {
      const baseData = { greeting: 'Hello' };
      const localeData = { 
        greeting: '你好',
        greeting_status: 'approved',
        other_key: 'other',
        other_key_status: 'draft'
      };
      const result = checkKeyAlignment(baseData, localeData, { strictMode: false });
      expect(result.stats.statusKeys).toBe(2);
      expect(result.stats.totalLocaleContentKeys).toBe(2);
      expect(result.stats.totalLocaleKeys).toBe(4);
    });

    test('should treat order_status_label and review_title as regular extra keys', () => {
      const baseData = { greeting: 'Hello' };
      const localeData = {
        greeting: '你好',
        greeting_status: 'approved',
        order_status_label: '订单状态标签',
        review_title: '评论标题',
        status_page: '状态页面'
      };
      const result = checkKeyAlignment(baseData, localeData, { strictMode: true });
      const extraErrors = result.errors.filter(e => e.type === ERROR_TYPES.EXTRA_KEY);
      expect(extraErrors.length).toBe(3);
      const extraKeys = extraErrors.map(e => e.key);
      expect(extraKeys).toContain('order_status_label');
      expect(extraKeys).toContain('review_title');
      expect(extraKeys).toContain('status_page');
      expect(extraKeys).not.toContain('greeting_status');
    });

    test('should treat non-matching status suffix keys as extra keys', () => {
      const baseData = { greeting: 'Hello' };
      const localeData = {
        greeting: '你好',
        nonexistent_status: 'approved',
        'missing.status': 'draft'
      };
      const result = checkKeyAlignment(baseData, localeData, { strictMode: true });
      const extraErrors = result.errors.filter(e => e.type === ERROR_TYPES.EXTRA_KEY);
      expect(extraErrors.length).toBe(2);
      const extraKeys = extraErrors.map(e => e.key);
      expect(extraKeys).toContain('nonexistent_status');
      expect(extraKeys).toContain('missing.status');
    });
  });
});

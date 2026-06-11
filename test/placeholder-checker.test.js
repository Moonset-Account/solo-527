'use strict';

const {
  extractPlaceholders,
  comparePlaceholders,
  checkPlaceholders
} = require('../lib/placeholder-checker');
const { ERROR_TYPES } = require('../lib/constants');
const { DEFAULT_CONFIG } = require('../lib/constants');

describe('placeholder-checker', () => {
  describe('extractPlaceholders', () => {
    const pattern = DEFAULT_CONFIG.placeholderPattern;

    test('should extract single placeholder', () => {
      const result = extractPlaceholders('Hello, {name}!', pattern);
      expect(result).toEqual(['name']);
    });

    test('should extract multiple placeholders', () => {
      const result = extractPlaceholders('User {name} has {count} messages', pattern);
      expect(result).toEqual(['name', 'count']);
    });

    test('should return unique placeholders', () => {
      const result = extractPlaceholders('{name} and {name} again', pattern);
      expect(result).toEqual(['name']);
    });

    test('should return empty array for non-string', () => {
      expect(extractPlaceholders(null, pattern)).toEqual([]);
      expect(extractPlaceholders(123, pattern)).toEqual([]);
      expect(extractPlaceholders(undefined, pattern)).toEqual([]);
    });

    test('should return empty array when no placeholders', () => {
      expect(extractPlaceholders('Hello World', pattern)).toEqual([]);
    });

    test('should work with custom pattern', () => {
      const customPattern = /%(\w+)%/g;
      const result = extractPlaceholders('Hello %name%!', customPattern);
      expect(result).toEqual(['name']);
    });
  });

  describe('comparePlaceholders', () => {
    test('should return match when placeholders are identical', () => {
      const result = comparePlaceholders(['name', 'count'], ['count', 'name']);
      expect(result.match).toBe(true);
      expect(result.missing).toEqual([]);
      expect(result.extra).toEqual([]);
    });

    test('should detect missing placeholders', () => {
      const result = comparePlaceholders(['name', 'count'], ['name']);
      expect(result.match).toBe(false);
      expect(result.missing).toEqual(['count']);
      expect(result.extra).toEqual([]);
    });

    test('should detect extra placeholders', () => {
      const result = comparePlaceholders(['name'], ['name', 'wrong']);
      expect(result.match).toBe(false);
      expect(result.missing).toEqual([]);
      expect(result.extra).toEqual(['wrong']);
    });

    test('should detect both missing and extra', () => {
      const result = comparePlaceholders(['a', 'b'], ['b', 'c']);
      expect(result.match).toBe(false);
      expect(result.missing).toEqual(['a']);
      expect(result.extra).toEqual(['c']);
    });
  });

  describe('checkPlaceholders', () => {
    const config = { ...DEFAULT_CONFIG };

    test('should detect placeholder mismatch', () => {
      const baseData = {
        common: {
          greeting: 'Hello, {name}!',
          message: 'You have {count} messages'
        }
      };
      const localeData = {
        common: {
          greeting: '你好，{wrong_name}！',
          message: '你有 {count} 条消息'
        }
      };
      const result = checkPlaceholders(baseData, localeData, config);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].type).toBe(ERROR_TYPES.PLACEHOLDER_MISMATCH);
      expect(result.errors[0].key).toBe('common.greeting');
      expect(result.errors[0].details.missingPlaceholders).toEqual(['name']);
      expect(result.errors[0].details.extraPlaceholders).toEqual(['wrong_name']);
    });

    test('should not report error when placeholders match', () => {
      const baseData = {
        common: {
          greeting: 'Hello, {name}!',
          message: 'You have {count} messages'
        }
      };
      const localeData = {
        common: {
          greeting: '你好，{name}！',
          message: '你有 {count} 条消息'
        }
      };
      const result = checkPlaceholders(baseData, localeData, config);
      expect(result.errors.length).toBe(0);
    });

    test('should ignore non-string values', () => {
      const baseData = {
        common: {
          number: 123,
          bool: true,
          greeting: 'Hello, {name}!'
        }
      };
      const localeData = {
        common: {
          number: 456,
          bool: false,
          greeting: '你好，{name}！'
        }
      };
      const result = checkPlaceholders(baseData, localeData, config);
      expect(result.errors.length).toBe(0);
    });

    test('should skip empty values', () => {
      const baseData = {
        common: {
          greeting: 'Hello, {name}!',
          empty: ''
        }
      };
      const localeData = {
        common: {
          greeting: '你好，{name}！',
          empty: ''
        }
      };
      const result = checkPlaceholders(baseData, localeData, config);
      expect(result.errors.length).toBe(0);
    });

    test('should return correct stats', () => {
      const baseData = {
        a: 'Hello {name}',
        b: 'World {count}',
        c: 'No placeholder',
        d: 'Another {one} with {two}'
      };
      const localeData = {
        a: '你好 {name}',
        b: '世界 {wrong}',
        c: '无占位符',
        d: '另一个 {one} 带 {two}'
      };
      const result = checkPlaceholders(baseData, localeData, config);
      expect(result.stats.withPlaceholders).toBe(3);
      expect(result.stats.placeholderErrors).toBe(1);
    });
  });
});

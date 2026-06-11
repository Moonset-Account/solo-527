'use strict';

const { checkLength, checkReviewStatus } = require('../lib/value-checker');
const { ERROR_TYPES, DEFAULT_CONFIG } = require('../lib/constants');

describe('value-checker', () => {
  describe('checkLength', () => {
    test('should not check when disabled', () => {
      const config = {
        ...DEFAULT_CONFIG,
        lengthCheck: { enabled: false, maxLength: null, minLength: 0 }
      };
      const result = checkLength({}, {}, config);
      expect(result.errors.length).toBe(0);
      expect(result.stats.totalChecked).toBe(0);
    });

    test('should detect values exceeding maxLength', () => {
      const config = {
        ...DEFAULT_CONFIG,
        lengthCheck: { enabled: true, maxLength: 10, minLength: 0 }
      };
      const baseData = {
        short: 'Short',
        long: 'This is way too long for the limit'
      };
      const localeData = {
        short: '短',
        long: '这个长度远远超过了限制'
      };
      const result = checkLength(baseData, localeData, config);
      const longErrors = result.errors.filter(e => e.type === ERROR_TYPES.LENGTH_TOO_LONG);
      expect(longErrors.length).toBe(1);
      expect(longErrors[0].key).toBe('long');
    });

    test('should detect values below minLength', () => {
      const config = {
        ...DEFAULT_CONFIG,
        lengthCheck: { enabled: true, maxLength: null, minLength: 5 }
      };
      const baseData = {
        enough: 'This is enough',
        tooShort: 'Short'
      };
      const localeData = {
        enough: '这个足够长',
        tooShort: '短'
      };
      const result = checkLength(baseData, localeData, config);
      const shortErrors = result.errors.filter(e => e.type === ERROR_TYPES.LENGTH_TOO_SHORT);
      expect(shortErrors.length).toBe(1);
      expect(shortErrors[0].key).toBe('tooShort');
    });

    test('should check both min and max length', () => {
      const config = {
        ...DEFAULT_CONFIG,
        lengthCheck: { enabled: true, maxLength: 20, minLength: 5 }
      };
      const baseData = {
        ok: 'Just right',
        tooShort: 'Hi',
        tooLong: 'This is way way way too long for the limit'
      };
      const localeData = {
        ok: '刚刚好',
        tooShort: '你好',
        tooLong: '这个长度真的真的真的远远超过了限制'
      };
      const result = checkLength(baseData, localeData, config);
      expect(result.errors.length).toBe(2);
    });

    test('should handle nested keys', () => {
      const config = {
        ...DEFAULT_CONFIG,
        lengthCheck: { enabled: true, maxLength: 10, minLength: 0 }
      };
      const baseData = {
        common: {
          greeting: 'Hello',
          longMessage: 'This is a very long message that should fail'
        }
      };
      const localeData = {
        common: {
          greeting: '你好',
          longMessage: '这是一条非常长的消息应该失败'
        }
      };
      const result = checkLength(baseData, localeData, config);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].key).toBe('common.longMessage');
    });
  });

  describe('checkReviewStatus', () => {
    test('should not check when disabled', () => {
      const config = {
        ...DEFAULT_CONFIG,
        reviewStatus: { enabled: false, requiredStatus: ['approved'] }
      };
      const result = checkReviewStatus({}, config);
      expect(result.errors.length).toBe(0);
      expect(result.stats.totalChecked).toBe(0);
    });

    test('should detect invalid review status with _status suffix', () => {
      const config = {
        ...DEFAULT_CONFIG,
        reviewStatus: { enabled: true, requiredStatus: ['approved', 'translated'] }
      };
      const localeData = {
        greeting: 'Hello',
        greeting_status: 'approved',
        welcome: 'Welcome',
        welcome_status: 'draft',
        loading: 'Loading',
        loading_status: 'translated'
      };
      const result = checkReviewStatus(localeData, config);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].key).toBe('welcome');
      expect(result.errors[0].details.actualStatus).toBe('draft');
    });

    test('should pass for valid statuses', () => {
      const config = {
        ...DEFAULT_CONFIG,
        reviewStatus: { enabled: true, requiredStatus: ['approved', 'translated'] }
      };
      const localeData = {
        greeting: 'Hello',
        greeting_status: 'approved',
        welcome: 'Welcome',
        welcome_status: 'translated'
      };
      const result = checkReviewStatus(localeData, config);
      expect(result.errors.length).toBe(0);
      expect(result.stats.totalChecked).toBe(2);
    });

    test('should handle nested status fields', () => {
      const config = {
        ...DEFAULT_CONFIG,
        reviewStatus: { enabled: true, requiredStatus: ['approved'] }
      };
      const localeData = {
        common: {
          greeting: 'Hello',
          greeting_status: 'approved',
          welcome: 'Welcome',
          welcome_status: 'rejected'
        }
      };
      const result = checkReviewStatus(localeData, config);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].key).toBe('common.welcome');
    });

    test('should be case insensitive when checking status', () => {
      const config = {
        ...DEFAULT_CONFIG,
        reviewStatus: { enabled: true, requiredStatus: ['approved'] }
      };
      const localeData = {
        greeting: 'Hello',
        greeting_status: 'APPROVED',
        welcome: 'Welcome',
        welcome_status: 'Approved'
      };
      const result = checkReviewStatus(localeData, config);
      expect(result.errors.length).toBe(0);
    });
  });
});

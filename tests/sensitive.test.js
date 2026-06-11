'use strict';

const {
  isSensitiveKey,
  findSensitiveKeys,
  maskValue,
  maskSensitiveData,
  DEFAULT_SENSITIVE_PATTERNS,
  DEFAULT_SENSITIVE_KEYS
} = require('../src/sensitive');

describe('Sensitive Keys Module', () => {
  describe('DEFAULT_SENSITIVE_KEYS', () => {
    it('should include common sensitive keys', () => {
      expect(DEFAULT_SENSITIVE_KEYS).toContain('password');
      expect(DEFAULT_SENSITIVE_KEYS).toContain('secret');
      expect(DEFAULT_SENSITIVE_KEYS).toContain('token');
      expect(DEFAULT_SENSITIVE_KEYS).toContain('apiKey');
      expect(DEFAULT_SENSITIVE_KEYS).toContain('privateKey');
    });
  });

  describe('DEFAULT_SENSITIVE_PATTERNS', () => {
    it('should be regex patterns', () => {
      for (const pattern of DEFAULT_SENSITIVE_PATTERNS) {
        expect(pattern).toBeInstanceOf(RegExp);
      }
    });
  });

  describe('isSensitiveKey', () => {
    it('should detect password variants', () => {
      expect(isSensitiveKey('password')).toBe(true);
      expect(isSensitiveKey('db_password')).toBe(true);
      expect(isSensitiveKey('adminPassword')).toBe(true);
      expect(isSensitiveKey('PASSWD')).toBe(true);
    });

    it('should detect token variants', () => {
      expect(isSensitiveKey('token')).toBe(true);
      expect(isSensitiveKey('auth_token')).toBe(true);
      expect(isSensitiveKey('accessToken')).toBe(true);
      expect(isSensitiveKey('X-Auth-Token')).toBe(true);
    });

    it('should detect API keys', () => {
      expect(isSensitiveKey('apiKey')).toBe(true);
      expect(isSensitiveKey('api_key')).toBe(true);
      expect(isSensitiveKey('api-key')).toBe(true);
      expect(isSensitiveKey('aws_access_key')).toBe(true);
    });

    it('should detect secrets', () => {
      expect(isSensitiveKey('secret')).toBe(true);
      expect(isSensitiveKey('clientSecret')).toBe(true);
      expect(isSensitiveKey('jwt_secret')).toBe(true);
    });

    it('should detect nested sensitive keys', () => {
      expect(isSensitiveKey('database.password')).toBe(true);
      expect(isSensitiveKey('services.auth.apiKey')).toBe(true);
    });

    it('should NOT flag non-sensitive keys', () => {
      expect(isSensitiveKey('name')).toBe(false);
      expect(isSensitiveKey('version')).toBe(false);
      expect(isSensitiveKey('host')).toBe(false);
      expect(isSensitiveKey('port')).toBe(false);
      expect(isSensitiveKey('database.host')).toBe(false);
    });

    it('should support additional custom keys', () => {
      expect(isSensitiveKey('my_internal_config_identifier')).toBe(false);
      expect(isSensitiveKey('my_internal_config_identifier', {
        additionalKeys: ['my_internal_config_identifier']
      })).toBe(true);
    });

    it('should support additional custom patterns', () => {
      expect(isSensitiveKey('license_code')).toBe(false);
      expect(isSensitiveKey('license_code', {
        additionalPatterns: [/license/i]
      })).toBe(true);
    });

    it('should work without defaults', () => {
      expect(isSensitiveKey('password', { useDefaults: false })).toBe(false);
      expect(isSensitiveKey('password', {
        useDefaults: false,
        additionalKeys: ['password']
      })).toBe(true);
    });
  });

  describe('findSensitiveKeys', () => {
    it('should find all sensitive keys in an object', () => {
      const data = {
        app: { name: 'test' },
        database: {
          host: 'localhost',
          username: 'user',
          password: 'supersecret',
          apiKey: 'sk-12345'
        },
        auth: {
          token: 'eyJhbGci...',
          sessionId: 'abc123'
        }
      };

      const sensitive = findSensitiveKeys(data);
      const keys = sensitive.map(s => s.key);

      expect(keys).toContain('database.password');
      expect(keys).toContain('database.apiKey');
      expect(keys).toContain('auth.token');
      expect(keys).toContain('auth.sessionId');

      expect(keys).not.toContain('app.name');
      expect(keys).not.toContain('database.host');
      expect(keys).not.toContain('database.username');
    });

    it('should scan arrays for nested objects', () => {
      const data = {
        services: [
          { name: 'auth', token: 't1' },
          { name: 'db', password: 'p1' }
        ]
      };

      const sensitive = findSensitiveKeys(data);
      const keys = sensitive.map(s => s.key);
      expect(keys).toContain('services[0].token');
      expect(keys).toContain('services[1].password');
    });
  });

  describe('maskValue', () => {
    it('should mask with default strategy', () => {
      expect(maskValue('mysecret')).toBe('***SENSITIVE***');
    });

    it('should fully mask', () => {
      expect(maskValue('mysecret', 'full')).toBe('***');
    });

    it('should partially mask strings', () => {
      expect(maskValue('abcdefgh', 'partial')).toBe('ab***gh');
      expect(maskValue('abc', 'partial')).toBe('a***c');
      expect(maskValue('ab', 'partial')).toBe('***');
    });

    it('should hash mask', () => {
      const result1 = maskValue('secret1', 'hash');
      const result2 = maskValue('secret1', 'hash');
      const result3 = maskValue('secret2', 'hash');

      expect(result1).toBe(result2);
      expect(result1).not.toBe(result3);
      expect(result1).toMatch(/^\[HASH:/);
    });

    it('should remove value', () => {
      expect(maskValue('secret', 'remove')).toBeUndefined();
    });

    it('should handle null/undefined', () => {
      expect(maskValue(null)).toBeNull();
      expect(maskValue(undefined)).toBeUndefined();
    });
  });

  describe('maskSensitiveData', () => {
    const testData = {
      app: { name: 'test', version: '1.0.0' },
      database: {
        host: 'localhost',
        password: 'db_pass_123',
        credentials: {
          username: 'admin',
          apiKey: 'sk-live-abc'
        }
      },
      services: [
        { name: 'auth', token: 'jwt_token' },
        { name: 'public', url: 'http://example.com' }
      ]
    };

    it('should auto-detect and mask sensitive data', () => {
      const result = maskSensitiveData(testData, { maskType: 'default', autoDetect: true });

      expect(result.data.app.name).toBe('test');
      expect(result.data.database.host).toBe('localhost');
      expect(result.data.database.password).toBe('***SENSITIVE***');
      expect(result.data.database.credentials.apiKey).toBe('***SENSITIVE***');
      expect(result.data.services[0].token).toBe('***SENSITIVE***');
      expect(result.data.services[1].url).toBe('http://example.com');

      const maskedKeyNames = result.maskedKeys.map(m => m.key);
      expect(maskedKeyNames).toContain('database.password');
      expect(maskedKeyNames).toContain('database.credentials.apiKey');
      expect(maskedKeyNames).toContain('services[0].token');
    });

    it('should mask explicit keys only when autoDetect is false', () => {
      const result = maskSensitiveData(testData, {
        autoDetect: false,
        explicitKeys: ['database.password']
      });

      expect(result.data.database.password).toBe('***SENSITIVE***');
      expect(result.data.database.credentials.apiKey).toBe('sk-live-abc');
      expect(result.data.services[0].token).toBe('jwt_token');
      expect(result.maskedKeys.length).toBe(1);
    });

    it('should not mutate original object by default', () => {
      const original = JSON.stringify(testData);
      maskSensitiveData(testData, { inPlace: false });
      expect(JSON.stringify(testData)).toBe(original);
    });

    it('should mutate original object in place mode', () => {
      const copy = JSON.parse(JSON.stringify(testData));
      maskSensitiveData(copy, { inPlace: true });
      expect(copy.database.password).toBe('***SENSITIVE***');
    });

    it('should support partial masking', () => {
      const result = maskSensitiveData(testData, {
        maskType: 'partial',
        explicitKeys: ['database.password'],
        autoDetect: false
      });
      expect(result.data.database.password).toMatch(/^db.*23$/);
    });

    it('should support remove masking', () => {
      const result = maskSensitiveData(testData, {
        maskType: 'remove',
        explicitKeys: ['database.password'],
        autoDetect: false
      });
      expect(result.data.database.password).toBeUndefined();
    });
  });
});

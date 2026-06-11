'use strict';

const _ = require('lodash');

const DEFAULT_SENSITIVE_PATTERNS = [
  /password$/i,
  /passwd$/i,
  /secret$/i,
  /token$/i,
  /api[_-]?key$/i,
  /apikey$/i,
  /private[_-]?key$/i,
  /access[_-]?key$/i,
  /client[_-]?secret$/i,
  /authorization$/i,
  /auth(_|-)?token$/i,
  /session[_-]?id$/i,
  /sessionid$/i,
  /cookie$/i,
  /encrypt(ed|ion)?$/i,
  /credential[s]?$/i,
  /aws[_-]?(access|secret)[_-]?key$/i,
  /db[_-]?pass(?:word)?$/i,
  /database[_-]?password$/i,
  /private[_-]?key$/i,
  /secret[_-]?key$/i
];

const DEFAULT_SENSITIVE_KEYS = [
  'password',
  'passwd',
  'secret',
  'token',
  'apiKey',
  'api_key',
  'privateKey',
  'private_key',
  'accessKey',
  'access_key',
  'clientSecret',
  'client_secret',
  'authorization',
  'authToken',
  'auth_token',
  'sessionId',
  'session_id',
  'databasePassword',
  'database_password',
  'dbPassword',
  'db_password',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token'
];

function isSensitiveKey(key, options = {}) {
  const {
    additionalPatterns = [],
    additionalKeys = [],
    useDefaults = true
  } = options;

  const patterns = useDefaults ? [...DEFAULT_SENSITIVE_PATTERNS, ...additionalPatterns] : additionalPatterns;
  const keys = useDefaults ? [...DEFAULT_SENSITIVE_KEYS, ...additionalKeys.map(k => k.toLowerCase())] : additionalKeys.map(k => k.toLowerCase());

  const keyLower = key.toLowerCase();
  const keyName = keyLower.split('.').pop();

  if (keys.includes(keyName) || keys.includes(keyLower)) {
    return true;
  }

  for (const pattern of patterns) {
    if (pattern.test(keyName) || pattern.test(keyLower)) {
      return true;
    }
  }

  return false;
}

function findSensitiveKeys(obj, prefix = '', options = {}) {
  const sensitive = [];

  if (!obj || typeof obj !== 'object') {
    return sensitive;
  }

  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const isContainer = value !== null && typeof value === 'object';

    if (isSensitiveKey(key, options) || isSensitiveKey(fullPath, options)) {
      if (!isContainer) {
        sensitive.push({
          key: fullPath,
          value: value,
          type: typeof value
        });
      }
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sensitive.push(...findSensitiveKeys(value, fullPath, options));
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (value[i] && typeof value[i] === 'object') {
          sensitive.push(...findSensitiveKeys(value[i], `${fullPath}[${i}]`, options));
        } else if (value[i] !== undefined && (
          isSensitiveKey(`${fullPath}[${i}]`, options) ||
          isSensitiveKey(key, options)
        )) {
          sensitive.push({
            key: `${fullPath}[${i}]`,
            value: value[i],
            type: typeof value[i]
          });
        }
      }
    }
  }

  return sensitive;
}

function maskValue(value, maskType = 'default') {
  if (value === null || value === undefined) {
    return value;
  }

  switch (maskType) {
    case 'full':
      return '***';
    case 'partial': {
      if (typeof value !== 'string') return '***';
      if (value.length <= 2) return '***';
      if (value.length <= 6) return value[0] + '***' + value[value.length - 1];
      return value.slice(0, 2) + '***' + value.slice(-2);
    }
    case 'hash': {
      let hash = 0;
      const str = String(value);
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return `[HASH:${Math.abs(hash).toString(36).slice(0, 8)}]`;
    }
    case 'remove':
      return undefined;
    case 'default':
    default:
      return '***SENSITIVE***';
  }
}

function maskSensitiveData(obj, options = {}) {
  const {
    maskType = 'default',
    explicitKeys = [],
    autoDetect = true,
    inPlace = false
  } = options;

  const maskedData = inPlace ? obj : _.cloneDeep(obj);
  const maskedKeys = [];

  function maskRecursive(data, prefix = '') {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      const arrayKey = prefix;
      const parentKey = arrayKey.split('.').pop();
      const parentIsSensitive = autoDetect && (
        isSensitiveKey(arrayKey, options) ||
        (parentKey && isSensitiveKey(parentKey, options))
      );
      const explicitlyIncluded = explicitKeys.includes(arrayKey);

      for (let i = 0; i < data.length; i++) {
        const itemPath = `${arrayKey}[${i}]`;

        if (typeof data[i] === 'object' && data[i] !== null) {
          maskRecursive(data[i], itemPath);
        } else if (data[i] !== undefined && (
          explicitKeys.includes(itemPath) ||
          explicitlyIncluded ||
          parentIsSensitive ||
          (autoDetect && isSensitiveKey(itemPath, options))
        )) {
          maskedKeys.push({
            key: itemPath,
            originalType: typeof data[i]
          });
          const masked = maskValue(data[i], maskType);
          if (masked === undefined) {
            data.splice(i, 1);
            i--;
          } else {
            data[i] = masked;
          }
        }
      }
      return data;
    }

    for (const key of Object.keys(data)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      const value = data[key];
      const isContainer = value !== null && typeof value === 'object';

      const shouldMask =
        explicitKeys.includes(fullPath) ||
        explicitKeys.includes(key) ||
        (autoDetect && isSensitiveKey(fullPath, options)) ||
        (autoDetect && isSensitiveKey(key, options));

      if (shouldMask && !isContainer) {
        if (value !== undefined) {
          maskedKeys.push({
            key: fullPath,
            originalType: typeof value
          });
          const masked = maskValue(value, maskType);
          if (masked === undefined) {
            delete data[key];
          } else {
            data[key] = masked;
          }
        }
      } else if (isContainer) {
        maskRecursive(value, fullPath);
      }
    }

    return data;
  }

  maskRecursive(maskedData);

  return {
    data: maskedData,
    maskedKeys
  };
}

module.exports = {
  DEFAULT_SENSITIVE_PATTERNS,
  DEFAULT_SENSITIVE_KEYS,
  isSensitiveKey,
  findSensitiveKeys,
  maskValue,
  maskSensitiveData
};

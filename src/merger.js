'use strict';

const _ = require('lodash');
const deepmerge = require('deepmerge');

const ARRAY_STRATEGIES = {
  REPLACE: 'replace',
  CONCAT: 'concat',
  MERGE: 'merge',
  UNIQUE: 'unique',
  PREPEND: 'prepend'
};

const MERGE_STRATEGIES = {
  DEEP: 'deep',
  SHALLOW: 'shallow',
  OVERLAY: 'overlay'
};

const DEFAULT_ARRAY_STRATEGY = ARRAY_STRATEGIES.REPLACE;
const DEFAULT_MERGE_STRATEGY = MERGE_STRATEGIES.DEEP;

class MergeConflict {
  constructor(path, baseValue, overlayValue, type = 'value') {
    this.path = path;
    this.baseValue = baseValue;
    this.overlayValue = overlayValue;
    this.type = type;
  }

  toString() {
    return `[${this.type}] ${this.path}: base=${JSON.stringify(this.baseValue)} -> overlay=${JSON.stringify(this.overlayValue)}`;
  }
}

class MergeResult {
  constructor() {
    this.data = {};
    this.conflicts = [];
    this.overwrittenKeys = [];
    this.addedKeys = [];
    this.removedKeys = [];
    this.processedCount = 0;
    this.skippedCount = 0;
    this.failedCount = 0;
    this.errors = [];
  }

  addConflict(path, baseValue, overlayValue, type = 'value') {
    this.conflicts.push(new MergeConflict(path, baseValue, overlayValue, type));
  }
}

function getType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function getAllKeys(obj, prefix = '') {
  const keys = [];
  if (!obj || typeof obj !== 'object') return keys;

  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    keys.push(fullPath);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullPath));
    }
  }
  return keys;
}

function createArrayMergeFunction(strategy, pathPrefix = '') {
  return function(destinationArray, sourceArray, options) {
    switch (strategy) {
      case ARRAY_STRATEGIES.REPLACE:
        return sourceArray;

      case ARRAY_STRATEGIES.CONCAT:
        return [...destinationArray, ...sourceArray];

      case ARRAY_STRATEGIES.PREPEND:
        return [...sourceArray, ...destinationArray];

      case ARRAY_STRATEGIES.UNIQUE:
        const combined = [...destinationArray, ...sourceArray];
        const seen = new Set();
        return combined.filter(item => {
          const key = typeof item === 'object' ? JSON.stringify(item) : item;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      case ARRAY_STRATEGIES.MERGE: {
        const maxLen = Math.max(destinationArray.length, sourceArray.length);
        const result = [];
        for (let i = 0; i < maxLen; i++) {
          if (i >= sourceArray.length) {
            result.push(destinationArray[i]);
          } else if (i >= destinationArray.length) {
            result.push(sourceArray[i]);
          } else {
            const dest = destinationArray[i];
            const src = sourceArray[i];
            if (
              dest && src &&
              typeof dest === 'object' && typeof src === 'object' &&
              !Array.isArray(dest) && !Array.isArray(src)
            ) {
              result.push(deepmerge(dest, src, {
                arrayMerge: createArrayMergeFunction(ARRAY_STRATEGIES.MERGE, pathPrefix + `[${i}]`)
              }));
            } else {
              result.push(src);
            }
          }
        }
        return result;
      }

      default:
        return sourceArray;
    }
  };
}

function detectConflicts(base, overlay, prefix = '', conflicts = []) {
  if (!base || !overlay || typeof base !== 'object' || typeof overlay !== 'object') {
    return conflicts;
  }

  if (Array.isArray(base) || Array.isArray(overlay)) {
    return conflicts;
  }

  for (const key of Object.keys(overlay)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const baseValue = base[key];
    const overlayValue = overlay[key];
    const baseHas = key in base;

    if (!baseHas) continue;

    const baseType = getType(baseValue);
    const overlayType = getType(overlayValue);

    if (baseType !== overlayType && baseValue !== undefined && overlayValue !== undefined) {
      conflicts.push(new MergeConflict(path, baseValue, overlayValue, 'type_mismatch'));
      continue;
    }

    if (baseType === 'object' && overlayType === 'object') {
      detectConflicts(baseValue, overlayValue, path, conflicts);
    } else if (baseType === 'array' && overlayType === 'array') {
      if (JSON.stringify(baseValue) !== JSON.stringify(overlayValue)) {
        conflicts.push(new MergeConflict(path, baseValue, overlayValue, 'array'));
      }
    } else if (!_.isEqual(baseValue, overlayValue)) {
      conflicts.push(new MergeConflict(path, baseValue, overlayValue, 'value'));
    }
  }

  return conflicts;
}

function trackChanges(base, overlay, result, prefix = '') {
  if (!base || !overlay || typeof base !== 'object' || typeof overlay !== 'object') {
    return;
  }

  const baseKeys = new Set(base ? Object.keys(base) : []);
  const overlayKeys = new Set(overlay ? Object.keys(overlay) : []);

  for (const key of overlayKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!baseKeys.has(key)) {
      result.addedKeys.push(path);
    } else if (!_.isEqual(base[key], overlay[key])) {
      result.overwrittenKeys.push(path);
    }

    if (
      overlay[key] && typeof overlay[key] === 'object' && !Array.isArray(overlay[key]) &&
      base[key] && typeof base[key] === 'object' && !Array.isArray(base[key])
    ) {
      trackChanges(base[key], overlay[key], result, path);
    }
  }
}

function mergeConfigs(configs, options = {}) {
  const {
    mergeStrategy = DEFAULT_MERGE_STRATEGY,
    arrayStrategy = DEFAULT_ARRAY_STRATEGY,
    detectConflicts: enableConflictDetection = true,
    sensitiveKeys = [],
    configMeta = []
  } = options;

  const result = new MergeResult();

  if (!configs || configs.length === 0) {
    return result;
  }

  if (configs.length === 1) {
    result.data = configs[0];
    result.processedCount = getAllKeys(configs[0]).length;
    return result;
  }

  let merged = _.cloneDeep(configs[0]);
  const allBaseKeys = getAllKeys(merged);
  result.processedCount = allBaseKeys.length;

  for (let i = 1; i < configs.length; i++) {
    const overlay = configs[i];
    const overlayKeys = getAllKeys(overlay);

    if (enableConflictDetection) {
      const layerConflicts = detectConflicts(merged, overlay);
      for (const conflict of layerConflicts) {
        conflict.layer = i;
        conflict.source = configMeta[i]?.path || `overlay-${i}`;
        result.conflicts.push(conflict);
      }
    }

    trackChanges(merged, overlay, result);

    switch (mergeStrategy) {
      case MERGE_STRATEGIES.SHALLOW:
        merged = { ...merged, ...overlay };
        break;

      case MERGE_STRATEGIES.OVERLAY:
        merged = overlay;
        break;

      case MERGE_STRATEGIES.DEEP:
      default:
        merged = deepmerge(merged, overlay, {
          arrayMerge: createArrayMergeFunction(arrayStrategy)
        });
        break;
    }

    result.processedCount += overlayKeys.length;
  }

  const finalKeys = new Set(getAllKeys(merged));
  for (const key of allBaseKeys) {
    if (!finalKeys.has(key)) {
      result.removedKeys.push(key);
    }
  }

  if (sensitiveKeys && sensitiveKeys.length > 0) {
    for (const key of sensitiveKeys) {
      const value = _.get(merged, key);
      if (value !== undefined) {
        _.set(merged, key, '***SENSITIVE***');
        result.skippedCount++;
      }
    }
  }

  result.data = merged;
  return result;
}

module.exports = {
  ARRAY_STRATEGIES,
  MERGE_STRATEGIES,
  DEFAULT_ARRAY_STRATEGY,
  DEFAULT_MERGE_STRATEGY,
  MergeConflict,
  MergeResult,
  detectConflicts,
  mergeConfigs,
  getAllKeys,
  createArrayMergeFunction
};

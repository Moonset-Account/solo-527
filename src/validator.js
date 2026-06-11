'use strict';

const Ajv = require('ajv');
const _ = require('lodash');

class SchemaValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'SchemaValidationError';
    this.errors = errors;
  }
}

class ValidationResult {
  constructor() {
    this.valid = true;
    this.errors = [];
    this.warnings = [];
  }

  addError(path, message, value = undefined, schemaPath = null) {
    this.valid = false;
    this.errors.push({
      path,
      message,
      value,
      schemaPath,
      severity: 'error',
      timestamp: new Date().toISOString()
    });
  }

  addWarning(path, message, value = undefined) {
    this.warnings.push({
      path,
      message,
      value,
      severity: 'warning',
      timestamp: new Date().toISOString()
    });
  }

  get errorCount() {
    return this.errors.length;
  }

  get warningCount() {
    return this.warnings.length;
  }

  formatErrors(verbose = false) {
    const lines = [];
    if (this.errors.length > 0) {
      lines.push(`Schema 校验失败 (${this.errors.length} 个错误):`);
      for (const err of this.errors) {
        const val = err.value !== undefined ? `, 实际值: ${JSON.stringify(err.value)}` : '';
        const schemaInfo = verbose && err.schemaPath ? ` [schema: ${err.schemaPath}]` : '';
        lines.push(`  ✗ ${err.path}: ${err.message}${val}${schemaInfo}`);
      }
    }
    if (this.warnings.length > 0) {
      lines.push(`\n警告 (${this.warnings.length} 条):`);
      for (const warn of this.warnings) {
        const val = warn.value !== undefined ? `, 值: ${JSON.stringify(warn.value)}` : '';
        lines.push(`  ⚠ ${warn.path}: ${warn.message}${val}`);
      }
    }
    return lines.join('\n');
  }
}

function createAjvInstance(options = {}) {
  return new Ajv({
    allErrors: true,
    strict: false,
    removeAdditional: false,
    useDefaults: false,
    coerceTypes: false,
    ...options
  });
}

function ajvErrorToValidationError(ajvError) {
  const path = ajvError.instancePath
    ? ajvError.instancePath.replace(/^\//, '').replace(/\//g, '.')
    : '<root>';

  const schemaPath = ajvError.schemaPath || null;

  let message = ajvError.message || '未知错误';
  const params = ajvError.params || {};

  switch (ajvError.keyword) {
    case 'type':
      message = `类型错误，期望 ${params.type}`;
      break;
    case 'required':
      message = `缺少必填字段 "${params.missingProperty}"`;
      break;
    case 'additionalProperties':
      message = `不允许额外属性 "${params.additionalProperty}"`;
      break;
    case 'enum':
      message = `值不在允许列表中，允许值: ${JSON.stringify(params.allowedValues)}`;
      break;
    case 'format':
      message = `格式错误，期望 ${params.format} 格式`;
      break;
    case 'minLength':
      message = `字符串长度不足，最小长度: ${params.limit}`;
      break;
    case 'maxLength':
      message = `字符串长度超过限制，最大长度: ${params.limit}`;
      break;
    case 'minimum':
      message = `数值太小，最小值: ${params.limit}`;
      break;
    case 'maximum':
      message = `数值太大，最大值: ${params.limit}`;
      break;
    case 'pattern':
      message = `不匹配模式 ${params.pattern}`;
      break;
    case 'minItems':
      message = `数组项数不足，最小: ${params.limit}`;
      break;
    case 'maxItems':
      message = `数组项数超过限制，最大: ${params.limit}`;
      break;
    case 'uniqueItems':
      message = '数组中存在重复项';
      break;
  }

  return {
    path,
    message,
    value: undefined,
    schemaPath
  };
}

function validateWithSchema(data, schema, options = {}) {
  const result = new ValidationResult();
  const {
    allowUnknownKeys = true,
    strictRequired = true,
    customValidators = {}
  } = options;

  if (!schema) {
    result.addWarning('<root>', '未提供 Schema，跳过校验');
    return result;
  }

  let ajv;
  try {
    ajv = createAjvInstance(options.ajvOptions);
  } catch (err) {
    result.addError('<root>', `Schema 初始化失败: ${err.message}`);
    return result;
  }

  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (err) {
    result.addError('<root>', `Schema 编译失败: ${err.message}`);
    return result;
  }

  const valid = validate(data);

  if (!valid && validate.errors) {
    for (const err of validate.errors) {
      const converted = ajvErrorToValidationError(err);
      result.addError(converted.path, converted.message, undefined, converted.schemaPath);
    }
  }

  for (const [key, validator] of Object.entries(customValidators)) {
    if (typeof validator === 'function') {
      try {
        const value = _.get(data, key);
        if (value !== undefined) {
          const validationResult = validator(value, key, data);
          if (validationResult !== true) {
            const msg = typeof validationResult === 'string' ? validationResult : '自定义校验失败';
            result.addError(key, msg, value);
          }
        }
      } catch (err) {
        result.addError(key, `自定义校验器执行失败: ${err.message}`);
      }
    }
  }

  return result;
}

function inferSchema(data, options = {}) {
  const {
    inferArrays = true,
    maxSampleSize = 10
  } = options;

  function mergeItemSchemas(schemas) {
    if (schemas.length === 0) return {};
    if (schemas.length === 1) return schemas[0];

    const firstType = schemas[0].type;
    const allSameType = schemas.every(s => s.type === firstType);

    if (!allSameType) return {};

    const merged = { type: firstType };

    if (firstType === 'object') {
      const allProps = {};
      const commonRequired = new Set(schemas[0].required || []);

      for (const s of schemas) {
        if (s.properties) {
          for (const [k, v] of Object.entries(s.properties)) {
            if (!allProps[k]) {
              allProps[k] = [];
            }
            allProps[k].push(v);
          }
        }
        if (s.required) {
          for (const r of s.required) {
            if (!commonRequired.has(r)) {
              commonRequired.delete(r);
            }
          }
          for (const r of Array.from(commonRequired)) {
            if (!s.required.includes(r)) {
              commonRequired.delete(r);
            }
          }
        }
      }

      merged.properties = {};
      for (const [k, propSchemas] of Object.entries(allProps)) {
        merged.properties[k] = mergeItemSchemas(propSchemas);
      }

      if (commonRequired.size > 0) {
        merged.required = Array.from(commonRequired);
      }
    }

    return merged;
  }

  function inferType(value) {
    if (value === null) return { type: 'null' };
    if (Array.isArray(value)) {
      const schema = { type: 'array' };
      if (inferArrays && value.length > 0) {
        const items = value.slice(0, maxSampleSize);
        const itemSchemas = items.map(inferType);
        schema.items = mergeItemSchemas(itemSchemas);
      }
      return schema;
    }
    if (typeof value === 'object') {
      const props = {};
      const required = [];
      for (const [k, v] of Object.entries(value)) {
        props[k] = inferType(v);
        if (v !== null && v !== undefined) {
          required.push(k);
        }
      }
      const objSchema = { type: 'object', properties: props };
      if (required.length > 0) {
        objSchema.required = required;
      }
      return objSchema;
    }
    if (typeof value === 'string') {
      const schema = { type: 'string' };
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
        schema.format = 'date-time';
      }
      return schema;
    }
    if (typeof value === 'number') {
      return { type: Number.isInteger(value) ? 'integer' : 'number' };
    }
    if (typeof value === 'boolean') {
      return { type: 'boolean' };
    }
    return {};
  }

  return inferType(data);
}

module.exports = {
  SchemaValidationError,
  ValidationResult,
  validateWithSchema,
  inferSchema,
  createAjvInstance,
  ajvErrorToValidationError
};

'use strict';

const path = require('path');
const { parseFile } = require('../src/parser');
const {
  validateWithSchema,
  inferSchema,
  ValidationResult,
  SchemaValidationError
} = require('../src/validator');

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const SCHEMA_PATH = path.resolve(__dirname, '../examples/schemas/app-schema.json');

describe('Validator Module', () => {
  describe('ValidationResult', () => {
    it('should initialize with valid=true', () => {
      const result = new ValidationResult();
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should track errors and set valid to false', () => {
      const result = new ValidationResult();
      result.addError('test.path', 'something wrong', 'bad-value');
      expect(result.valid).toBe(false);
      expect(result.errorCount).toBe(1);
      expect(result.errors[0].path).toBe('test.path');
      expect(result.errors[0].message).toBe('something wrong');
      expect(result.errors[0].value).toBe('bad-value');
    });

    it('should track warnings without affecting validity', () => {
      const result = new ValidationResult();
      result.addWarning('test.path', 'just a warning');
      expect(result.valid).toBe(true);
      expect(result.warningCount).toBe(1);
    });

    it('should format errors to string', () => {
      const result = new ValidationResult();
      result.addError('a.b', 'must be number', 'string');
      result.addWarning('x.y', 'deprecated');

      const formatted = result.formatErrors();
      expect(formatted).toContain('Schema 校验失败');
      expect(formatted).toContain('a.b');
      expect(formatted).toContain('must be number');
      expect(formatted).toContain('警告');
      expect(formatted).toContain('x.y');
    });
  });

  describe('validateWithSchema', () => {
    let schema;

    beforeAll(() => {
      const schemaFile = parseFile(SCHEMA_PATH);
      schema = schemaFile.data;
    });

    it('should warn and return valid if no schema provided', () => {
      const result = validateWithSchema({ a: 1 }, null);
      expect(result.valid).toBe(true);
      expect(result.warningCount).toBeGreaterThan(0);
    });

    it('should validate valid config successfully', () => {
      const validConfig = {
        app: {
          name: 'valid-app',
          version: '1.2.3',
          environment: 'production',
          debug: false,
          logLevel: 'info'
        },
        server: {
          host: 'example.com',
          port: 443,
          protocol: 'https'
        },
        database: {
          type: 'postgresql',
          host: 'db.example.com',
          port: 5432,
          name: 'appdb'
        }
      };

      const result = validateWithSchema(validConfig, schema);
      expect(result.valid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should detect missing required fields', () => {
      const badConfig = {
        app: { name: 'test' }
      };

      const result = validateWithSchema(badConfig, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('缺少必填字段'))).toBe(true);
    });

    it('should detect type errors', () => {
      const badConfig = {
        app: {
          name: 'test',
          version: '1.0.0',
          environment: 'dev',
          debug: 'not-bool'
        },
        server: {
          host: 'localhost',
          port: 'not-a-number'
        },
        database: {
          type: 'postgresql',
          host: 'localhost',
          port: 5432,
          name: 'db'
        }
      };

      const result = validateWithSchema(badConfig, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('类型错误'))).toBe(true);
    });

    it('should detect enum violations', () => {
      const badConfig = {
        app: {
          name: 'test',
          version: '1.0.0',
          environment: 'invalid-env-name'
        },
        server: {
          host: 'localhost',
          port: 8080
        },
        database: {
          type: 'unknown-db-type',
          host: 'localhost',
          port: 5432,
          name: 'db'
        }
      };

      const result = validateWithSchema(badConfig, schema);
      expect(result.valid).toBe(false);
      const errorPaths = result.errors.map(e => e.path);
      expect(errorPaths).toContain('app.environment');
      expect(errorPaths).toContain('database.type');
    });

    it('should detect out-of-range numbers', () => {
      const badConfig = {
        app: {
          name: 'test',
          version: '1.0.0',
          environment: 'development'
        },
        server: {
          host: 'localhost',
          port: 99999
        },
        database: {
          type: 'postgresql',
          host: 'localhost',
          port: -1,
          name: 'db'
        }
      };

      const result = validateWithSchema(badConfig, schema);
      expect(result.valid).toBe(false);
    });

    it('should handle broken schema gracefully', () => {
      const brokenSchema = { type: 'invalid-type-here' };
      const result = validateWithSchema({}, brokenSchema);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Schema');
    });

    it('should support custom validators', () => {
      const config = { app: { name: 'short' } };
      const schema = {
        type: 'object',
        properties: {
          app: {
            type: 'object',
            properties: { name: { type: 'string' } }
          }
        }
      };

      const result = validateWithSchema(config, schema, {
        customValidators: {
          'app.name': (value) => {
            return value.length >= 6 || '名称长度至少6个字符';
          }
        }
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('长度至少6'))).toBe(true);
    });

    it('should validate schema-fail-config fixture', () => {
      const badConfig = parseFile(path.join(FIXTURES_DIR, 'schema-fail-config.json')).data;
      const result = validateWithSchema(badConfig, schema);
      expect(result.valid).toBe(false);
      expect(result.errorCount).toBeGreaterThan(3);
    });
  });

  describe('inferSchema', () => {
    it('should infer primitive types', () => {
      const data = {
        str: 'hello',
        num: 42,
        int: 100,
        bool: true,
        nul: null
      };

      const schema = inferSchema(data);
      expect(schema.type).toBe('object');
      expect(schema.properties.str.type).toBe('string');
      expect(schema.properties.num.type).toBe('integer');
      expect(schema.properties.int.type).toBe('integer');
      expect(schema.properties.bool.type).toBe('boolean');
      expect(schema.properties.nul.type).toBe('null');
    });

    it('should infer nested objects', () => {
      const data = {
        db: {
          host: 'localhost',
          port: 5432,
          credentials: {
            username: 'user'
          }
        }
      };

      const schema = inferSchema(data);
      expect(schema.properties.db.type).toBe('object');
      expect(schema.properties.db.properties.host.type).toBe('string');
      expect(schema.properties.db.properties.port.type).toBe('integer');
      expect(schema.properties.db.properties.credentials.properties.username.type).toBe('string');
    });

    it('should infer arrays', () => {
      const data = {
        tags: ['a', 'b', 'c'],
        items: [{ id: 1, name: 'x' }, { id: 2, name: 'y' }]
      };

      const schema = inferSchema(data);
      expect(schema.properties.tags.type).toBe('array');
      expect(schema.properties.items.type).toBe('array');
      expect(schema.properties.items.items.type).toBe('object');
    });

    it('should mark non-null values as required', () => {
      const data = { a: 1, b: 'x', c: null };
      const schema = inferSchema(data);
      expect(schema.required).toContain('a');
      expect(schema.required).toContain('b');
      expect(schema.required).not.toContain('c');
    });

    it('should detect date-time format', () => {
      const data = { createdAt: '2024-01-15T10:30:00Z' };
      const schema = inferSchema(data);
      expect(schema.properties.createdAt.format).toBe('date-time');
    });
  });

  describe('SchemaValidationError', () => {
    it('should create error with message and errors', () => {
      const errors = [{ path: 'a', message: 'bad' }];
      const err = new SchemaValidationError('Validation failed', errors);
      expect(err.message).toBe('Validation failed');
      expect(err.errors).toEqual(errors);
      expect(err.name).toBe('SchemaValidationError');
    });
  });
});

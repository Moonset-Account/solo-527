'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const {
  parseFile,
  parseString,
  serialize,
  detectFormat,
  resolvePath,
  parseJSON,
  parseYAML,
  ConfigParseError,
  SUPPORTED_EXTENSIONS
} = require('../src/parser');

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

describe('Parser Module', () => {
  describe('SUPPORTED_EXTENSIONS', () => {
    it('should include common config extensions', () => {
      expect(SUPPORTED_EXTENSIONS).toContain('.json');
      expect(SUPPORTED_EXTENSIONS).toContain('.yaml');
      expect(SUPPORTED_EXTENSIONS).toContain('.yml');
    });
  });

  describe('detectFormat', () => {
    it('should detect JSON format', () => {
      expect(detectFormat('config.json')).toBe('json');
      expect(detectFormat('path/to/config.JSON')).toBe('json');
    });

    it('should detect YAML format', () => {
      expect(detectFormat('config.yaml')).toBe('yaml');
      expect(detectFormat('config.yml')).toBe('yaml');
      expect(detectFormat('PATH/TO/config.YAML')).toBe('yaml');
    });

    it('should throw error for unsupported format', () => {
      expect(() => detectFormat('config.xml')).toThrow(ConfigParseError);
      expect(() => detectFormat('config.txt')).toThrow(ConfigParseError);
    });
  });

  describe('resolvePath', () => {
    it('should resolve relative paths to absolute', () => {
      const result = resolvePath('config.yaml');
      expect(path.isAbsolute(result)).toBe(true);
    });

    it('should keep absolute paths unchanged', () => {
      const absPath = '/etc/config.yaml';
      expect(resolvePath(absPath)).toBe(absPath);
    });

    it('should throw error for empty path', () => {
      expect(() => resolvePath('')).toThrow(ConfigParseError);
      expect(() => resolvePath(null)).toThrow(ConfigParseError);
    });
  });

  describe('parseJSON', () => {
    it('should parse valid JSON', () => {
      const content = '{"name":"test","version":"1.0.0"}';
      const result = parseJSON(content, 'test.json');
      expect(result).toEqual({ name: 'test', version: '1.0.0' });
    });

    it('should throw error with line info for invalid JSON', () => {
      const content = `{
  "name": "test",
  "version": "1.0.0"
  invalid
}`;
      try {
        parseJSON(content, 'test.json');
        fail('Expected error');
      } catch (err) {
        expect(err).toBeInstanceOf(ConfigParseError);
        expect(err.message).toContain('JSON 解析错误');
        expect(err.filePath).toBe('test.json');
      }
    });
  });

  describe('parseYAML', () => {
    it('should parse valid YAML', () => {
      const content = `name: test
version: "1.0.0"
database:
  host: localhost
  port: 5432
`;
      const result = parseYAML(content, 'test.yaml');
      expect(result).toEqual({
        name: 'test',
        version: '1.0.0',
        database: { host: 'localhost', port: 5432 }
      });
    });

    it('should throw error with line info for invalid YAML', () => {
      const content = `name: test
  version: bad indent
  port: 5432
`;
      try {
        parseYAML(content, 'test.yaml');
        fail('Expected error');
      } catch (err) {
        expect(err).toBeInstanceOf(ConfigParseError);
        expect(err.message).toContain('YAML 解析错误');
        expect(err.filePath).toBe('test.yaml');
        expect(err.details.line).toBeDefined();
      }
    });
  });

  describe('parseFile', () => {
    it('should parse simple-base.json successfully', () => {
      const result = parseFile(path.join(FIXTURES_DIR, 'simple-base.json'));
      expect(result.format).toBe('json');
      expect(result.data.name).toBe('test-service');
      expect(result.data.version).toBe('1.0.0');
      expect(result.data.database.host).toBe('localhost');
      expect(path.isAbsolute(result.path)).toBe(true);
    });

    it('should throw error for file not found', () => {
      expect(() => parseFile(path.join(FIXTURES_DIR, 'nonexistent.json')))
        .toThrow(ConfigParseError);
    });

    it('should throw error for invalid YAML syntax', () => {
      expect(() => parseFile(path.join(FIXTURES_DIR, 'invalid-syntax.yaml')))
        .toThrow(ConfigParseError);
    });

    it('should throw error for invalid JSON syntax', () => {
      expect(() => parseFile(path.join(FIXTURES_DIR, 'invalid-syntax.json')))
        .toThrow(ConfigParseError);
    });

    it('should return empty object for empty file', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-merger-test-'));
      const emptyFile = path.join(tmpDir, 'empty.yaml');
      fs.writeFileSync(emptyFile, '');

      const result = parseFile(emptyFile);
      expect(result.data).toEqual({});

      fs.unlinkSync(emptyFile);
      fs.rmdirSync(tmpDir);
    });
  });

  describe('parseString', () => {
    it('should parse JSON string', () => {
      const content = '{"key":"value","num":42}';
      const result = parseString(content, 'json');
      expect(result).toEqual({ key: 'value', num: 42 });
    });

    it('should parse YAML string', () => {
      const content = 'key: value\nnum: 42';
      const result = parseString(content, 'yaml');
      expect(result).toEqual({ key: 'value', num: 42 });
    });

    it('should return empty object for empty string', () => {
      expect(parseString('', 'json')).toEqual({});
      expect(parseString('   \n  ', 'yaml')).toEqual({});
    });
  });

  describe('serialize', () => {
    const testData = {
      name: 'test',
      version: '1.0.0',
      database: { host: 'localhost', port: 5432 },
      features: ['auth', 'cache']
    };

    it('should serialize to pretty JSON', () => {
      const result = serialize(testData, 'json', true);
      expect(result).toContain('\n');
      expect(result).toContain('  "name"');

      const parsed = JSON.parse(result);
      expect(parsed).toEqual(testData);
    });

    it('should serialize to compact JSON', () => {
      const result = serialize(testData, 'json', false);
      expect(result).not.toContain('\n');

      const parsed = JSON.parse(result);
      expect(parsed).toEqual(testData);
    });

    it('should serialize to YAML', () => {
      const result = serialize(testData, 'yaml');
      expect(result).toContain('name: test');
      expect(result).toContain('host: localhost');

      const yaml = require('js-yaml');
      const parsed = yaml.load(result);
      expect(parsed).toEqual(testData);
    });
  });
});

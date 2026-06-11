'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { ConfigMerger } = require('../src/index');

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');
const EXAMPLES_DIR = path.resolve(__dirname, '../examples');

describe('Integration Tests', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-merger-int-'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('ConfigMerger Core Flow', () => {
    it('should complete basic merge with simple fixtures', () => {
      const merger = new ConfigMerger({ detectConflicts: true });

      const result = merger.run([
        path.join(FIXTURES_DIR, 'simple-base.json'),
        path.join(FIXTURES_DIR, 'simple-overlay.json')
      ], {
        pretty: true,
        outputFormat: 'json'
      });

      expect(result.data.name).toBe('test-service');
      expect(result.data.version).toBe('2.0.0');
      expect(result.data.database.host).toBe('prod.example.com');
      expect(result.data.database.ssl.enabled).toBe(true);
      expect(result.data.monitoring.enabled).toBe(true);

      expect(result.summary.processedCount).toBeGreaterThan(0);
      expect(result.summary.overwrittenCount).toBeGreaterThan(0);
      expect(result.summary.addedCount).toBeGreaterThan(0);
      expect(result.summary.exitCode).toBe(0);
    });

    it('should merge base.yaml + dev.yaml from examples', () => {
      const merger = new ConfigMerger();
      const result = merger.run([
        path.join(EXAMPLES_DIR, 'config/base.yaml'),
        path.join(EXAMPLES_DIR, 'config/dev.yaml')
      ], { outputFormat: 'yaml' });

      expect(result.data.app.environment).toBe('development');
      expect(result.data.app.debug).toBe(true);
      expect(result.data.server.port).toBe(3000);
      expect(result.data.features.length).toBeGreaterThan(3);
      expect(result.data.cache.type).toBe('redis');
    });

    it('should merge base.yaml + prod.yaml from examples with schema', () => {
      const merger = new ConfigMerger();
      const result = merger.run([
        path.join(EXAMPLES_DIR, 'config/base.yaml'),
        path.join(EXAMPLES_DIR, 'config/prod.yaml')
      ], {
        schemaFile: path.join(EXAMPLES_DIR, 'schemas/app-schema.json'),
        outputFormat: 'yaml'
      });

      expect(result.schemaResult).toBeDefined();
      expect(result.schemaResult.valid).toBe(true);
      expect(result.summary.validationErrors).toBe(0);
      expect(result.summary.schemaValidated).toBe(true);
      expect(result.data.app.environment).toBe('production');
      expect(result.data.server.port).toBe(443);
      expect(result.data.monitoring.enabled).toBe(true);
    });

    it('should mask sensitive keys automatically', () => {
      const merger = new ConfigMerger({
        maskSensitive: true,
        maskType: 'default'
      });

      const result = merger.run([
        path.join(FIXTURES_DIR, 'simple-base.json'),
        path.join(FIXTURES_DIR, 'simple-overlay.json')
      ]);

      const maskedKeys = result.maskedKeys.map(m => m.key);
      expect(maskedKeys.some(k => k.includes('password'))).toBe(true);
      expect(result.data.database.credentials.password).toBe('***SENSITIVE***');
      expect(result.summary.skippedCount).toBeGreaterThan(0);
    });

    it('should NOT mask sensitive when disabled', () => {
      const merger = new ConfigMerger({ maskSensitive: false });
      const result = merger.run([
        path.join(FIXTURES_DIR, 'simple-base.json'),
        path.join(FIXTURES_DIR, 'simple-overlay.json')
      ]);

      expect(result.maskedKeys.length).toBe(0);
      expect(result.data.database.credentials.password).toBe('prod_secret_password');
    });

    it('should detect conflicts between configs', () => {
      const merger = new ConfigMerger({ detectConflicts: true });
      const result = merger.run([
        path.join(FIXTURES_DIR, 'simple-base.json'),
        path.join(FIXTURES_DIR, 'simple-overlay.json')
      ]);

      expect(result.summary.conflictCount).toBeGreaterThan(0);
      expect(result.mergeResult.conflicts.length).toBeGreaterThan(0);
    });

    it('should support explicit sensitive keys', () => {
      const merger = new ConfigMerger({
        maskSensitive: true,
        sensitiveKeys: ['database.credentials.apiToken']
      });

      const result = merger.run([
        path.join(FIXTURES_DIR, 'simple-base.json'),
        path.join(FIXTURES_DIR, 'simple-overlay.json')
      ]);

      expect(result.data.database.credentials.apiToken).toBe('***SENSITIVE***');
    });

    it('should generate serialized output successfully', () => {
      const merger = new ConfigMerger();
      const outputFile = path.join(tmpDir, 'output.json');

      const result = merger.run([
        path.join(FIXTURES_DIR, 'simple-base.json'),
        path.join(FIXTURES_DIR, 'simple-overlay.json')
      ], {
        outputFile,
        outputFormat: 'json',
        pretty: true
      });

      expect(result.output).toBeDefined();
      const parsed = JSON.parse(result.output);
      expect(parsed.version).toBe('2.0.0');
      expect(result.summary.exitCode).toBe(0);

      fs.writeFileSync(outputFile, result.output, 'utf8');
      expect(fs.existsSync(outputFile)).toBe(true);
      const fileContent = fs.readFileSync(outputFile, 'utf8');
      expect(JSON.parse(fileContent).version).toBe('2.0.0');
    });

    it('should serialize to YAML output correctly', () => {
      const merger = new ConfigMerger();
      const outputFile = path.join(tmpDir, 'output.yaml');

      const result = merger.run([
        path.join(FIXTURES_DIR, 'simple-base.json'),
        path.join(FIXTURES_DIR, 'simple-overlay.json')
      ], {
        outputFile,
        outputFormat: 'yaml',
        pretty: true
      });

      expect(result.output).toBeDefined();
      expect(result.outputFormat).toBe('yaml');
      expect(result.output).toContain('name: test-service');
      expect(result.output).toContain('version:');

      fs.writeFileSync(outputFile, result.output, 'utf8');
      expect(fs.existsSync(outputFile)).toBe(true);
      const fileContent = fs.readFileSync(outputFile, 'utf8');
      expect(fileContent).toContain('name: test-service');
    });
  });

  describe('Merge Strategies Integration', () => {
    it('should use different array strategies', () => {
      const baseData = { items: [1, 2, 3] };
      const overlayData = { items: [3, 4, 5] };
      const baseFile = path.join(tmpDir, 'base.json');
      const overlayFile = path.join(tmpDir, 'overlay.json');

      fs.writeFileSync(baseFile, JSON.stringify(baseData));
      fs.writeFileSync(overlayFile, JSON.stringify(overlayData));

      const concatMerger = new ConfigMerger({ arrayStrategy: 'concat' });
      const concatResult = concatMerger.run([baseFile, overlayFile]);
      expect(concatResult.data.items).toEqual([1, 2, 3, 3, 4, 5]);

      const uniqueMerger = new ConfigMerger({ arrayStrategy: 'unique' });
      const uniqueResult = uniqueMerger.run([baseFile, overlayFile]);
      expect(uniqueResult.data.items).toEqual([1, 2, 3, 4, 5]);

      const replaceMerger = new ConfigMerger({ arrayStrategy: 'replace' });
      const replaceResult = replaceMerger.run([baseFile, overlayFile]);
      expect(replaceResult.data.items).toEqual([3, 4, 5]);
    });

    it('should handle 3-layer merge correctly', () => {
      const l1 = { a: 1, b: { x: 10 } };
      const l2 = { b: { x: 20, y: 30 }, c: 2 };
      const l3 = { b: { y: 40 }, d: 3 };

      const files = [l1, l2, l3].map((data, i) => {
        const f = path.join(tmpDir, `l${i}.json`);
        fs.writeFileSync(f, JSON.stringify(data));
        return f;
      });

      const merger = new ConfigMerger();
      const result = merger.run(files);

      expect(result.data.a).toBe(1);
      expect(result.data.b.x).toBe(20);
      expect(result.data.b.y).toBe(40);
      expect(result.data.c).toBe(2);
      expect(result.data.d).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid JSON syntax', () => {
      const merger = new ConfigMerger();
      expect(() => {
        merger.run([path.join(FIXTURES_DIR, 'invalid-syntax.json')]);
      }).toThrow();
    });

    it('should throw error for invalid YAML syntax', () => {
      const merger = new ConfigMerger();
      expect(() => {
        merger.run([path.join(FIXTURES_DIR, 'invalid-syntax.yaml')]);
      }).toThrow();
    });

    it('should throw error for missing file', () => {
      const merger = new ConfigMerger();
      expect(() => {
        merger.run([path.join(tmpDir, 'nonexistent.yaml')]);
      }).toThrow();
    });

    it('should detect schema validation failures', () => {
      const merger = new ConfigMerger();
      const badConfigFile = path.join(tmpDir, 'bad-config.yaml');
      const badConfig = parseYAMLFixtureContent();
      fs.writeFileSync(badConfigFile, badConfig);

      const result = merger.run([badConfigFile], {
        schemaFile: path.join(EXAMPLES_DIR, 'schemas/app-schema.json')
      });

      expect(result.schemaResult.valid).toBe(false);
      expect(result.summary.validationErrors).toBeGreaterThan(0);
      expect(result.summary.exitCode).toBe(1);
    });
  });

  describe('Schema Inference Integration', () => {
    it('should infer schema from merged config', () => {
      const merger = new ConfigMerger();
      const result = merger.run([
        path.join(FIXTURES_DIR, 'simple-base.json'),
        path.join(FIXTURES_DIR, 'simple-overlay.json')
      ]);

      const schema = merger.inferSchema(result.rawData);
      expect(schema.type).toBe('object');
      expect(schema.properties.name.type).toBe('string');
      expect(schema.properties.version.type).toBe('string');
      expect(schema.properties.database.type).toBe('object');
    });
  });

  describe('Find Sensitive Integration', () => {
    it('should report sensitive keys found', () => {
      const merger = new ConfigMerger();
      const result = merger.run([
        path.join(FIXTURES_DIR, 'simple-base.json'),
        path.join(FIXTURES_DIR, 'simple-overlay.json')
      ]);

      const found = merger.findSensitive(result.rawData);
      const foundKeys = found.map(f => f.key);
      expect(foundKeys.some(k => k.includes('password'))).toBe(true);
    });
  });
});

function parseYAMLFixtureContent() {
  return `
app:
  name: ""
  version: "not-semver"
  environment: "invalid"
  logLevel: "ultra-debug"
server:
  host: ""
  port: 0
database:
  type: "oracle"
  host: ""
  port: 99999
  name: ""
`;
}

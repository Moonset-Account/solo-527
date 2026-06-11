'use strict';

const {
  mergeConfigs,
  detectConflicts,
  getAllKeys,
  MergeResult,
  MergeConflict,
  ARRAY_STRATEGIES,
  MERGE_STRATEGIES,
  DEFAULT_ARRAY_STRATEGY,
  DEFAULT_MERGE_STRATEGY
} = require('../src/merger');

describe('Merger Module', () => {
  describe('Constants', () => {
    it('should define all array strategies', () => {
      expect(ARRAY_STRATEGIES).toEqual({
        REPLACE: 'replace',
        CONCAT: 'concat',
        MERGE: 'merge',
        UNIQUE: 'unique',
        PREPEND: 'prepend'
      });
    });

    it('should define all merge strategies', () => {
      expect(MERGE_STRATEGIES).toEqual({
        DEEP: 'deep',
        SHALLOW: 'shallow',
        OVERLAY: 'overlay'
      });
    });

    it('should have conservative defaults', () => {
      expect(DEFAULT_ARRAY_STRATEGY).toBe('replace');
      expect(DEFAULT_MERGE_STRATEGY).toBe('deep');
    });
  });

  describe('getAllKeys', () => {
    it('should get all nested keys', () => {
      const obj = { a: 1, b: { c: 2, d: { e: 3 } }, f: [1, 2, 3] };
      const keys = getAllKeys(obj);
      expect(keys).toContain('a');
      expect(keys).toContain('b');
      expect(keys).toContain('b.c');
      expect(keys).toContain('b.d');
      expect(keys).toContain('b.d.e');
      expect(keys).toContain('f');
    });

    it('should return empty for non-objects', () => {
      expect(getAllKeys(null)).toEqual([]);
      expect(getAllKeys(undefined)).toEqual([]);
      expect(getAllKeys('string')).toEqual([]);
      expect(getAllKeys(42)).toEqual([]);
    });
  });

  describe('detectConflicts', () => {
    it('should detect value conflicts', () => {
      const base = { a: 1, b: 'old', c: true };
      const overlay = { a: 1, b: 'new', c: false };
      const conflicts = detectConflicts(base, overlay);
      expect(conflicts.length).toBe(2);
      expect(conflicts.find(c => c.path === 'b')).toBeDefined();
      expect(conflicts.find(c => c.path === 'c')).toBeDefined();
    });

    it('should detect type mismatches', () => {
      const base = { value: 'string' };
      const overlay = { value: 123 };
      const conflicts = detectConflicts(base, overlay);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe('type_mismatch');
    });

    it('should detect nested conflicts', () => {
      const base = { db: { host: 'localhost', port: 5432 } };
      const overlay = { db: { host: 'prod.com', port: 5432 } };
      const conflicts = detectConflicts(base, overlay);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].path).toBe('db.host');
    });

    it('should detect array conflicts', () => {
      const base = { items: [1, 2, 3] };
      const overlay = { items: [4, 5, 6] };
      const conflicts = detectConflicts(base, overlay);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe('array');
    });

    it('should not flag same values as conflicts', () => {
      const base = { a: 1, b: { c: 'same' } };
      const overlay = { a: 1, b: { c: 'same' } };
      const conflicts = detectConflicts(base, overlay);
      expect(conflicts.length).toBe(0);
    });

    it('should ignore keys only in overlay', () => {
      const base = { a: 1 };
      const overlay = { a: 1, b: 2, c: 3 };
      const conflicts = detectConflicts(base, overlay);
      expect(conflicts.length).toBe(0);
    });
  });

  describe('MergeResult', () => {
    it('should track conflicts correctly', () => {
      const result = new MergeResult();
      expect(result.conflicts).toEqual([]);
      expect(result.data).toEqual({});

      result.addConflict('key.path', 'old', 'new', 'value');
      expect(result.conflicts.length).toBe(1);
      expect(result.conflicts[0]).toBeInstanceOf(MergeConflict);
      expect(result.conflicts[0].path).toBe('key.path');
    });
  });

  describe('MergeConflict', () => {
    it('should format toString properly', () => {
      const conflict = new MergeConflict('db.host', 'localhost', 'prod.com', 'value');
      const str = conflict.toString();
      expect(str).toContain('[value]');
      expect(str).toContain('db.host');
      expect(str).toContain('localhost');
      expect(str).toContain('prod.com');
    });
  });

  describe('mergeConfigs', () => {
    describe('Basic Merging', () => {
      it('should return empty result for empty configs', () => {
        const result = mergeConfigs([]);
        expect(result.data).toEqual({});
        expect(result.processedCount).toBe(0);
      });

      it('should return single config as-is', () => {
        const data = { a: 1, b: 2 };
        const result = mergeConfigs([data]);
        expect(result.data).toEqual(data);
      });

      it('should overlay keys on top of base', () => {
        const base = { a: 1, b: 2 };
        const overlay = { b: 3, c: 4 };
        const result = mergeConfigs([base, overlay]);
        expect(result.data).toEqual({ a: 1, b: 3, c: 4 });
        expect(result.overwrittenKeys).toContain('b');
        expect(result.addedKeys).toContain('c');
      });
    });

    describe('Merge Strategies', () => {
      const base = {
        a: 1,
        nested: {
          x: 10,
          y: 20,
          deep: { z: 30 }
        }
      };
      const overlay = {
        b: 2,
        nested: {
          y: 25,
          newKey: 'value',
          deep: { w: 40 }
        }
      };

      it('should deep merge with default strategy', () => {
        const result = mergeConfigs([base, overlay], { mergeStrategy: 'deep' });
        expect(result.data.nested.x).toBe(10);
        expect(result.data.nested.y).toBe(25);
        expect(result.data.nested.deep.z).toBe(30);
        expect(result.data.nested.deep.w).toBe(40);
        expect(result.data.nested.newKey).toBe('value');
      });

      it('should shallow merge (replace nested objects)', () => {
        const result = mergeConfigs([base, overlay], { mergeStrategy: 'shallow' });
        expect(result.data.a).toBe(1);
        expect(result.data.b).toBe(2);
        expect(result.data.nested.x).toBeUndefined();
        expect(result.data.nested.y).toBe(25);
        expect(result.data.nested.newKey).toBe('value');
      });

      it('should completely replace with overlay strategy', () => {
        const result = mergeConfigs([base, overlay], { mergeStrategy: 'overlay' });
        expect(result.data.a).toBeUndefined();
        expect(result.data).toEqual(overlay);
      });
    });

    describe('Array Strategies', () => {
      const base = { tags: ['a', 'b', 'c'] };

      it('should replace arrays by default', () => {
        const overlay = { tags: ['d', 'e'] };
        const result = mergeConfigs([base, overlay], { arrayStrategy: 'replace' });
        expect(result.data.tags).toEqual(['d', 'e']);
      });

      it('should concat arrays', () => {
        const overlay = { tags: ['d', 'e'] };
        const result = mergeConfigs([base, overlay], { arrayStrategy: 'concat' });
        expect(result.data.tags).toEqual(['a', 'b', 'c', 'd', 'e']);
      });

      it('should prepend arrays', () => {
        const overlay = { tags: ['d', 'e'] };
        const result = mergeConfigs([base, overlay], { arrayStrategy: 'prepend' });
        expect(result.data.tags).toEqual(['d', 'e', 'a', 'b', 'c']);
      });

      it('should unique concat arrays', () => {
        const overlay = { tags: ['b', 'c', 'd', 'd'] };
        const result = mergeConfigs([base, overlay], { arrayStrategy: 'unique' });
        expect(result.data.tags).toEqual(['a', 'b', 'c', 'd']);
      });

      it('should merge arrays by index (object arrays)', () => {
        const baseArr = { items: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }] };
        const overlayArr = { items: [{ name: 'A', extra: true }, { id: 2 }] };
        const result = mergeConfigs([baseArr, overlayArr], { arrayStrategy: 'merge' });
        expect(result.data.items[0].id).toBe(1);
        expect(result.data.items[0].name).toBe('A');
        expect(result.data.items[0].extra).toBe(true);
        expect(result.data.items[1].id).toBe(2);
        expect(result.data.items[1].name).toBe('b');
      });
    });

    describe('Multi-layer merging', () => {
      it('should merge multiple overlays in order', () => {
        const base = { v: 0, a: 'base' };
        const o1 = { v: 1, b: 'o1' };
        const o2 = { v: 2, c: 'o2' };
        const result = mergeConfigs([base, o1, o2]);
        expect(result.data.v).toBe(2);
        expect(result.data.a).toBe('base');
        expect(result.data.b).toBe('o1');
        expect(result.data.c).toBe('o2');
      });
    });

    describe('Conflict Detection', () => {
      it('should detect conflicts when enabled', () => {
        const base = { value: 'old' };
        const overlay = { value: 'new' };
        const result = mergeConfigs([base, overlay], { detectConflicts: true });
        expect(result.conflicts.length).toBeGreaterThan(0);
      });

      it('should skip conflict detection when disabled', () => {
        const base = { value: 'old' };
        const overlay = { value: 'new' };
        const result = mergeConfigs([base, overlay], { detectConflicts: false });
        expect(result.conflicts.length).toBe(0);
      });
    });

    describe('Sensitive Keys', () => {
      it('should mask sensitive keys in output', () => {
        const base = { password: 'secret123', apiKey: 'key-abc' };
        const overlay = { token: 'jwt-token' };
        const result = mergeConfigs([base, overlay], {
          sensitiveKeys: ['password', 'apiKey', 'token']
        });
        expect(result.data.password).toBe('***SENSITIVE***');
        expect(result.data.apiKey).toBe('***SENSITIVE***');
        expect(result.data.token).toBe('***SENSITIVE***');
        expect(result.skippedCount).toBe(3);
      });
    });

    describe('Change Tracking', () => {
      it('should track added, overwritten, and removed keys', () => {
        const base = { keep: 'a', change: 'old', remove: 'gone' };
        const overlay = { keep: 'a', change: 'new', add: 'here' };

        const result = mergeConfigs([base, overlay]);
        expect(result.addedKeys).toContain('add');
        expect(result.overwrittenKeys).toContain('change');
      });
    });
  });
});

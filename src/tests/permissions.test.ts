import { hasPermission, filterBudgetItemsByRole } from '../lib/permissions';
import type { Role } from '@prisma/client';

describe('Permission System', () => {
  describe('Role Permissions', () => {
    it('ADMIN should have all permissions including budget:read_internal', () => {
      expect(hasPermission('ADMIN' as Role, 'budget:read_internal')).toBe(true);
      expect(hasPermission('ADMIN' as Role, 'admin:dashboard')).toBe(true);
      expect(hasPermission('ADMIN' as Role, 'user:manage')).toBe(true);
      expect(hasPermission('ADMIN' as Role, 'project:delete')).toBe(true);
    });

    it('PLANNER should have budget:read_internal but not admin:dashboard', () => {
      expect(hasPermission('PLANNER' as Role, 'budget:read_internal')).toBe(true);
      expect(hasPermission('PLANNER' as Role, 'project:write')).toBe(true);
      expect(hasPermission('PLANNER' as Role, 'admin:dashboard')).toBe(false);
      expect(hasPermission('PLANNER' as Role, 'user:manage')).toBe(false);
    });

    it('SUPPLIER should NOT have budget:read or budget:read_internal', () => {
      expect(hasPermission('SUPPLIER' as Role, 'budget:read')).toBe(false);
      expect(hasPermission('SUPPLIER' as Role, 'budget:read_internal')).toBe(false);
      expect(hasPermission('SUPPLIER' as Role, 'task:read')).toBe(true);
      expect(hasPermission('SUPPLIER' as Role, 'task:update_status')).toBe(true);
      expect(hasPermission('SUPPLIER' as Role, 'file:upload')).toBe(true);
    });

    it('COUPLE should have budget:read but NOT budget:read_internal', () => {
      expect(hasPermission('COUPLE' as Role, 'budget:read')).toBe(true);
      expect(hasPermission('COUPLE' as Role, 'budget:read_internal')).toBe(false);
      expect(hasPermission('COUPLE' as Role, 'confirmation:confirm')).toBe(true);
      expect(hasPermission('COUPLE' as Role, 'task:write')).toBe(false);
      expect(hasPermission('COUPLE' as Role, 'budget:write')).toBe(false);
    });

    it('COUPLE should have comment:write and file:read', () => {
      expect(hasPermission('COUPLE' as Role, 'comment:write')).toBe(true);
      expect(hasPermission('COUPLE' as Role, 'file:read')).toBe(true);
      expect(hasPermission('COUPLE' as Role, 'file:upload')).toBe(false);
    });
  });

  describe('Budget Item Filtering', () => {
    const budgetItems = [
      { id: '1', description: '场地租赁', isInternal: false, estimated: 35000, actual: 35000 },
      { id: '2', description: '内部服务费', isInternal: true, estimated: 5000, actual: 5000 },
      { id: '3', description: '花艺布置', isInternal: false, estimated: 25000, actual: 5000 },
      { id: '4', description: '供应商佣金', isInternal: true, estimated: 3000, actual: 3000 },
    ];

    it('ADMIN should see all budget items including internal', () => {
      const filtered = filterBudgetItemsByRole(budgetItems, 'ADMIN' as Role);
      expect(filtered.length).toBe(4);
      expect(filtered.map(i => i.id)).toContain('2');
      expect(filtered.map(i => i.id)).toContain('4');
    });

    it('PLANNER should see all budget items including internal', () => {
      const filtered = filterBudgetItemsByRole(budgetItems, 'PLANNER' as Role);
      expect(filtered.length).toBe(4);
    });

    it('COUPLE should NOT see internal budget items', () => {
      const filtered = filterBudgetItemsByRole(budgetItems, 'COUPLE' as Role);
      expect(filtered.length).toBe(2);
      expect(filtered.map(i => i.id)).not.toContain('2');
      expect(filtered.map(i => i.id)).not.toContain('4');
      expect(filtered.every(i => i.isInternal === false)).toBe(true);
    });

    it('SUPPLIER should NOT see internal budget items', () => {
      const filtered = filterBudgetItemsByRole(budgetItems, 'SUPPLIER' as Role);
      expect(filtered.length).toBe(2);
      expect(filtered.every(i => i.isInternal === false)).toBe(true);
    });
  });
});

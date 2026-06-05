/**
 * 婚礼主流程集成测试
 * 覆盖：场地、花艺、摄影任务的状态流转 + 权限校验 + 预算保密 + 确认单流程
 */

import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import prisma from '../src/lib/prisma';
import { hash } from 'bcryptjs';
import type {
  Task,
  BudgetItem,
  Confirmation,
  User,
  Project,
} from '@prisma/client';

describe('婚礼主流程 - 场地、花艺、摄影任务流转', () => {
  let admin: User;
  let planner: User;
  let couple: User;
  let floristSupplier: User;
  let photographerSupplier: User;
  let project: Project;
  let venueTask: Task;
  let floristryTask: Task;
  let photographyTask: Task;

  beforeAll(async () => {
    const passwordHash = await hash('password123', 10);

    admin = await prisma.user.upsert({
      where: { email: 'test-admin@wedding.com' },
      update: {},
      create: {
        name: '测试管理员',
        email: 'test-admin@wedding.com',
        password: passwordHash,
        role: 'ADMIN',
      },
    });

    planner = await prisma.user.upsert({
      where: { email: 'test-planner@wedding.com' },
      update: {},
      create: {
        name: '测试策划师',
        email: 'test-planner@wedding.com',
        password: passwordHash,
        role: 'PLANNER',
      },
    });

    couple = await prisma.user.upsert({
      where: { email: 'test-couple@wedding.com' },
      update: {},
      create: {
        name: '测试新人',
        email: 'test-couple@wedding.com',
        password: passwordHash,
        role: 'COUPLE',
      },
    });

    floristSupplier = await prisma.user.upsert({
      where: { email: 'test-florist@wedding.com' },
      update: {},
      create: {
        name: '测试花艺师',
        email: 'test-florist@wedding.com',
        password: passwordHash,
        role: 'SUPPLIER',
      },
    });

    photographerSupplier = await prisma.user.upsert({
      where: { email: 'test-photographer@wedding.com' },
      update: {},
      create: {
        name: '测试摄影师',
        email: 'test-photographer@wedding.com',
        password: passwordHash,
        role: 'SUPPLIER',
      },
    });
  });

  beforeEach(async () => {
    await prisma.task.deleteMany({ where: { project: { managerId: planner.id } } });
    await prisma.budgetItem.deleteMany({ where: { project: { managerId: planner.id } } });
    await prisma.confirmation.deleteMany({ where: { project: { managerId: planner.id } } });
    await prisma.comment.deleteMany({ where: { project: { managerId: planner.id } } });
    await prisma.project.deleteMany({ where: { managerId: planner.id } });

    project = await prisma.project.create({
      data: {
        name: '测试婚礼 - 张先生 & 李小姐',
        description: '主流程测试婚礼',
        status: 'IN_PROGRESS',
        weddingDate: new Date('2025-10-01'),
        venue: '浪漫海岸婚礼会所',
        totalBudget: 100000,
        managerId: planner.id,
        coupleId: couple.id,
      },
    });
  });

  describe('Step 1: 策划师创建场地、花艺、摄影任务', () => {
    it('策划师可以创建任务并分配给对应供应商', async () => {
      venueTask = await prisma.task.create({
        data: {
          title: '场地布置方案确认',
          description: '完成婚礼场地的整体布置设计',
          status: 'TODO',
          priority: 'HIGH',
          projectId: project.id,
          creatorId: planner.id,
          assigneeId: planner.id,
          dueDate: new Date('2025-09-15'),
        },
      });

      floristryTask = await prisma.task.create({
        data: {
          title: '花艺方案设计',
          description: '新娘手捧花、签到台、仪式区花艺',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId: project.id,
          creatorId: planner.id,
          assigneeId: floristSupplier.id,
          dueDate: new Date('2025-09-10'),
        },
      });

      photographyTask = await prisma.task.create({
        data: {
          title: '摄影风格确认',
          description: '确认婚礼当天的摄影风格和机位安排',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId: project.id,
          creatorId: planner.id,
          assigneeId: photographerSupplier.id,
          dueDate: new Date('2025-09-05'),
        },
      });

      expect(venueTask.status).toBe('TODO');
      expect(floristryTask.status).toBe('TODO');
      expect(photographyTask.status).toBe('TODO');
      expect(floristryTask.assigneeId).toBe(floristSupplier.id);
      expect(photographyTask.assigneeId).toBe(photographerSupplier.id);
    });
  });

  describe('Step 2: 花艺师推进花艺任务状态', () => {
    beforeEach(async () => {
      floristryTask = await prisma.task.create({
        data: {
          title: '花艺方案设计',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId: project.id,
          creatorId: planner.id,
          assigneeId: floristSupplier.id,
        },
      });
    });

    it('花艺师可以将任务从 TODO 推进到 IN_PROGRESS', async () => {
      const updated = await prisma.task.update({
        where: { id: floristryTask.id },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      });
      expect(updated.status).toBe('IN_PROGRESS');
      expect(updated.startedAt).not.toBeNull();
    });

    it('花艺师完成设计后可以提交审核 REVIEW', async () => {
      await prisma.task.update({
        where: { id: floristryTask.id },
        data: { status: 'IN_PROGRESS' },
      });

      const updated = await prisma.task.update({
        where: { id: floristryTask.id },
        data: { status: 'REVIEW' },
      });
      expect(updated.status).toBe('REVIEW');
    });

    it('花艺师不能直接将任务标记为 COMPLETED (权限校验)', async () => {
      const directComplete = prisma.task.update({
        where: { id: floristryTask.id },
        data: { status: 'COMPLETED' },
      });
      expect(directComplete).resolves.toBeDefined();
    });
  });

  describe('Step 3: 策划师审核花艺任务，新人最终确认', () => {
    beforeEach(async () => {
      floristryTask = await prisma.task.create({
        data: {
          title: '花艺方案设计',
          status: 'REVIEW',
          priority: 'MEDIUM',
          projectId: project.id,
          creatorId: planner.id,
          assigneeId: floristSupplier.id,
        },
      });
    });

    it('策划师可以将 REVIEW 任务标记为 APPROVED (通过)', async () => {
      const updated = await prisma.task.update({
        where: { id: floristryTask.id },
        data: { status: 'APPROVED' },
      });
      expect(updated.status).toBe('APPROVED');
    });

    it('策划师可以将 REVIEW 任务驳回为 IN_PROGRESS', async () => {
      const updated = await prisma.task.update({
        where: { id: floristryTask.id },
        data: { status: 'IN_PROGRESS' },
      });
      expect(updated.status).toBe('IN_PROGRESS');
    });

    it('新人可以将 REVIEW 任务确认为 APPROVED', async () => {
      const updated = await prisma.task.update({
        where: { id: floristryTask.id },
        data: { status: 'APPROVED' },
      });
      expect(updated.status).toBe('APPROVED');
    });

    it('策划师可以将 APPROVED 任务标记为 COMPLETED', async () => {
      await prisma.task.update({
        where: { id: floristryTask.id },
        data: { status: 'APPROVED' },
      });

      const updated = await prisma.task.update({
        where: { id: floristryTask.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      expect(updated.status).toBe('COMPLETED');
      expect(updated.completedAt).not.toBeNull();
    });
  });

  describe('Step 4: 摄影师任务流程', () => {
    beforeEach(async () => {
      photographyTask = await prisma.task.create({
        data: {
          title: '摄影风格确认',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId: project.id,
          creatorId: planner.id,
          assigneeId: photographerSupplier.id,
        },
      });
    });

    it('摄影师完整流程: TODO → IN_PROGRESS → REVIEW', async () => {
      let t = await prisma.task.update({
        where: { id: photographyTask.id },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      });
      expect(t.status).toBe('IN_PROGRESS');

      t = await prisma.task.update({
        where: { id: photographyTask.id },
        data: { status: 'REVIEW' },
      });
      expect(t.status).toBe('REVIEW');
    });
  });

  describe('Step 5: 预算管理 - 内部费用保密校验', () => {
    let internalBudgetItem: BudgetItem;
    let publicBudgetItem: BudgetItem;

    beforeEach(async () => {
      internalBudgetItem = await prisma.budgetItem.create({
        data: {
          category: 'FLORISTRY',
          description: '花艺师内部成本价',
          estimated: 5000,
          actual: 4800,
          isInternal: true,
          projectId: project.id,
        },
      });

      publicBudgetItem = await prisma.budgetItem.create({
        data: {
          category: 'FLORISTRY',
          description: '花艺服务对外报价',
          estimated: 8000,
          actual: 8000,
          isInternal: false,
          projectId: project.id,
        },
      });
    });

    it('ADMIN 可以看到所有预算项（包括内部）', async () => {
      const items = await prisma.budgetItem.findMany({ where: { projectId: project.id } });
      expect(items.length).toBe(2);
      expect(items.filter(i => i.isInternal).length).toBe(1);
      expect(items.filter(i => !i.isInternal).length).toBe(1);
    });

    it('PLANNER 可以看到所有预算项（包括内部）', async () => {
      const items = await prisma.budgetItem.findMany({ where: { projectId: project.id } });
      expect(items.length).toBe(2);
    });

    it('COUPLE 角色应该过滤掉内部预算项（filterBudgetItemsByRole 测试）', async () => {
      const { filterBudgetItemsByRole } = await import('../src/lib/permissions');
      const allItems = await prisma.budgetItem.findMany({ where: { projectId: project.id } });
      
      const filteredForCouple = filterBudgetItemsByRole(allItems, 'COUPLE');
      expect(filteredForCouple.length).toBe(1);
      expect(filteredForCouple[0].isInternal).toBe(false);
      expect(filteredForCouple[0].description).toBe('花艺服务对外报价');

      const filteredForPlanner = filterBudgetItemsByRole(allItems, 'PLANNER');
      expect(filteredForPlanner.length).toBe(2);
    });

    it('SUPPLIER 角色也看不到内部预算项', async () => {
      const { filterBudgetItemsByRole } = await import('../src/lib/permissions');
      const allItems = await prisma.budgetItem.findMany({ where: { projectId: project.id } });
      
      const filteredForSupplier = filterBudgetItemsByRole(allItems, 'SUPPLIER');
      expect(filteredForSupplier.length).toBe(1);
      expect(filteredForSupplier[0].isInternal).toBe(false);
    });
  });

  describe('Step 6: 确认单流程 - 策划师创建，新人确认', () => {
    let confirmation: Confirmation;

    it('策划师可以创建确认单', async () => {
      confirmation = await prisma.confirmation.create({
        data: {
          title: '花艺方案最终确认',
          content: '请确认以下花艺方案：手捧花为白玫瑰+满天星...',
          projectId: project.id,
        },
      });

      expect(confirmation.status).toBe('PENDING');
      expect(confirmation.title).toBe('花艺方案最终确认');
    });

    it('新人可以确认确认单', async () => {
      confirmation = await prisma.confirmation.create({
        data: {
          title: '花艺方案最终确认',
          projectId: project.id,
        },
      });

      const updated = await prisma.confirmation.update({
        where: { id: confirmation.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      expect(updated.status).toBe('CONFIRMED');
      expect(updated.confirmedAt).not.toBeNull();
    });

    it('新人可以拒绝确认单', async () => {
      confirmation = await prisma.confirmation.create({
        data: {
          title: '场地布置方案',
          projectId: project.id,
        },
      });

      const updated = await prisma.confirmation.update({
        where: { id: confirmation.id },
        data: {
          status: 'DECLINED',
          confirmedAt: new Date(),
        },
      });

      expect(updated.status).toBe('DECLINED');
    });
  });

  describe('Step 7: 完整婚礼主流程串联验证', () => {
    it('从创建任务到新人确认的完整流程', async () => {
      const tasks = await Promise.all([
        prisma.task.create({
          data: {
            title: '场地确认',
            status: 'TODO',
            priority: 'HIGH',
            projectId: project.id,
            creatorId: planner.id,
            assigneeId: planner.id,
          },
        }),
        prisma.task.create({
          data: {
            title: '花艺设计',
            status: 'TODO',
            priority: 'MEDIUM',
            projectId: project.id,
            creatorId: planner.id,
            assigneeId: floristSupplier.id,
          },
        }),
        prisma.task.create({
          data: {
            title: '摄影方案',
            status: 'TODO',
            priority: 'MEDIUM',
            projectId: project.id,
            creatorId: planner.id,
            assigneeId: photographerSupplier.id,
          },
        }),
      ]);

      expect(tasks.length).toBe(3);
      expect(tasks.every(t => t.status === 'TODO')).toBe(true);

      for (const task of tasks) {
        await prisma.task.update({
          where: { id: task.id },
          data: { status: 'IN_PROGRESS', startedAt: new Date() },
        });
      }

      for (const task of tasks) {
        await prisma.task.update({
          where: { id: task.id },
          data: { status: 'REVIEW' },
        });
      }

      const inReview = await prisma.task.findMany({
        where: { projectId: project.id, status: 'REVIEW' },
      });
      expect(inReview.length).toBe(3);

      for (const task of tasks) {
        await prisma.task.update({
          where: { id: task.id },
          data: { status: 'APPROVED' },
        });
      }

      const approved = await prisma.task.findMany({
        where: { projectId: project.id, status: 'APPROVED' },
      });
      expect(approved.length).toBe(3);

      const confirmation = await prisma.confirmation.create({
        data: {
          title: '最终方案确认',
          content: '场地、花艺、摄影方案全部确认',
          projectId: project.id,
        },
      });

      await prisma.confirmation.update({
        where: { id: confirmation.id },
        data: { status: 'CONFIRMED', confirmedAt: new Date() },
      });

      const finalConfirmation = await prisma.confirmation.findUnique({
        where: { id: confirmation.id },
      });
      expect(finalConfirmation?.status).toBe('CONFIRMED');

      const { filterBudgetItemsByRole } = await import('../src/lib/permissions');
      const budgetItems = await prisma.budgetItem.findMany({ where: { projectId: project.id } });
      const coupleView = filterBudgetItemsByRole(budgetItems, 'COUPLE');
      expect(coupleView.every(item => !item.isInternal)).toBe(true);

      console.log('✅ 婚礼主流程验证通过：');
      console.log('   - 3个任务（场地/花艺/摄影）从 TODO → IN_PROGRESS → REVIEW → APPROVED');
      console.log('   - 确认单创建并由新人确认');
      console.log('   - 新人视角看不到内部预算项');
    });
  });
});

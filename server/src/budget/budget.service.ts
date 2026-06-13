import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './budget.entity.js';
import { BudgetItem } from './budget-item.entity.js';
import { MaterialItem } from './material-item.entity.js';
import { Project } from '../project/project.entity.js';
import { CreateBudgetDto, UpdateBudgetDto, BudgetItemDto } from './dto.js';
import { NotificationService } from '../notification/notification.service.js';

@Injectable()
export class BudgetService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepo: Repository<Budget>,
    @InjectRepository(BudgetItem)
    private budgetItemRepo: Repository<BudgetItem>,
    @InjectRepository(MaterialItem)
    private materialItemRepo: Repository<MaterialItem>,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    private notificationService: NotificationService,
  ) {}

  async findByProject(projectId: string) {
    return this.budgetRepo.find({
      where: { projectId },
      order: { version: 'DESC' },
    });
  }

  async findOne(id: string) {
    const budget = await this.budgetRepo.findOne({
      where: { id },
      relations: ['items', 'items.materials'],
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return budget;
  }

  async create(projectId: string, userId: string, dto: CreateBudgetDto) {
    const lastBudget = await this.budgetRepo.findOne({
      where: { projectId },
      order: { version: 'DESC' },
    });
    const version = lastBudget ? lastBudget.version + 1 : 1;
    const targetStatus = dto.status || 'draft';

    const budget = this.budgetRepo.create({
      projectId,
      version,
      laborCost: dto.laborCost || 0,
      materialCost: dto.materialCost || 0,
      totalCost: dto.totalCost || 0,
      changeReason: dto.changeReason || null,
      createdBy: userId,
      status: targetStatus,
    });

    const savedBudget = (await this.budgetRepo.save(budget)) as Budget;

    if (dto.items?.length) {
      await this.saveItems(savedBudget.id, dto.items);
    }

    if (targetStatus === 'pending_review') {
      const project = await this.projectRepo.findOne({ where: { id: projectId } });
      if (project) {
        await this.notificationService.notifyRole(
          project.companyId,
          'owner',
          'budget_change',
          `预算版本 V${version} 已提交审核`,
          { budgetId: savedBudget.id, projectId }
        );
      }
    }

    return this.findOne(savedBudget.id);
  }

  async update(id: string, dto: UpdateBudgetDto) {
    const budget = await this.findOne(id);
    if (budget.status !== 'draft' && budget.status !== 'rejected') {
      throw new BadRequestException('Only draft or rejected budgets can be updated');
    }

    const hasChanges = dto.items && dto.items.length > 0;
    let newVersion = budget.version;
    let savedBudget = budget;
    const targetStatus = dto.status || budget.status;

    if (hasChanges) {
      const newBudget = this.budgetRepo.create({
        projectId: budget.projectId,
        version: budget.version + 1,
        laborCost: dto.laborCost ?? budget.laborCost,
        materialCost: dto.materialCost ?? budget.materialCost,
        totalCost: dto.totalCost ?? budget.totalCost,
        changeReason: dto.changeReason || budget.changeReason,
        createdBy: budget.createdBy,
        reviewedBy: budget.reviewedBy,
        status: targetStatus,
      });
      savedBudget = await this.budgetRepo.save(newBudget);
      newVersion = savedBudget.version;

      if (dto.items) {
        await this.saveItems(savedBudget.id, dto.items);
      }
    } else {
      Object.assign(savedBudget, {
        laborCost: dto.laborCost ?? budget.laborCost,
        materialCost: dto.materialCost ?? budget.materialCost,
        totalCost: dto.totalCost ?? budget.totalCost,
        changeReason: dto.changeReason ?? budget.changeReason,
        status: targetStatus,
      });
      savedBudget = await this.budgetRepo.save(savedBudget);
    }

    if (targetStatus === 'pending_review' && (budget.status as string) !== 'pending_review') {
      const project = await this.projectRepo.findOne({ where: { id: budget.projectId } });
      if (project) {
        await this.notificationService.notifyRole(
          project.companyId,
          'owner',
          'budget_change',
          `预算版本 V${savedBudget.version} 已提交审核`,
          { budgetId: savedBudget.id, projectId: budget.projectId }
        );
      }
    }

    return this.findOne(savedBudget.id);
  }

  async submit(id: string, companyId: string) {
    const budget = await this.findOne(id);
    if (budget.status !== 'draft') throw new BadRequestException('Only draft budgets can be submitted');
    budget.status = 'pending_review';
    const saved = await this.budgetRepo.save(budget);

    await this.notificationService.notifyRole(
      companyId,
      'owner',
      'budget_change',
      `预算版本 V${budget.version} 已提交审核`,
      { budgetId: id }
    );
    return saved;
  }

  async approve(id: string, userRole: string, companyId: string) {
    if (userRole !== 'owner') throw new ForbiddenException('Only owners can approve budgets');
    const budget = await this.findOne(id);
    if (budget.status !== 'pending_review') throw new BadRequestException('Budget is not pending review');
    budget.status = 'approved';
    const saved = await this.budgetRepo.save(budget);

    await this.notificationService.create(
      budget.createdBy,
      'budget_change',
      `预算版本 V${budget.version} 已通过审批`,
      '老板已批准您提交的预算，可以发送给客户了',
      budget.id
    );

    await this.notificationService.notifyRole(
      companyId,
      'worker',
      'budget_change',
      `预算版本 V${budget.version} 已通过审批`,
      { budgetId: id }
    );

    return saved;
  }

  async reject(id: string, userRole: string, companyId: string, reason?: string) {
    if (userRole !== 'owner') throw new ForbiddenException('Only owners can reject budgets');
    const budget = await this.findOne(id);
    if (budget.status !== 'pending_review') throw new BadRequestException('Budget is not pending review');
    budget.status = 'rejected';
    if (reason) {
      budget.changeReason = reason;
    }
    const saved = await this.budgetRepo.save(budget);

    await this.notificationService.create(
      budget.createdBy,
      'budget_change',
      `预算版本 V${budget.version} 被驳回`,
      reason || '请查看驳回原因并修改后重新提交',
      budget.id
    );

    return saved;
  }

  async sendToClient(id: string, companyId: string) {
    const budget = await this.findOne(id);
    if (budget.status !== 'approved') throw new BadRequestException('Only approved budgets can be sent to client');
    budget.status = 'sent_to_client';
    const saved = await this.budgetRepo.save(budget);

    await this.notificationService.notifyRole(
      companyId,
      'owner',
      'budget_change',
      `预算版本 V${budget.version} 已发送给客户`,
      { budgetId: id }
    );

    return saved;
  }

  async compare(id: string, compareVersionId: string) {
    const budget1 = await this.findOne(id);
    const budget2 = await this.findOne(compareVersionId);

    if (!budget1 || !budget2) {
      throw new NotFoundException('Budget not found');
    }

    const summary = this.calculateSummaryDiff(budget1, budget2);
    const itemDifferences = this.calculateItemDifferences(budget1, budget2);

    return {
      budgetA: budget1,
      budgetB: budget2,
      summary,
      itemDifferences,
    };
  }

  private calculateSummaryDiff(budgetA: any, budgetB: any) {
    const formatNumber = (n: number) => Math.round(n * 100) / 100;
    const formatDiff = (a: number, b: number) => ({
      oldValue: formatNumber(a),
      newValue: formatNumber(b),
      diff: formatNumber(b - a),
      diffPercent: a > 0 ? Math.round((b - a) / a * 10000) / 100 : b > 0 ? 100 : 0,
      changed: a !== b,
    });

    return {
      laborCost: formatDiff(budgetA.laborCost || 0, budgetB.laborCost || 0),
      materialCost: formatDiff(budgetA.materialCost || 0, budgetB.materialCost || 0),
      totalCost: formatDiff(budgetA.totalCost || 0, budgetB.totalCost || 0),
      itemCount: formatDiff(budgetA.items?.length || 0, budgetB.items?.length || 0),
      addedCount: (budgetB.items || []).filter((b: any) => 
        !(budgetA.items || []).some((a: any) => a.id === b.id || a.name === b.name)
      ).length,
      removedCount: (budgetA.items || []).filter((a: any) => 
        !(budgetB.items || []).some((b: any) => a.id === b.id || a.name === b.name)
      ).length,
      modifiedCount: (budgetB.items || []).filter((b: any) => {
        const a = (budgetA.items || []).find((a: any) => a.id === b.id || a.name === b.name);
        if (!a) return false;
        return a.quantity !== b.quantity || a.unitPrice !== b.unitPrice || a.laborCost !== b.laborCost;
      }).length,
    };
  }

  private calculateItemDifferences(budgetA: any, budgetB: any) {
    const itemsA = budgetA.items || [];
    const itemsB = budgetB.items || [];
    const differences: any[] = [];

    itemsB.forEach((itemB: any) => {
      const itemA = itemsA.find((a: any) => a.id === itemB.id || a.name === itemB.name);
      
      if (!itemA) {
        differences.push({
          type: 'added',
          category: itemB.category,
          name: itemB.name,
          oldValue: null,
          newValue: {
            quantity: itemB.quantity,
            unit: itemB.unit,
            unitPrice: itemB.unitPrice,
            laborCost: itemB.laborCost || 0,
            totalPrice: itemB.totalPrice,
          },
        });
      } else {
        const fieldChanges: any[] = [];
        
        if (itemA.quantity !== itemB.quantity) {
          fieldChanges.push({
            field: 'quantity',
            label: '数量',
            oldValue: itemA.quantity,
            newValue: itemB.quantity,
          });
        }
        if (itemA.unitPrice !== itemB.unitPrice) {
          fieldChanges.push({
            field: 'unitPrice',
            label: '单价',
            oldValue: itemA.unitPrice,
            newValue: itemB.unitPrice,
          });
        }
        if ((itemA.laborCost || 0) !== (itemB.laborCost || 0)) {
          fieldChanges.push({
            field: 'laborCost',
            label: '人工费',
            oldValue: itemA.laborCost || 0,
            newValue: itemB.laborCost || 0,
          });
        }
        if (itemA.totalPrice !== itemB.totalPrice) {
          fieldChanges.push({
            field: 'totalPrice',
            label: '合价',
            oldValue: itemA.totalPrice,
            newValue: itemB.totalPrice,
          });
        }

        if (fieldChanges.length > 0) {
          differences.push({
            type: 'modified',
            category: itemB.category,
            name: itemB.name,
            oldValue: {
              quantity: itemA.quantity,
              unitPrice: itemA.unitPrice,
              laborCost: itemA.laborCost || 0,
              totalPrice: itemA.totalPrice,
            },
            newValue: {
              quantity: itemB.quantity,
              unitPrice: itemB.unitPrice,
              laborCost: itemB.laborCost || 0,
              totalPrice: itemB.totalPrice,
            },
            fieldChanges,
            priceDiff: itemB.totalPrice - itemA.totalPrice,
          });
        }
      }
    });

    itemsA.forEach((itemA: any) => {
      const itemB = itemsB.find((b: any) => b.id === itemA.id || b.name === itemA.name);
      if (!itemB) {
        differences.push({
          type: 'removed',
          category: itemA.category,
          name: itemA.name,
          oldValue: {
            quantity: itemA.quantity,
            unit: itemA.unit,
            unitPrice: itemA.unitPrice,
            laborCost: itemA.laborCost || 0,
            totalPrice: itemA.totalPrice,
          },
          newValue: null,
        });
      }
    });

    return differences.sort((a, b) => {
      const order = { modified: 0, added: 1, removed: 2 };
      return order[a.type] - order[b.type];
    });
  }

  async updateBudgetItem(id: string, dto: any) {
    const item = await this.budgetItemRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Budget item not found');

    const updatedItem = {
      ...item,
      ...dto,
      totalPrice: (dto.quantity ?? item.quantity) * (dto.unitPrice ?? item.unitPrice) + (dto.laborCost ?? item.laborCost ?? 0),
    };

    const saved = await this.budgetItemRepo.save(updatedItem);
    await this.updateBudgetTotals(saved.budgetId);
    return saved;
  }

  private async updateBudgetTotals(budgetId: string) {
    const items = await this.budgetItemRepo.find({ where: { budgetId } });
    const laborCost = items.reduce((sum, i) => sum + (i.laborCost || 0), 0);
    const materialCost = items.reduce((sum, i) => sum + (i.totalPrice || 0), 0) - laborCost;
    const totalCost = laborCost + materialCost;

    await this.budgetRepo.update(budgetId, { laborCost, materialCost, totalCost });
  }

  private async saveItems(budgetId: string, items: BudgetItemDto[]) {
    for (const [index, itemDto] of items.entries()) {
      const itemTotal = itemDto.quantity * itemDto.unitPrice + (itemDto.laborCost || 0);
      const item = this.budgetItemRepo.create({
        budgetId,
        name: itemDto.name,
        category: itemDto.category,
        description: itemDto.description,
        quantity: itemDto.quantity,
        unit: itemDto.unit,
        unitPrice: itemDto.unitPrice,
        laborCost: itemDto.laborCost || 0,
        totalPrice: itemTotal,
        sort: index,
      });
      const savedItem = await this.budgetItemRepo.save(item);

      if (itemDto.materials?.length) {
        for (const matDto of itemDto.materials) {
          const matTotal = matDto.quantity * matDto.unitPrice;
          const material = this.materialItemRepo.create({
            budgetItemId: savedItem.id,
            name: matDto.name,
            specification: matDto.specification,
            quantity: matDto.quantity,
            unit: matDto.unit,
            unitPrice: matDto.unitPrice,
            totalPrice: matTotal,
          });
          await this.materialItemRepo.save(material);
        }
      }
    }
  }
}

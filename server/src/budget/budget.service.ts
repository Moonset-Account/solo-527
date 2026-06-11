import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from './budget.entity.js';
import { BudgetItem } from './budget-item.entity.js';
import { MaterialItem } from './material-item.entity.js';
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

    const budget = this.budgetRepo.create({
      projectId,
      version,
      name: dto.name,
      managementFee: dto.managementFee || 0,
      designFee: dto.designFee || 0,
      createdBy: userId,
      remark: dto.remark,
      status: 'draft',
    });

    const savedBudget = await this.budgetRepo.save(budget);

    if (dto.items?.length) {
      await this.saveItems(savedBudget.id, dto.items);
    }

    await this.recalculateTotals(savedBudget.id);
    return this.findOne(savedBudget.id);
  }

  async update(id: string, dto: UpdateBudgetDto) {
    const budget = await this.findOne(id);
    if (budget.status !== 'draft') throw new BadRequestException('Only draft budgets can be updated');

    Object.assign(budget, {
      name: dto.name ?? budget.name,
      managementFee: dto.managementFee ?? budget.managementFee,
      designFee: dto.designFee ?? budget.designFee,
      remark: dto.remark ?? budget.remark,
    });
    await this.budgetRepo.save(budget);

    if (dto.items) {
      await this.budgetItemRepo.delete({ budgetId: id });
      await this.saveItems(id, dto.items);
    }

    await this.recalculateTotals(id);
    return this.findOne(id);
  }

  async submit(id: string, companyId: string) {
    const budget = await this.findOne(id);
    if (budget.status !== 'draft') throw new BadRequestException('Only draft budgets can be submitted');
    budget.status = 'pending_review';
    await this.budgetRepo.save(budget);

    await this.notificationService.notifyRole(companyId, 'owner', 'budget_submitted', `预算 "${budget.name}" 已提交审核`, { budgetId: id });
    return budget;
  }

  async approve(id: string, userRole: string) {
    if (userRole !== 'owner') throw new ForbiddenException('Only owners can approve budgets');
    const budget = await this.findOne(id);
    if (budget.status !== 'pending_review') throw new BadRequestException('Budget is not pending review');
    budget.status = 'approved';
    return this.budgetRepo.save(budget);
  }

  async reject(id: string, userRole: string) {
    if (userRole !== 'owner') throw new ForbiddenException('Only owners can reject budgets');
    const budget = await this.findOne(id);
    if (budget.status !== 'pending_review') throw new BadRequestException('Budget is not pending review');
    budget.status = 'rejected';
    return this.budgetRepo.save(budget);
  }

  async sendToClient(id: string) {
    const budget = await this.findOne(id);
    if (budget.status !== 'approved') throw new BadRequestException('Only approved budgets can be sent to client');
    budget.status = 'sent_to_client';
    return this.budgetRepo.save(budget);
  }

  async compare(id: string, compareVersionId: string) {
    const budget1 = await this.findOne(id);
    const budget2 = await this.findOne(compareVersionId);
    return { budgetA: budget1, budgetB: budget2 };
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
        sort: itemDto.sort ?? index,
      });
      const savedItem = await this.budgetItemRepo.save(item);

      if (itemDto.materials?.length) {
        for (const matDto of itemDto.materials) {
          const matTotal = matDto.quantity * matDto.unitPrice;
          const material = this.materialItemRepo.create({
            budgetItemId: savedItem.id,
            name: matDto.name,
            brand: matDto.brand,
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

  private async recalculateTotals(budgetId: string) {
    const items = await this.budgetItemRepo.find({ where: { budgetId } });
    const subtotal = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    const budget = await this.budgetRepo.findOne({ where: { id: budgetId } });
    if (!budget) return;
    const managementFee = Number(budget.managementFee);
    const designFee = Number(budget.designFee);
    const taxRate = 0.06;
    const taxAmount = (subtotal + managementFee + designFee) * taxRate;
    const totalAmount = subtotal + managementFee + designFee + taxAmount;

    await this.budgetRepo.update(budgetId, {
      subtotal,
      taxAmount,
      totalAmount,
    });
  }
}

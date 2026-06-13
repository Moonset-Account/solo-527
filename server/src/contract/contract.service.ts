import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from './contract.entity.js';
import { Budget } from '../budget/budget.entity.js';
import { Project } from '../project/project.entity.js';
import { CreateContractDto, UpdateContractDto } from './dto.js';
import { NotificationService } from '../notification/notification.service.js';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
    @InjectRepository(Budget)
    private budgetRepo: Repository<Budget>,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    private notificationService: NotificationService,
  ) {}

  async findByProject(projectId: string) {
    return this.contractRepo.findOne({ where: { projectId } });
  }

  async create(projectId: string, dto: CreateContractDto) {
    const budget = await this.budgetRepo.findOne({ where: { id: dto.budgetId } });
    if (!budget) throw new NotFoundException('Budget not found');
    if (budget.status !== 'approved') throw new BadRequestException('Only approved budgets can create contracts');

    const existing = await this.contractRepo.findOne({ where: { projectId } });
    if (existing) throw new BadRequestException('Contract already exists for this project');

    const contract = this.contractRepo.create({
      projectId,
      budgetId: dto.budgetId,
      name: dto.name,
      content: dto.content,
      totalAmount: budget.totalCost,
      status: 'draft',
    });
    return this.contractRepo.save(contract);
  }

  async update(id: string, dto: UpdateContractDto) {
    const contract = await this.contractRepo.findOne({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.status === 'signed') throw new BadRequestException('Signed contracts cannot be updated');
    Object.assign(contract, dto);
    return this.contractRepo.save(contract);
  }

  async send(id: string) {
    const contract = await this.contractRepo.findOne({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.status !== 'draft') throw new BadRequestException('Only draft contracts can be sent');
    contract.status = 'sent';
    contract.sentAt = new Date();
    return this.contractRepo.save(contract);
  }

  async sign(id: string, ip: string) {
    const contract = await this.contractRepo.findOne({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.status !== 'sent') throw new BadRequestException('Contract must be sent before signing');
    contract.status = 'signed';
    contract.signedAt = new Date();
    contract.signedIp = ip;
    const saved = await this.contractRepo.save(contract);

    await this.projectRepo.update(contract.projectId, {
      status: 'contracted',
      updatedAt: new Date(),
    });

    const project = await this.projectRepo.findOne({ where: { id: contract.projectId } });
    if (project) {
      await this.notificationService.notifyRole(
        project.companyId,
        'owner',
        'contract_signed',
        `合同已签署 - ${project.name}`,
        { projectId: contract.projectId, contractId: id }
      );
      await this.notificationService.notifyRole(
        project.companyId,
        'worker',
        'contract_signed',
        `合同已签署，可以开始施工 - ${project.name}`,
        { projectId: contract.projectId, contractId: id }
      );
    }

    return saved;
  }
}

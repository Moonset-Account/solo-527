import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from './contract.entity.js';
import { Budget } from '../budget/budget.entity.js';
import { CreateContractDto, UpdateContractDto } from './dto.js';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
    @InjectRepository(Budget)
    private budgetRepo: Repository<Budget>,
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
      totalAmount: budget.totalAmount,
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
    return this.contractRepo.save(contract);
  }
}

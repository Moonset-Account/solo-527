import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../../entities/contract.entity';
import { ApprovalLog } from '../../entities/approval-log.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(ApprovalLog)
    private approvalLogRepository: Repository<ApprovalLog>,
  ) {}

  async findAll(query: any) {
    const { status, page = 1, pageSize = 20 } = query;
    const where: any = {};

    if (status) where.status = status;

    const [data, total] = await this.contractRepository.findAndCount({
      where,
      relations: ['quote', 'quote.demand', 'approvalLogs', 'approvalLogs.approver'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['quote', 'quote.demand', 'quote.items', 'approvalLogs', 'approvalLogs.approver'],
    });
    if (!contract) {
      throw new NotFoundException('合同不存在');
    }
    return contract;
  }

  async create(dto: any) {
    const existing = await this.contractRepository.findOne({
      where: { quoteId: dto.quoteId },
    });
    if (existing) {
      return existing;
    }

    const contract = this.contractRepository.create({
      quoteId: dto.quoteId,
      status: 'draft',
    });
    return this.contractRepository.save(contract);
  }

  async submit(id: string, user: User, comment?: string) {
    const contract = await this.findOne(id);
    if (contract.status !== 'draft') {
      throw new BadRequestException('只有草稿状态的合同可以提交审批');
    }

    contract.status = 'pending';
    await this.contractRepository.save(contract);

    const log = this.approvalLogRepository.create({
      contractId: id,
      approverId: user.id,
      action: 'submit',
      comment,
    });
    await this.approvalLogRepository.save(log);

    return this.findOne(id);
  }

  async approve(id: string, user: User, comment?: string) {
    const contract = await this.findOne(id);
    if (contract.status !== 'pending') {
      throw new BadRequestException('只有待审批状态的合同可以审批');
    }

    contract.status = 'approved';
    await this.contractRepository.save(contract);

    const log = this.approvalLogRepository.create({
      contractId: id,
      approverId: user.id,
      action: 'approve',
      comment,
    });
    await this.approvalLogRepository.save(log);

    return this.findOne(id);
  }

  async reject(id: string, user: User, comment?: string) {
    const contract = await this.findOne(id);
    if (contract.status !== 'pending') {
      throw new BadRequestException('只有待审批状态的合同可以驳回');
    }

    contract.status = 'rejected';
    await this.contractRepository.save(contract);

    const log = this.approvalLogRepository.create({
      contractId: id,
      approverId: user.id,
      action: 'reject',
      comment,
    });
    await this.approvalLogRepository.save(log);

    return this.findOne(id);
  }
}

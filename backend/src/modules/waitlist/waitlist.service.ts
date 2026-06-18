import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Waitlist } from './waitlist.entity';
import { WaitlistStatus } from '../../common/enums/waitlist-status.enum';
import { OperationLogService } from '../../common/services/operation-log.service';

@Injectable()
export class WaitlistService {
  constructor(
    @InjectRepository(Waitlist)
    private waitlistRepository: Repository<Waitlist>,
    private operationLogService: OperationLogService,
  ) {}

  findAll(
    status?: WaitlistStatus,
    counselorId?: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Waitlist[]; total: number }> {
    const where: any = {};
    if (status) where.status = status;
    if (counselorId) where.counselorId = counselorId;

    return this.waitlistRepository.findAndCount({
      where,
      relations: ['counselor'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    }).then(([data, total]) => ({ data, total }));
  }

  findOne(id: string): Promise<Waitlist | null> {
    return this.waitlistRepository.findOne({
      where: { id },
      relations: ['counselor'],
    });
  }

  create(waitlist: Partial<Waitlist>): Promise<Waitlist> {
    const newWaitlist = this.waitlistRepository.create({
      ...waitlist,
      status: WaitlistStatus.WAITING,
    });
    return this.waitlistRepository.save(newWaitlist);
  }

  async update(
    id: string,
    waitlist: Partial<Waitlist>,
    operatorId?: string,
    operatorName?: string,
    ipAddress?: string,
  ): Promise<Waitlist | null> {
    const updateData: Partial<Waitlist> = { ...waitlist };
    if (operatorId && operatorName) {
      updateData.lastOperatorId = operatorId;
      updateData.lastOperatorName = operatorName;
    }
    await this.waitlistRepository.update(id, updateData);
    const result = await this.findOne(id);

    if (operatorId && operatorName) {
      this.operationLogService.log(
        operatorId,
        operatorName,
        'update',
        'waitlist',
        id,
        { changes: Object.keys(waitlist).join(', ') },
        ipAddress,
      );
    }

    return result;
  }

  async updateStatus(
    id: string,
    status: WaitlistStatus,
    operatorId?: string,
    operatorName?: string,
    ipAddress?: string,
  ): Promise<Waitlist | null> {
    const updateData: Partial<Waitlist> = { status };
    if (operatorId && operatorName) {
      updateData.lastOperatorId = operatorId;
      updateData.lastOperatorName = operatorName;
    }
    await this.waitlistRepository.update(id, updateData);
    const result = await this.findOne(id);

    if (operatorId && operatorName) {
      this.operationLogService.log(
        operatorId,
        operatorName,
        'status_change',
        'waitlist',
        id,
        { newStatus: status },
        ipAddress,
      );
    }

    return result;
  }

  async remove(
    id: string,
    operatorId?: string,
    operatorName?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.waitlistRepository.delete(id);

    if (operatorId && operatorName) {
      this.operationLogService.log(
        operatorId,
        operatorName,
        'delete',
        'waitlist',
        id,
        {},
        ipAddress,
      );
    }
  }

  async getWaitingCount(counselorId?: string): Promise<number> {
    const where: any = { status: WaitlistStatus.WAITING };
    if (counselorId) where.counselorId = counselorId;
    return this.waitlistRepository.count({ where });
  }
}

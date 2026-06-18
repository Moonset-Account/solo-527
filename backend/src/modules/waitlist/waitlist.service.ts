import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Waitlist } from './waitlist.entity';
import { WaitlistStatus } from '../../common/enums/waitlist-status.enum';

@Injectable()
export class WaitlistService {
  constructor(
    @InjectRepository(Waitlist)
    private waitlistRepository: Repository<Waitlist>,
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
  ): Promise<Waitlist | null> {
    const updateData: Partial<Waitlist> = { ...waitlist };
    if (operatorId && operatorName) {
      updateData.lastOperatorId = operatorId;
      updateData.lastOperatorName = operatorName;
    }
    await this.waitlistRepository.update(id, updateData);
    return this.findOne(id);
  }

  async updateStatus(
    id: string,
    status: WaitlistStatus,
    operatorId?: string,
    operatorName?: string,
  ): Promise<Waitlist | null> {
    return this.update(id, { status }, operatorId, operatorName);
  }

  async remove(id: string): Promise<void> {
    await this.waitlistRepository.delete(id);
  }

  async getWaitingCount(counselorId?: string): Promise<number> {
    const where: any = { status: WaitlistStatus.WAITING };
    if (counselorId) where.counselorId = counselorId;
    return this.waitlistRepository.count({ where });
  }
}

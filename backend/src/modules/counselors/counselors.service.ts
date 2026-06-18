import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Counselor } from './counselor.entity';

@Injectable()
export class CounselorsService {
  constructor(
    @InjectRepository(Counselor)
    private counselorsRepository: Repository<Counselor>,
  ) {}

  findAll(activeOnly = false): Promise<Counselor[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.counselorsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  findOne(id: string): Promise<Counselor | null> {
    return this.counselorsRepository.findOneBy({ id });
  }

  create(counselor: Partial<Counselor>): Promise<Counselor> {
    const newCounselor = this.counselorsRepository.create(counselor);
    return this.counselorsRepository.save(newCounselor);
  }

  async update(id: string, counselor: Partial<Counselor>): Promise<Counselor | null> {
    await this.counselorsRepository.update(id, counselor);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.counselorsRepository.delete(id);
  }
}

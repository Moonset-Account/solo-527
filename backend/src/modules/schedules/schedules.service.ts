import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Schedule } from '../../entities/schedule.entity';
import { ProcessingRecord } from '../../entities/processing-record.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private schedulesRepository: Repository<Schedule>,
    @InjectRepository(ProcessingRecord)
    private processingRecordsRepository: Repository<ProcessingRecord>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createScheduleDto: any, userId?: string) {
    const { counselorId, date, startTime, endTime } = createScheduleDto;

    const conflict = await this.schedulesRepository
      .createQueryBuilder('schedule')
      .where('schedule.counselorId = :counselorId', { counselorId })
      .andWhere('schedule.date = :date', { date })
      .andWhere(
        '((schedule.startTime < :endTime AND schedule.endTime > :startTime))',
        { startTime, endTime }
      )
      .getOne();

    if (conflict) {
      throw new BadRequestException('该时段已有排班');
    }

    const schedule = this.schedulesRepository.create({
      ...createScheduleDto,
      processedBy: userId,
      processedAt: new Date(),
    });
    const saved = await this.schedulesRepository.save(schedule) as unknown as Schedule;

    await this.processingRecordsRepository.save({
      type: 'schedule_update',
      relatedId: saved.id,
      relatedType: 'schedule',
      operatorId: userId,
      action: '创建排班',
      remarks: `${date} ${startTime}-${endTime}`,
    });

    return saved;
  }

  async batchCreate(batchDto: any, userId?: string) {
    const { counselorId, dates, startTime, endTime, status } = batchDto;
    const results = [];

    for (const date of dates) {
      try {
        const schedule = this.schedulesRepository.create({
          counselorId,
          date,
          startTime,
          endTime,
          status: status || 'available',
          processedBy: userId,
          processedAt: new Date(),
        });
        const saved = await this.schedulesRepository.save(schedule);
        results.push(saved);
      } catch (e) {
        continue;
      }
    }

    await this.processingRecordsRepository.save({
      type: 'schedule_update',
      relatedType: 'schedule',
      operatorId: userId,
      action: '批量创建排班',
      remarks: `共${dates.length}天`,
    });

    return results;
  }

  async findAll(page = 1, pageSize = 10, filters: any = {}) {
    const query = this.schedulesRepository.createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.counselor', 'counselor');

    if (filters.counselorId) {
      query.andWhere('schedule.counselorId = :counselorId', { counselorId: filters.counselorId });
    }
    if (filters.startDate) {
      query.andWhere('schedule.date >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      query.andWhere('schedule.date <= :endDate', { endDate: filters.endDate });
    }
    if (filters.status) {
      query.andWhere('schedule.status = :status', { status: filters.status });
    }

    query.orderBy('schedule.date', 'ASC')
      .addOrderBy('schedule.startTime', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await query.getManyAndCount();
    const processorMap = new Map();
    const processorIds = [...new Set(items.map(i => i.processedBy).filter(Boolean))];

    if (processorIds.length > 0) {
      const processors = await this.usersRepository.findByIds(processorIds);
      processors.forEach(p => processorMap.set(p.id, p));
    }

    return {
      items: items.map(item => ({
        ...item,
        counselor: item.counselor ? { id: item.counselor.id, name: item.counselor.name } : null,
        processedByUser: item.processedBy && processorMap.get(item.processedBy)
          ? { id: processorMap.get(item.processedBy).id, name: processorMap.get(item.processedBy).name, role: processorMap.get(item.processedBy).role }
          : null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async findByCounselorAndDate(counselorId: string, date: string) {
    const schedules = await this.schedulesRepository.find({
      where: { counselorId, date },
      order: { startTime: 'ASC' },
    });
    return schedules;
  }

  async findAvailable(counselorId: string, startDate: string, endDate: string) {
    const schedules = await this.schedulesRepository.find({
      where: {
        counselorId,
        status: 'available',
      },
      order: { date: 'ASC', startTime: 'ASC' },
    });

    const filtered = schedules.filter(s => {
      return s.date >= startDate && s.date <= endDate;
    });

    return filtered;
  }

  async findOne(id: string) {
    const schedule = await this.schedulesRepository.findOne({
      where: { id },
      relations: ['counselor'],
    });
    if (!schedule) {
      throw new NotFoundException('排班不存在');
    }

    let processedByUser = null;
    if (schedule.processedBy) {
      const user = await this.usersRepository.findOne({ where: { id: schedule.processedBy } });
      if (user) {
        processedByUser = { id: user.id, name: user.name, role: user.role };
      }
    }

    return {
      ...schedule,
      counselor: schedule.counselor ? { id: schedule.counselor.id, name: schedule.counselor.name } : null,
      processedByUser,
    };
  }

  async update(id: string, updateScheduleDto: any, userId?: string) {
    const schedule = await this.findOne(id);
    const beforeState = JSON.stringify(schedule);

    await this.schedulesRepository.update(id, {
      ...updateScheduleDto,
      processedBy: userId,
      processedAt: new Date(),
    });
    const updated = await this.findOne(id);

    await this.processingRecordsRepository.save({
      type: 'schedule_update',
      relatedId: id,
      relatedType: 'schedule',
      operatorId: userId,
      action: '更新排班',
      beforeState,
      afterState: JSON.stringify(updated),
    });

    return updated;
  }

  async remove(id: string, userId?: string) {
    const result = await this.schedulesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('排班不存在');
    }

    await this.processingRecordsRepository.save({
      type: 'schedule_update',
      relatedId: id,
      relatedType: 'schedule',
      operatorId: userId,
      action: '删除排班',
    });

    return { success: true };
  }
}

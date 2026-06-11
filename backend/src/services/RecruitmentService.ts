import { AppDataSource } from '../database/data-source';
import { RecruitmentCycle, ProcessingRecord } from '../entities/Recruitment';
import { notificationService } from './NotificationService';
import { Resume } from '../entities/Resume';

export class RecruitmentService {
  private cycleRepository = AppDataSource.getRepository(RecruitmentCycle);
  private processingRecordRepository = AppDataSource.getRepository(ProcessingRecord);
  private resumeRepository = AppDataSource.getRepository(Resume);

  async createCycle(params: {
    name: string;
    startDate: Date;
    endDate: Date;
    description?: string;
    milestones?: { name: string; date: Date; description: string }[];
  }): Promise<RecruitmentCycle> {
    const cycle = this.cycleRepository.create(params);
    return await this.cycleRepository.save(cycle);
  }

  async getCycles(status?: string): Promise<RecruitmentCycle[]> {
    const queryBuilder = this.cycleRepository
      .createQueryBuilder('cycle')
      .orderBy('cycle.startDate', 'DESC');

    if (status) {
      queryBuilder.where('cycle.status = :status', { status });
    }

    const cycles = await queryBuilder.getMany();
    
    for (const cycle of cycles) {
      const resumes = await this.resumeRepository.find({
        where: { recruiterCycle: cycle.name },
      });
      cycle.resumeCount = resumes.length;
      cycle.hireCount = resumes.filter(r => r.status === 'hired').length;
    }

    return cycles;
  }

  async getCycleById(id: string): Promise<RecruitmentCycle | null> {
    return await this.cycleRepository.findOneBy({ id });
  }

  async updateCycle(id: string, params: Partial<RecruitmentCycle>): Promise<RecruitmentCycle | null> {
    const cycle = await this.cycleRepository.findOneBy({ id });
    if (!cycle) return null;

    Object.assign(cycle, params);
    return await this.cycleRepository.save(cycle);
  }

  async checkCycleMilestones(): Promise<void> {
    const cycles = await this.cycleRepository.find({ where: { status: 'active' } });
    const now = new Date();

    for (const cycle of cycles) {
      if (!cycle.milestones) continue;

      for (const milestone of cycle.milestones) {
        const milestoneDate = new Date(milestone.date);
        const daysUntil = Math.ceil((milestoneDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil >= 0 && daysUntil <= 7) {
          const resumes = await this.resumeRepository.find({
            where: { recruiterCycle: cycle.name, status: 'interview' },
          });

          for (const resume of resumes) {
            await notificationService.sendDeadlineReminder(
              resume.id,
              resume.candidateName,
              milestone.name,
              milestoneDate
            );
          }
        }
      }
    }
  }

  async getAllProcessingRecords(params: {
    resumeId?: string;
    actionType?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: ProcessingRecord[]; total: number }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.processingRecordRepository
      .createQueryBuilder('record')
      .orderBy('record.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    if (params.resumeId) {
      queryBuilder.andWhere('record.resumeId = :resumeId', { resumeId: params.resumeId });
    }
    if (params.actionType) {
      queryBuilder.andWhere('record.actionType = :actionType', { actionType: params.actionType });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    return { items, total };
  }

  async addProcessingRecord(params: {
    resumeId: string;
    candidateName: string;
    actionType: string;
    actionDetail: string;
    operatorId: string;
    operatorName: string;
    remarks?: string;
    metadata?: Record<string, any>;
  }): Promise<ProcessingRecord> {
    const record = this.processingRecordRepository.create(params);
    return await this.processingRecordRepository.save(record);
  }
}

export const recruitmentService = new RecruitmentService();

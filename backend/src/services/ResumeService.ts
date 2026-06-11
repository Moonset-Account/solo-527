import { AppDataSource } from '../database/data-source';
import { Resume, ResumeStatus, ResumeStatusLog } from '../entities/Resume';
import { ProcessingRecord } from '../entities/Recruitment';
import { notificationService } from './NotificationService';

export class ResumeService {
  private resumeRepository = AppDataSource.getRepository(Resume);
  private statusLogRepository = AppDataSource.getRepository(ResumeStatusLog);
  private processingRecordRepository = AppDataSource.getRepository(ProcessingRecord);

  async submitResume(params: {
    candidateId: string;
    candidateName: string;
    email?: string;
    phone?: string;
    school?: string;
    major?: string;
    degree?: string;
    graduationYear?: number;
    skills?: string;
    experience?: string;
    projects?: string;
    positionApplied?: string;
    recruiterCycle?: string;
  }): Promise<Resume> {
    const resume = this.resumeRepository.create({
      ...params,
      status: 'submitted',
    });

    const saved = await this.resumeRepository.save(resume);

    await this.addProcessingRecord({
      resumeId: saved.id,
      candidateName: saved.candidateName,
      actionType: 'submit',
      actionDetail: '简历提交',
      operatorId: params.candidateId,
      operatorName: params.candidateName,
      remarks: '候选人提交简历',
    });

    const hrUsers = await AppDataSource.getRepository('User').find({
      where: { role: 'hr', isActive: true },
    });

    for (const hr of hrUsers) {
      await notificationService.sendResumeStatusNotification(
        saved.id,
        saved.candidateName,
        'submitted',
        hr.id
      );
    }

    return saved;
  }

  async getResumes(params: {
    status?: ResumeStatus;
    positionApplied?: string;
    recruiterCycle?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Resume[]; total: number }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.resumeRepository
      .createQueryBuilder('resume')
      .orderBy('resume.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    if (params.status) {
      queryBuilder.andWhere('resume.status = :status', { status: params.status });
    }
    if (params.positionApplied) {
      queryBuilder.andWhere('resume.positionApplied = :position', { position: params.positionApplied });
    }
    if (params.recruiterCycle) {
      queryBuilder.andWhere('resume.recruiterCycle = :cycle', { cycle: params.recruiterCycle });
    }
    if (params.keyword) {
      queryBuilder.andWhere(
        '(resume.candidateName LIKE :keyword OR resume.school LIKE :keyword OR resume.major LIKE :keyword)',
        { keyword: `%${params.keyword}%` }
      );
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    return { items, total };
  }

  async getResumeById(id: string): Promise<Resume | null> {
    return await this.resumeRepository.findOneBy({ id });
  }

  async getResumesByCandidate(candidateId: string): Promise<Resume[]> {
    return await this.resumeRepository.find({
      where: { candidateId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateResumeStatus(
    resumeId: string,
    newStatus: ResumeStatus,
    operatorId: string,
    operatorName: string,
    reason?: string
  ): Promise<Resume | null> {
    const resume = await this.resumeRepository.findOneBy({ id: resumeId });
    if (!resume) return null;

    const oldStatus = resume.status;
    resume.status = newStatus;
    const saved = await this.resumeRepository.save(resume);

    const statusLog = this.statusLogRepository.create({
      resumeId,
      fromStatus: oldStatus,
      toStatus: newStatus,
      operatorId,
      operatorName,
      reason,
    });
    await this.statusLogRepository.save(statusLog);

    await this.addProcessingRecord({
      resumeId,
      candidateName: resume.candidateName,
      actionType: 'status_change',
      actionDetail: `状态从 ${oldStatus} 变更为 ${newStatus}`,
      operatorId,
      operatorName,
      remarks: reason,
    });

    await notificationService.sendResumeStatusNotification(
      resumeId,
      resume.candidateName,
      newStatus,
      resume.candidateId
    );

    return saved;
  }

  async updateResume(id: string, params: Partial<Resume>): Promise<Resume | null> {
    const resume = await this.resumeRepository.findOneBy({ id });
    if (!resume) return null;

    Object.assign(resume, params);
    return await this.resumeRepository.save(resume);
  }

  async getStatusLogs(resumeId: string): Promise<ResumeStatusLog[]> {
    return await this.statusLogRepository.find({
      where: { resumeId },
      order: { createdAt: 'DESC' },
    });
  }

  async getProcessingRecords(resumeId: string): Promise<ProcessingRecord[]> {
    return await this.processingRecordRepository.find({
      where: { resumeId },
      order: { createdAt: 'DESC' },
    });
  }

  private async addProcessingRecord(params: {
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

  async getResumeStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    todayNew: number;
  }> {
    const allResumes = await this.resumeRepository.find();
    
    const byStatus: Record<string, number> = {};
    let todayNew = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const resume of allResumes) {
      byStatus[resume.status] = (byStatus[resume.status] || 0) + 1;
      if (resume.createdAt >= today) {
        todayNew++;
      }
    }

    return {
      total: allResumes.length,
      byStatus,
      todayNew,
    };
  }
}

export const resumeService = new ResumeService();

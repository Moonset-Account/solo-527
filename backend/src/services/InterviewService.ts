import { AppDataSource } from '../database/data-source';
import { Interview, InterviewerSchedule } from '../entities/Interview';
import { notificationService } from './NotificationService';

export class InterviewService {
  private interviewRepository = AppDataSource.getRepository(Interview);
  private scheduleRepository = AppDataSource.getRepository(InterviewerSchedule);

  async createInterview(params: {
    resumeId: string;
    candidateName: string;
    position: string;
    interviewerId?: string;
    interviewerName?: string;
    scheduledTime?: Date;
    durationMinutes?: number;
    location?: string;
    meetingLink?: string;
    interviewType?: string;
    round?: number;
  }): Promise<Interview> {
    const interview = this.interviewRepository.create({
      ...params,
      status: 'scheduled',
    });

    const saved = await this.interviewRepository.save(interview);

    if (params.interviewerId && params.scheduledTime) {
      await notificationService.sendInterviewScheduleNotification(
        saved.id,
        saved.candidateName,
        params.interviewerName || '',
        params.scheduledTime
      );
    }

    return saved;
  }

  async getInterviews(params: {
    interviewerId?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Interview[]; total: number }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.interviewRepository
      .createQueryBuilder('interview')
      .orderBy('interview.scheduledTime', 'DESC')
      .skip(skip)
      .take(pageSize);

    if (params.interviewerId) {
      queryBuilder.andWhere('interview.interviewerId = :interviewerId', { interviewerId: params.interviewerId });
    }
    if (params.status) {
      queryBuilder.andWhere('interview.status = :status', { status: params.status });
    }
    if (params.dateFrom) {
      queryBuilder.andWhere('interview.scheduledTime >= :dateFrom', { dateFrom: params.dateFrom });
    }
    if (params.dateTo) {
      queryBuilder.andWhere('interview.scheduledTime <= :dateTo', { dateTo: params.dateTo });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    return { items, total };
  }

  async getInterviewById(id: string): Promise<Interview | null> {
    return await this.interviewRepository.findOneBy({ id });
  }

  async updateInterview(id: string, params: Partial<Interview>): Promise<Interview | null> {
    const interview = await this.interviewRepository.findOneBy({ id });
    if (!interview) return null;

    Object.assign(interview, params);
    return await this.interviewRepository.save(interview);
  }

  async completeInterview(params: {
    id: string;
    feedback: string;
    score: number;
    abilityAssessment: string;
    notes?: string;
  }): Promise<Interview | null> {
    const interview = await this.interviewRepository.findOneBy({ id: params.id });
    if (!interview) return null;

    interview.status = 'completed';
    interview.feedback = params.feedback;
    interview.score = params.score;
    interview.abilityAssessment = params.abilityAssessment;
    if (params.notes !== undefined) {
      interview.notes = params.notes;
    }

    return await this.interviewRepository.save(interview);
  }

  async getInterviewerSchedule(interviewerId: string, date: Date): Promise<InterviewerSchedule | null> {
    return await this.scheduleRepository.findOne({
      where: { interviewerId, date: date as any },
    });
  }

  async createOrUpdateSchedule(params: {
    interviewerId: string;
    interviewerName: string;
    date: Date;
    timeSlots: { start: string; end: string; available: boolean; interviewId?: string }[];
  }): Promise<InterviewerSchedule> {
    let schedule = await this.scheduleRepository.findOne({
      where: { interviewerId: params.interviewerId, date: params.date as any },
    });

    if (schedule) {
      schedule.timeSlots = params.timeSlots;
    } else {
      schedule = this.scheduleRepository.create(params);
    }

    return await this.scheduleRepository.save(schedule);
  }

  async getInterviewerInterviews(interviewerId: string): Promise<Interview[]> {
    return await this.interviewRepository.find({
      where: { interviewerId },
      order: { scheduledTime: 'DESC' },
    });
  }

  async getInterviewQualityStats(): Promise<{
    total: number;
    completed: number;
    avgScore: number;
    scoreDistribution: Record<string, number>;
  }> {
    const interviews = await this.interviewRepository.find({
      where: { status: 'completed' },
    });

    const scoreDistribution: Record<string, number> = {
      '0-59': 0,
      '60-69': 0,
      '70-79': 0,
      '80-89': 0,
      '90-100': 0,
    };

    let totalScore = 0;

    for (const interview of interviews) {
      if (interview.score !== null && interview.score !== undefined) {
        totalScore += interview.score;
        if (interview.score < 60) scoreDistribution['0-59']++;
        else if (interview.score < 70) scoreDistribution['60-69']++;
        else if (interview.score < 80) scoreDistribution['70-79']++;
        else if (interview.score < 90) scoreDistribution['80-89']++;
        else scoreDistribution['90-100']++;
      }
    }

    return {
      total: interviews.length,
      completed: interviews.length,
      avgScore: interviews.length > 0 ? totalScore / interviews.length : 0,
      scoreDistribution,
    };
  }
}

export const interviewService = new InterviewService();

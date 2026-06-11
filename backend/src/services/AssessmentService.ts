import { AppDataSource } from '../database/data-source';
import { Assessment, ScoringCriterion } from '../entities/Assessment';
import { notificationService } from './NotificationService';

export class AssessmentService {
  private assessmentRepository = AppDataSource.getRepository(Assessment);
  private scoringCriterionRepository = AppDataSource.getRepository(ScoringCriterion);

  async createAssessment(params: {
    resumeId: string;
    candidateName: string;
    questionBankId?: string;
    questionBankName?: string;
  }): Promise<Assessment> {
    const assessment = this.assessmentRepository.create({
      ...params,
      status: 'pending',
    });

    return await this.assessmentRepository.save(assessment);
  }

  async getAssessments(params: {
    resumeId?: string;
    status?: string;
    hasDispute?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Assessment[]; total: number }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.assessmentRepository
      .createQueryBuilder('assessment')
      .orderBy('assessment.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    if (params.resumeId) {
      queryBuilder.andWhere('assessment.resumeId = :resumeId', { resumeId: params.resumeId });
    }
    if (params.status) {
      queryBuilder.andWhere('assessment.status = :status', { status: params.status });
    }
    if (params.hasDispute !== undefined) {
      queryBuilder.andWhere('assessment.hasDispute = :hasDispute', { hasDispute: params.hasDispute });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    return { items, total };
  }

  async getAssessmentById(id: string): Promise<Assessment | null> {
    return await this.assessmentRepository.findOneBy({ id });
  }

  async startAssessment(id: string): Promise<Assessment | null> {
    const assessment = await this.assessmentRepository.findOneBy({ id });
    if (!assessment) return null;

    assessment.status = 'in_progress';
    assessment.startedAt = new Date();

    return await this.assessmentRepository.save(assessment);
  }

  async submitAssessment(id: string, answers: { questionId: string; answer: string }[]): Promise<Assessment | null> {
    const assessment = await this.assessmentRepository.findOneBy({ id });
    if (!assessment) return null;

    assessment.status = 'submitted';
    assessment.submittedAt = new Date();
    assessment.answers = answers.map(a => ({ ...a, score: 0 }));

    return await this.assessmentRepository.save(assessment);
  }

  async gradeAssessment(params: {
    id: string;
    scores: { questionId: string; score: number }[];
    totalScore: number;
    earnedScore: number;
    abilityScores: { ability: string; score: number; maxScore: number }[];
    overallFeedback: string;
    gradedById: string;
    gradedByName: string;
  }): Promise<Assessment | null> {
    const assessment = await this.assessmentRepository.findOneBy({ id: params.id });
    if (!assessment) return null;

    if (assessment.answers) {
      const scoreMap = new Map(params.scores.map(s => [s.questionId, s.score]));
      assessment.answers = assessment.answers.map(a => ({
        ...a,
        score: scoreMap.get(a.questionId) || 0,
        gradedBy: params.gradedByName,
      }));
    }

    assessment.status = 'graded';
    assessment.totalScore = params.totalScore;
    assessment.earnedScore = params.earnedScore;
    assessment.abilityScores = params.abilityScores;
    assessment.overallFeedback = params.overallFeedback;
    assessment.gradedById = params.gradedById;
    assessment.gradedByName = params.gradedByName;
    assessment.gradedAt = new Date();

    const saved = await this.assessmentRepository.save(assessment);

    await notificationService.sendResumeStatusNotification(
      assessment.resumeId,
      assessment.candidateName,
      'written_test',
      ''
    );

    return saved;
  }

  async raiseDispute(assessmentId: string, reason: string): Promise<Assessment | null> {
    const assessment = await this.assessmentRepository.findOneBy({ id: assessmentId });
    if (!assessment) return null;

    assessment.hasDispute = true;
    assessment.disputeReason = reason;
    assessment.isDisputeResolved = false;

    const saved = await this.assessmentRepository.save(assessment);

    await notificationService.sendScoreDisputeNotification(
      assessmentId,
      reason,
      assessment.candidateName
    );

    return saved;
  }

  async resolveDispute(assessmentId: string, resolved: boolean, resolution?: string): Promise<Assessment | null> {
    const assessment = await this.assessmentRepository.findOneBy({ id: assessmentId });
    if (!assessment) return null;

    assessment.isDisputeResolved = true;
    if (!resolved) {
      assessment.hasDispute = false;
    }

    return await this.assessmentRepository.save(assessment);
  }

  async createScoringCriterion(params: {
    name: string;
    category: string;
    maxScore?: number;
    passScore?: number;
    dimensions: { name: string; weight: number; description: string; scoringGuide: string }[];
    description?: string;
  }): Promise<ScoringCriterion> {
    const criterion = this.scoringCriterionRepository.create(params);
    return await this.scoringCriterionRepository.save(criterion);
  }

  async getScoringCriteria(category?: string): Promise<ScoringCriterion[]> {
    const queryBuilder = this.scoringCriterionRepository
      .createQueryBuilder('criterion')
      .where('criterion.isActive = :active', { active: true })
      .orderBy('criterion.createdAt', 'DESC');

    if (category) {
      queryBuilder.andWhere('criterion.category = :category', { category });
    }

    return await queryBuilder.getMany();
  }

  async getScoringCriterionById(id: string): Promise<ScoringCriterion | null> {
    return await this.scoringCriterionRepository.findOneBy({ id });
  }

  async updateScoringCriterion(id: string, params: Partial<ScoringCriterion>): Promise<ScoringCriterion | null> {
    const criterion = await this.scoringCriterionRepository.findOneBy({ id });
    if (!criterion) return null;

    Object.assign(criterion, params);
    return await this.scoringCriterionRepository.save(criterion);
  }
}

export const assessmentService = new AssessmentService();

import { AppDataSource } from '../database/data-source';
import { Question, QuestionBank, QuestionType, DifficultyLevel } from '../entities/Question';

export class QuestionService {
  private questionRepository = AppDataSource.getRepository(Question);
  private questionBankRepository = AppDataSource.getRepository(QuestionBank);

  async createQuestion(params: {
    type: QuestionType;
    category: string;
    difficulty: DifficultyLevel;
    content: string;
    options?: string[];
    correctAnswer?: string;
    defaultScore?: number;
    scoringCriteria?: string;
    knowledgePoints?: string;
    createdBy: string;
  }): Promise<Question> {
    const question = this.questionRepository.create(params);
    return await this.questionRepository.save(question);
  }

  async getQuestions(params: {
    category?: string;
    difficulty?: DifficultyLevel;
    type?: QuestionType;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: Question[]; total: number }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.questionRepository
      .createQueryBuilder('question')
      .where('question.isActive = :active', { active: true })
      .orderBy('question.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    if (params.category) {
      queryBuilder.andWhere('question.category = :category', { category: params.category });
    }
    if (params.difficulty) {
      queryBuilder.andWhere('question.difficulty = :difficulty', { difficulty: params.difficulty });
    }
    if (params.type) {
      queryBuilder.andWhere('question.type = :type', { type: params.type });
    }
    if (params.keyword) {
      queryBuilder.andWhere('question.content LIKE :keyword', { keyword: `%${params.keyword}%` });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    return { items, total };
  }

  async getQuestionById(id: string): Promise<Question | null> {
    return await this.questionRepository.findOneBy({ id });
  }

  async updateQuestion(id: string, params: Partial<Question>): Promise<Question | null> {
    const question = await this.questionRepository.findOneBy({ id });
    if (!question) return null;

    Object.assign(question, params);
    return await this.questionRepository.save(question);
  }

  async deleteQuestion(id: string): Promise<boolean> {
    const question = await this.questionRepository.findOneBy({ id });
    if (!question) return false;

    question.isActive = false;
    await this.questionRepository.save(question);
    return true;
  }

  async createQuestionBank(params: {
    name: string;
    description?: string;
    category: string;
    questionIds?: string[];
    totalScore?: number;
    passScore?: number;
    durationMinutes?: number;
  }): Promise<QuestionBank> {
    const bank = this.questionBankRepository.create(params);
    return await this.questionBankRepository.save(bank);
  }

  async getQuestionBanks(params: {
    category?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items: QuestionBank[]; total: number }> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.questionBankRepository
      .createQueryBuilder('bank')
      .where('bank.isActive = :active', { active: true })
      .orderBy('bank.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    if (params.category) {
      queryBuilder.andWhere('bank.category = :category', { category: params.category });
    }

    const [items, total] = await queryBuilder.getManyAndCount();
    return { items, total };
  }

  async getQuestionBankById(id: string): Promise<QuestionBank | null> {
    return await this.questionBankRepository.findOneBy({ id });
  }

  async updateQuestionBank(id: string, params: Partial<QuestionBank>): Promise<QuestionBank | null> {
    const bank = await this.questionBankRepository.findOneBy({ id });
    if (!bank) return null;

    Object.assign(bank, params);
    return await this.questionBankRepository.save(bank);
  }

  async getQuestionsByBank(bankId: string): Promise<Question[]> {
    const bank = await this.questionBankRepository.findOneBy({ id: bankId });
    if (!bank || !bank.questionIds || bank.questionIds.length === 0) {
      return [];
    }

    const questions = await this.questionRepository.findByIds(bank.questionIds);
    return questions.filter(q => q.isActive);
  }

  async getCategories(): Promise<string[]> {
    const questions = await this.questionRepository.find({
      where: { isActive: true },
      select: ['category'],
    });
    
    const categories = new Set(questions.map(q => q.category));
    return Array.from(categories);
  }
}

export const questionService = new QuestionService();

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Question, QuestionDocument, QuestionType, DifficultyLevel } from './schemas/question.schema';
import { CreateQuestionDto } from './dto/create-question.dto';
import { SearchDto } from '../common/dto/search.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationType } from '../common/enums/operation-type.enum';

@Injectable()
export class QuestionBankService {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
    private operationLogsService: OperationLogsService,
  ) {}

  async create(createQuestionDto: CreateQuestionDto, operatorId: string): Promise<Question> {
    const question = new this.questionModel({
      ...createQuestionDto,
      createdBy: new Types.ObjectId(operatorId),
    });

    const saved = await question.save();

    await this.operationLogsService.create({
      userId: operatorId,
      operationType: OperationType.CREATE,
      module: 'question-bank',
      targetId: saved._id.toString(),
      details: {
        title: saved.title,
        category: saved.category,
        difficulty: saved.difficulty,
      },
      ip: 'localhost',
    });

    return saved;
  }

  async findAll(searchDto: SearchDto): Promise<PaginatedResult<Question>> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
      status,
      ownerId,
      keyword,
    } = searchDto;

    const filter: any = {};

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    if (status !== undefined) {
      filter.isActive = status === 'active';
    }

    if (ownerId) {
      filter.createdBy = new Types.ObjectId(ownerId);
    }

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
        { category: { $regex: keyword, $options: 'i' } },
        { tags: { $regex: keyword, $options: 'i' } },
      ];
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [data, total] = await Promise.all([
      this.questionModel
        .find(filter)
        .populate('createdBy', 'name')
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.questionModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<Question | null> {
    return this.questionModel
      .findById(id)
      .populate('createdBy', 'name')
      .exec();
  }

  async update(id: string, updateQuestionDto: CreateQuestionDto, operatorId: string): Promise<Question> {
    const question = await this.questionModel.findById(id).exec();
    if (!question) {
      throw new NotFoundException('题目不存在');
    }

    const updated = await this.questionModel
      .findByIdAndUpdate(id, updateQuestionDto, { new: true, runValidators: true })
      .exec();

    await this.operationLogsService.create({
      userId: operatorId,
      operationType: OperationType.UPDATE,
      module: 'question-bank',
      targetId: id,
      details: updateQuestionDto,
      ip: 'localhost',
    });

    return updated;
  }

  async remove(id: string, operatorId: string): Promise<Question> {
    const question = await this.questionModel.findByIdAndDelete(id).exec();
    if (!question) {
      throw new NotFoundException('题目不存在');
    }

    await this.operationLogsService.create({
      userId: operatorId,
      operationType: OperationType.DELETE,
      module: 'question-bank',
      targetId: id,
      details: { title: question.title },
      ip: 'localhost',
    });

    return question;
  }

  async getRandomQuestions(
    count: number,
    category?: string,
    difficulty?: DifficultyLevel,
    excludeIds?: string[],
  ): Promise<Question[]> {
    const filter: any = {
      isActive: true,
    };

    if (category) {
      filter.category = category;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (excludeIds && excludeIds.length > 0) {
      filter._id = { $nin: excludeIds.map(id => new Types.ObjectId(id)) };
    }

    const questions = await this.questionModel.aggregate([
      { $match: filter },
      { $sample: { size: count } },
    ]);

    return questions;
  }

  async getCategories(): Promise<string[]> {
    const result = await this.questionModel.distinct('category').exec();
    return result;
  }

  async getStatistics(): Promise<any> {
    const total = await this.questionModel.countDocuments().exec();
    const byType = await this.questionModel.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const byDifficulty = await this.questionModel.aggregate([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
    ]);
    const byCategory = await this.questionModel.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    return {
      total,
      byType,
      byDifficulty,
      byCategory,
    };
  }

  async initDefaultQuestions() {
    const count = await this.questionModel.countDocuments().exec();
    if (count > 0) return;

    const defaultQuestions = [
      {
        title: 'JavaScript 闭包是什么？',
        content: '请解释什么是 JavaScript 闭包，并给出一个实际应用场景的例子。',
        type: QuestionType.SHORT_ANSWER,
        difficulty: DifficultyLevel.MEDIUM,
        category: 'JavaScript',
        tags: ['前端', 'JavaScript', '基础'],
        referenceAnswer: '闭包是指有权访问另一个函数作用域中变量的函数...',
        analysis: '闭包是 JavaScript 中的重要概念，常用于数据私有化、模块化等场景。',
        defaultScore: 10,
        estimatedTime: 5,
      },
      {
        title: 'Vue 3 的响应式原理',
        content: 'Vue 3 使用 Proxy 实现响应式，相比 Vue 2 的 Object.defineProperty 有哪些优势？',
        type: QuestionType.ESSAY,
        difficulty: DifficultyLevel.HARD,
        category: 'Vue',
        tags: ['前端', 'Vue', '响应式'],
        referenceAnswer: 'Vue 3 使用 Proxy 可以直接监听对象和数组的变化...',
        analysis: '这是考察面试者对 Vue 3 核心原理的理解程度。',
        defaultScore: 15,
        estimatedTime: 8,
      },
      {
        title: 'HTTP 和 HTTPS 的区别',
        content: '以下关于 HTTP 和 HTTPS 的说法，正确的是？',
        type: QuestionType.SINGLE_CHOICE,
        difficulty: DifficultyLevel.EASY,
        category: '计算机网络',
        tags: ['网络', 'HTTP', '基础'],
        options: [
          'HTTPS 比 HTTP 更安全，因为使用了加密',
          'HTTPS 和 HTTP 使用相同的端口',
          'HTTPS 不需要证书',
          'HTTP 比 HTTPS 更快，所以更适合生产环境',
        ],
        correctAnswers: [0],
        referenceAnswer: 'HTTPS 通过 SSL/TLS 加密数据传输，默认使用 443 端口，需要 CA 证书。',
        defaultScore: 5,
        estimatedTime: 2,
      },
      {
        title: 'React Hooks 使用规则',
        content: 'React Hooks 有哪些使用规则？为什么不能在条件语句或循环中使用？',
        type: QuestionType.SHORT_ANSWER,
        difficulty: DifficultyLevel.MEDIUM,
        category: 'React',
        tags: ['前端', 'React', 'Hooks'],
        referenceAnswer: 'Hooks 只能在函数组件顶层调用，不能在循环、条件或嵌套函数中调用...',
        analysis: '这是 React 面试中的经典问题，考察对 Hooks 底层原理的理解。',
        defaultScore: 10,
        estimatedTime: 5,
      },
      {
        title: 'CSS 选择器优先级',
        content: 'CSS 选择器优先级从高到低排序正确的是？',
        type: QuestionType.SINGLE_CHOICE,
        difficulty: DifficultyLevel.EASY,
        category: 'CSS',
        tags: ['前端', 'CSS', '选择器'],
        options: [
          '!important > 内联样式 > ID > 类 > 标签',
          '内联样式 > !important > ID > 类 > 标签',
          'ID > !important > 内联样式 > 类 > 标签',
          '!important > ID > 内联样式 > 类 > 标签',
        ],
        correctAnswers: [0],
        referenceAnswer: '!important 优先级最高，其次是内联样式，然后是 ID、类、标签选择器。',
        defaultScore: 5,
        estimatedTime: 2,
      },
      {
        title: '实现防抖函数',
        content: '请用 JavaScript 实现一个防抖函数（debounce），并说明其应用场景。',
        type: QuestionType.CODING,
        difficulty: DifficultyLevel.MEDIUM,
        category: 'JavaScript',
        tags: ['前端', 'JavaScript', '手写代码'],
        referenceAnswer: 'function debounce(fn, delay) { let timer = null; return function(...args) { ... } }',
        analysis: '防抖常用于搜索框输入联想、窗口大小调整等场景。',
        defaultScore: 15,
        estimatedTime: 10,
      },
      {
        title: '实现节流函数',
        content: '请用 JavaScript 实现一个节流函数（throttle），并说明其应用场景。',
        type: QuestionType.CODING,
        difficulty: DifficultyLevel.MEDIUM,
        category: 'JavaScript',
        tags: ['前端', 'JavaScript', '手写代码'],
        referenceAnswer: 'function throttle(fn, interval) { let last = 0; return function(...args) { ... } }',
        analysis: '节流常用于滚动事件、鼠标移动事件等高频触发场景。',
        defaultScore: 15,
        estimatedTime: 10,
      },
      {
        title: '跨域解决方案',
        content: '请列举至少 5 种解决跨域问题的方法，并说明各自的优缺点。',
        type: QuestionType.ESSAY,
        difficulty: DifficultyLevel.MEDIUM,
        category: '计算机网络',
        tags: ['网络', '跨域', 'CORS'],
        referenceAnswer: '常见的跨域解决方案包括：CORS、JSONP、代理服务器、WebSocket、postMessage 等...',
        analysis: '考察面试者对网络安全和跨域问题的全面理解。',
        defaultScore: 15,
        estimatedTime: 10,
      },
    ];

    for (const q of defaultQuestions) {
      const question = new this.questionModel(q);
      await question.save();
    }

    console.log('默认题目已初始化');
  }
}

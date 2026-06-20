import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assessment, AssessmentDocument } from './schemas/assessment.schema';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { SearchDto } from '../common/dto/search.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { OperationLogsService } from '../operation-logs/operation-logs.service';
import { OperationType } from '../common/enums/operation-type.enum';
import { Interview } from '../interviews/schemas/interview.schema';
import { InterviewStatus } from '../common/enums/interview-status.enum';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectModel(Assessment.name) private assessmentModel: Model<AssessmentDocument>,
    @InjectModel(Interview.name) private interviewModel: Model<any>,
    private operationLogsService: OperationLogsService,
  ) {}

  async create(createAssessmentDto: CreateAssessmentDto, operatorId: string): Promise<Assessment> {
    const { interviewId } = createAssessmentDto;

    const interview = await this.interviewModel.findById(interviewId).exec();
    if (!interview) {
      throw new NotFoundException('面试记录不存在');
    }

    if (interview.status !== InterviewStatus.IN_PROGRESS && interview.status !== InterviewStatus.CHECKED_IN) {
      throw new ConflictException('只有进行中的面试才能创建测评');
    }

    const existing = await this.assessmentModel.findOne({ interviewId: new Types.ObjectId(interviewId) }).exec();
    if (existing) {
      throw new ConflictException('该面试已有测评记录，请使用更新操作');
    }

    let totalScore = createAssessmentDto.totalScore;
    if (!totalScore && createAssessmentDto.dimensions && createAssessmentDto.dimensions.length > 0) {
      totalScore = createAssessmentDto.dimensions.reduce((sum, d) => {
        return sum + (d.score * (d.weight || 1));
      }, 0);
    }

    const assessment = new this.assessmentModel({
      ...createAssessmentDto,
      interviewId: new Types.ObjectId(interviewId),
      interviewerId: new Types.ObjectId(operatorId),
      totalScore,
      usedQuestions: createAssessmentDto.usedQuestions?.map(q => new Types.ObjectId(q)),
    });

    const saved = await assessment.save();

    if (createAssessmentDto.isFinal && createAssessmentDto.recommendation) {
      interview.hireResult = createAssessmentDto.recommendation;
      interview.status = InterviewStatus.COMPLETED;
      interview.endInterviewTime = new Date();
      await interview.save();
    }

    await this.operationLogsService.create({
      userId: operatorId,
      operationType: OperationType.ASSESS,
      module: 'assessments',
      targetId: saved._id.toString(),
      details: {
        interviewId,
        totalScore: saved.totalScore,
        recommendation: saved.recommendation,
      },
      ip: 'localhost',
    });

    return saved;
  }

  async findAll(searchDto: SearchDto, currentUser?: any): Promise<PaginatedResult<Assessment>> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
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

    if (ownerId) {
      filter.interviewerId = new Types.ObjectId(ownerId);
    } else if (currentUser && currentUser.role === 'interviewer') {
      filter.interviewerId = new Types.ObjectId(currentUser.id);
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [data, total] = await Promise.all([
      this.assessmentModel
        .find(filter)
        .populate('interviewerId', 'name')
        .populate({
          path: 'interviewId',
          select: 'candidateName position interviewDate status hireResult',
          populate: { path: 'interviewerId', select: 'name' },
        })
        .populate('usedQuestions', 'title difficulty category')
        .sort(sort)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.assessmentModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<Assessment | null> {
    return this.assessmentModel
      .findById(id)
      .populate('interviewerId', 'name')
      .populate({
        path: 'interviewId',
        populate: { path: 'interviewerId', select: 'name' },
      })
      .populate('usedQuestions', 'title difficulty category content')
      .exec();
  }

  async findByInterviewId(interviewId: string): Promise<Assessment | null> {
    return this.assessmentModel
      .findOne({ interviewId: new Types.ObjectId(interviewId) })
      .populate('interviewerId', 'name')
      .populate({
        path: 'interviewId',
        populate: { path: 'interviewerId', select: 'name' },
      })
      .exec();
  }

  async update(id: string, updateAssessmentDto: CreateAssessmentDto, operatorId: string): Promise<Assessment> {
    const assessment = await this.assessmentModel.findById(id).exec();
    if (!assessment) {
      throw new NotFoundException('测评记录不存在');
    }

    let totalScore = updateAssessmentDto.totalScore || assessment.totalScore;
    if (!totalScore && updateAssessmentDto.dimensions && updateAssessmentDto.dimensions.length > 0) {
      totalScore = updateAssessmentDto.dimensions.reduce((sum, d) => {
        return sum + (d.score * (d.weight || 1));
      }, 0);
    }

    const updated = await this.assessmentModel
      .findByIdAndUpdate(
        id,
        {
          ...updateAssessmentDto,
          totalScore,
          usedQuestions: updateAssessmentDto.usedQuestions?.map(q => new Types.ObjectId(q)),
        },
        { new: true, runValidators: true },
      )
      .exec();

    if (updateAssessmentDto.isFinal && updateAssessmentDto.recommendation) {
      const interview = await this.interviewModel.findById(assessment.interviewId).exec();
      if (interview) {
        interview.hireResult = updateAssessmentDto.recommendation;
        interview.status = InterviewStatus.COMPLETED;
        interview.endInterviewTime = new Date();
        await interview.save();
      }
    }

    await this.operationLogsService.create({
      userId: operatorId,
      operationType: OperationType.UPDATE,
      module: 'assessments',
      targetId: id,
      details: updateAssessmentDto,
      ip: 'localhost',
    });

    return updated;
  }
}

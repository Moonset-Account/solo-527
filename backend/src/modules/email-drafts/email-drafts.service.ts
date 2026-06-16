import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmailDraft } from './schemas/email-draft.schema';
import { CreateEmailDraftDto, UpdateEmailDraftDto, QueryEmailDraftDto, SubmitReviewDto, ReviewDraftDto } from './dto/email-draft.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { EmailVersion } from '../email-versions/schemas/email-version.schema';
import { ReviewLog } from '../review-logs/schemas/review-log.schema';

@Injectable()
export class EmailDraftsService {
  constructor(
    @InjectModel(EmailDraft.name) private emailDraftModel: Model<EmailDraft>,
    @InjectModel(EmailVersion.name) private emailVersionModel: Model<EmailVersion>,
    @InjectModel(ReviewLog.name) private reviewLogModel: Model<ReviewLog>,
  ) {}

  async create(
    createEmailDraftDto: CreateEmailDraftDto,
    userId: string,
    isDemo: boolean = false,
  ): Promise<EmailDraft> {
    const draft = new this.emailDraftModel({
      ...createEmailDraftDto,
      createdBy: new Types.ObjectId(userId),
      assignedTo: createEmailDraftDto.assignedTo
        ? new Types.ObjectId(createEmailDraftDto.assignedTo)
        : undefined,
      isDemo,
    });
    await draft.save();

    await this.emailVersionModel.create({
      draftId: draft._id,
      content: draft.content,
      version: 1,
      createdBy: new Types.ObjectId(userId),
      comment: '初始版本',
    });

    return draft;
  }

  async findAll(
    queryDto: QueryEmailDraftDto,
    userId?: string,
    userRole?: string,
  ): Promise<PaginatedResult<EmailDraft>> {
    const { page = 1, pageSize = 10, status, createdBy, assignedTo, aiGenerated, keyword, startDate, endDate, includeDemo } = queryDto;
    const query: any = {};

    if (!includeDemo) {
      query.isDemo = false;
    }

    if (status) {
      query.status = status;
    }
    if (createdBy) {
      query.createdBy = new Types.ObjectId(createdBy);
    }
    if (assignedTo) {
      query.assignedTo = new Types.ObjectId(assignedTo);
    }
    if (aiGenerated !== undefined) {
      query.aiGenerated = aiGenerated;
    }
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
        { recipient: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    if (userRole === 'sales') {
      query.$or = [{ createdBy: new Types.ObjectId(userId) }, { assignedTo: new Types.ObjectId(userId) }];
    }

    const total = await this.emailDraftModel.countDocuments(query);
    const list = await this.emailDraftModel
      .find(query)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<EmailDraft> {
    const draft = await this.emailDraftModel
      .findById(id)
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .exec();
    if (!draft) {
      throw new NotFoundException('草稿不存在');
    }
    return draft;
  }

  async update(
    id: string,
    updateEmailDraftDto: UpdateEmailDraftDto,
    userId: string,
    comment?: string,
  ): Promise<EmailDraft> {
    const draft = await this.emailDraftModel.findById(id);
    if (!draft) {
      throw new NotFoundException('草稿不存在');
    }

    if (draft.createdBy.toString() !== userId && draft.assignedTo?.toString() !== userId) {
      throw new ForbiddenException('无权限修改此草稿');
    }

    const updateData: any = { ...updateEmailDraftDto };
    if (updateEmailDraftDto.assignedTo) {
      updateData.assignedTo = new Types.ObjectId(updateEmailDraftDto.assignedTo);
    }

    const updatedDraft = await this.emailDraftModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .exec();

    if (updateEmailDraftDto.content && updateEmailDraftDto.content !== draft.content) {
      const lastVersion = await this.emailVersionModel
        .findOne({ draftId: draft._id })
        .sort({ version: -1 })
        .exec();
      const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

      await this.emailVersionModel.create({
        draftId: draft._id,
        content: updateEmailDraftDto.content,
        version: nextVersion,
        createdBy: new Types.ObjectId(userId),
        comment: comment || '内容修改',
      });
    }

    return updatedDraft;
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const draft = await this.emailDraftModel.findById(id);
    if (!draft) {
      throw new NotFoundException('草稿不存在');
    }

    if (userRole !== 'admin' && draft.createdBy.toString() !== userId) {
      throw new ForbiddenException('无权限删除此草稿');
    }

    await this.emailDraftModel.findByIdAndDelete(id).exec();
    await this.emailVersionModel.deleteMany({ draftId: id }).exec();
  }

  async submitForReview(
    id: string,
    submitReviewDto: SubmitReviewDto,
    userId: string,
  ): Promise<EmailDraft> {
    const draft = await this.emailDraftModel.findById(id);
    if (!draft) {
      throw new NotFoundException('草稿不存在');
    }

    if (draft.createdBy.toString() !== userId) {
      throw new ForbiddenException('无权限提交此草稿');
    }

    if (draft.status !== 'draft') {
      throw new BadRequestException('只有草稿状态可以提交审核');
    }

    const updateData: any = { status: 'pending_review' as const };
    if (submitReviewDto.assignedTo) {
      updateData.assignedTo = new Types.ObjectId(submitReviewDto.assignedTo);
    }

    return this.emailDraftModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .exec();
  }

  async review(
    id: string,
    reviewDto: ReviewDraftDto,
    reviewerId: string,
  ): Promise<EmailDraft> {
    const draft = await this.emailDraftModel.findById(id);
    if (!draft) {
      throw new NotFoundException('草稿不存在');
    }

    if (draft.status !== 'pending_review') {
      throw new BadRequestException('只有待审核状态可以审核');
    }

    const newStatus = reviewDto.action === 'approve' ? 'approved' : 'rejected';
    const updatedDraft = await this.emailDraftModel
      .findByIdAndUpdate(id, { status: newStatus }, { new: true })
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .exec();

    await this.reviewLogModel.create({
      draftId: draft._id,
      reviewerId: new Types.ObjectId(reviewerId),
      action: reviewDto.action,
      comment: reviewDto.comment,
      isDemo: draft.isDemo,
    });

    return updatedDraft;
  }

  async sendDraft(id: string, userId: string): Promise<EmailDraft> {
    const draft = await this.emailDraftModel.findById(id);
    if (!draft) {
      throw new NotFoundException('草稿不存在');
    }

    if (draft.status !== 'approved') {
      throw new BadRequestException('只有已通过审核的草稿可以发送');
    }

    if (draft.createdBy.toString() !== userId) {
      throw new ForbiddenException('无权限发送此草稿');
    }

    return this.emailDraftModel
      .findByIdAndUpdate(id, { status: 'sent' }, { new: true })
      .populate('createdBy', 'username email')
      .populate('assignedTo', 'username email')
      .exec();
  }
}

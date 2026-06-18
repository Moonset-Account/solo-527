import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BusinessDetail, Attachment, Comment, HistoryRecord } from './schemas/business-detail.schema';
import { AddCommentDto, UpdateBusinessDetailDto } from './dto/business-detail.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BusinessDetailsService {
  constructor(
    @InjectModel(BusinessDetail.name)
    private businessDetailModel: Model<BusinessDetail>,
  ) {}

  private async ensureExists(anomalyId: string): Promise<BusinessDetail> {
    const objectId = new Types.ObjectId(anomalyId);
    let detail = await this.businessDetailModel.findOne({ anomalyId: objectId });
    if (!detail) {
      detail = new this.businessDetailModel({
        anomalyId: objectId,
        reviewStatus: 'not_started',
      });
      await detail.save();
    }
    return detail;
  }

  private async addHistory(
    anomalyId: string,
    field: string,
    fieldName: string,
    oldValue: any,
    newValue: any,
    operator?: any,
  ) {
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;

    const detail = await this.ensureExists(anomalyId);
    const record: HistoryRecord = {
      _id: new Types.ObjectId(),
      field,
      fieldName,
      oldValue,
      newValue,
      userId: operator?.sub ? new Types.ObjectId(operator.sub) : new Types.ObjectId(),
      userName: operator?.name || '系统',
      changedAt: new Date(),
    };
    detail.history.unshift(record);
    if (detail.history.length > 200) detail.history = detail.history.slice(0, 200);
    await detail.save();
  }

  async findByAnomaly(anomalyId: string): Promise<BusinessDetail> {
    return this.ensureExists(anomalyId);
  }

  async update(
    anomalyId: string,
    dto: UpdateBusinessDetailDto,
    operator?: any,
  ): Promise<BusinessDetail> {
    const detail = await this.ensureExists(anomalyId);
    const oldData = detail.toObject();
    const fieldNames: Record<string, string> = {
      businessContext: '业务背景',
      impactScope: '影响范围',
      relatedBusiness: '关联业务',
      rootCauseAnalysis: '根因分析',
      solution: '解决方案',
      preventionMeasure: '预防措施',
      relatedAnomalyIds: '关联异常',
      reviewStatus: '复盘状态',
    };

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        (detail as any)[key] = value;
        await this.addHistory(
          anomalyId,
          key,
          fieldNames[key] || key,
          (oldData as any)[key],
          value,
          operator,
        );
      }
    }

    return detail.save();
  }

  async addComment(
    anomalyId: string,
    dto: AddCommentDto,
    operator?: any,
  ): Promise<Comment> {
    const detail = await this.ensureExists(anomalyId);

    const comment: Comment = {
      _id: new Types.ObjectId(),
      content: dto.content,
      userId: operator?.sub ? new Types.ObjectId(operator.sub) : new Types.ObjectId(),
      userName: operator?.name || '匿名',
      createdAt: new Date(),
      mentions: dto.mentions?.map((id) => new Types.ObjectId(id)) || [],
    };

    detail.comments.unshift(comment);
    await detail.save();
    return comment;
  }

  async deleteComment(anomalyId: string, commentId: string, operator?: any) {
    const detail = await this.ensureExists(anomalyId);
    const commentIndex = detail.comments.findIndex(
      (c) => c._id.toString() === commentId,
    );

    if (commentIndex < 0) {
      throw new NotFoundException('评论不存在');
    }

    const comment = detail.comments[commentIndex];
    if (
      operator &&
      operator.role !== 'admin' &&
      comment.userId.toString() !== operator.sub
    ) {
      throw new BadRequestException('无权删除他人评论');
    }

    detail.comments.splice(commentIndex, 1);
    await detail.save();
  }

  async addAttachment(
    anomalyId: string,
    file: Express.Multer.File,
    operator?: any,
  ): Promise<Attachment> {
    const detail = await this.ensureExists(anomalyId);

    const uploadDir = path.join(process.cwd(), 'uploads', anomalyId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const savedFilename = `${Date.now()}-${file.originalname}`;
    const savedPath = path.join(uploadDir, savedFilename);
    fs.writeFileSync(savedPath, file.buffer);

    const attachment: Attachment = {
      _id: new Types.ObjectId(),
      filename: savedFilename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: savedPath,
      uploadedBy: operator?.sub ? new Types.ObjectId(operator.sub) : new Types.ObjectId(),
      uploadedByName: operator?.name || '匿名',
      uploadedAt: new Date(),
    };

    detail.attachments.push(attachment);
    await detail.save();
    return attachment;
  }

  async deleteAttachment(anomalyId: string, attachmentId: string, operator?: any) {
    const detail = await this.ensureExists(anomalyId);
    const attIndex = detail.attachments.findIndex(
      (a) => a._id.toString() === attachmentId,
    );

    if (attIndex < 0) {
      throw new NotFoundException('附件不存在');
    }

    const att = detail.attachments[attIndex];
    if (
      operator &&
      operator.role !== 'admin' &&
      att.uploadedBy.toString() !== operator.sub
    ) {
      throw new BadRequestException('无权删除他人附件');
    }

    try {
      if (fs.existsSync(att.path)) {
        fs.unlinkSync(att.path);
      }
    } catch (err) {
      console.warn('删除文件失败:', err);
    }

    detail.attachments.splice(attIndex, 1);
    await detail.save();
  }

  async getHistory(anomalyId: string) {
    const detail = await this.ensureExists(anomalyId);
    return detail.history;
  }
}

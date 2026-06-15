import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Types } from 'mongoose';
import { ItemModel } from '../../schemas/item.schema.js';
import { ProgressModel } from '../../schemas/progress.schema.js';
import { AttachmentModel } from '../../schemas/attachment.schema.js';
import { LogService } from '../log/log.service.js';
import type { IItem, IProgress, IAttachment, ItemStatus } from '../../common/types/index.js';
import type { CreateItemDto } from './dto/create-item.dto.js';
import type { UpdateItemDto } from './dto/update-item.dto.js';

export interface FindAllQuery {
  page?: number;
  pageSize?: number;
  status?: ItemStatus;
  department?: string;
  assignee?: string;
  keyword?: string;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class ItemService {
  constructor(private readonly logService: LogService) {}

  async findAll(query: FindAllQuery): Promise<PaginatedResult<IItem>> {
    const { page = 1, pageSize = 10, status, department, assignee, keyword } = query;
    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    }
    if (department) {
      filter.department = new Types.ObjectId(department);
    }
    if (assignee) {
      filter.assignee = new Types.ObjectId(assignee);
    }
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    const [list, total] = await Promise.all([
      ItemModel.find(filter)
        .populate('department', 'name')
        .populate('assignee', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      ItemModel.countDocuments(filter).exec(),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async findById(id: string): Promise<IItem & { progressList: IProgress[]; attachments: IAttachment[] }> {
    const itemId = new Types.ObjectId(id);
    const item = await ItemModel.findById(itemId)
      .populate('department', 'name')
      .populate('assignee', 'name')
      .exec();

    if (!item) {
      throw new NotFoundException('事项不存在');
    }

    const [progressList, attachments] = await Promise.all([
      ProgressModel.find({ itemId })
        .populate('operator', 'name')
        .sort({ createdAt: -1 })
        .exec(),
      AttachmentModel.find({ refId: itemId, refType: 'item' })
        .populate('operator', 'name')
        .sort({ createdAt: -1 })
        .exec(),
    ]);

    return {
      ...item.toObject(),
      progressList,
      attachments,
    };
  }

  async create(data: CreateItemDto, creatorId: Types.ObjectId): Promise<IItem> {
    const item = new ItemModel({
      ...data,
      department: new Types.ObjectId(data.department),
      assignee: new Types.ObjectId(data.assignee),
      deadline: new Date(data.deadline),
    });

    const savedItem = await item.save();

    await this.logService.create(
      'user_action',
      creatorId,
      savedItem._id,
      'item',
      null,
      { title: data.title, description: data.description },
    );

    return savedItem;
  }

  async update(id: string, data: UpdateItemDto, operatorId: Types.ObjectId): Promise<IItem> {
    const itemId = new Types.ObjectId(id);
    const item = await ItemModel.findById(itemId).exec();

    if (!item) {
      throw new NotFoundException('事项不存在');
    }

    const oldValues: Record<string, any> = {};
    const updateData: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        oldValues[key] = item.get(key);
        if (key === 'department' || key === 'assignee') {
          updateData[key] = new Types.ObjectId(value as string);
        } else if (key === 'deadline') {
          updateData[key] = new Date(value as string);
        } else {
          updateData[key] = value;
        }
      }
    }

    const updatedItem = await ItemModel.findByIdAndUpdate(
      itemId,
      { $set: updateData },
      { new: true },
    ).exec();

    for (const [key, oldValue] of Object.entries(oldValues)) {
      const newValue = updateData[key];
      if (oldValue !== newValue) {
        await this.logService.create(
          'user_action',
          operatorId,
          itemId,
          key,
          oldValue,
          newValue,
        );
      }
    }

    return updatedItem!;
  }

  async claim(id: string, userId: Types.ObjectId): Promise<IItem> {
    const itemId = new Types.ObjectId(id);
    const item = await ItemModel.findById(itemId).exec();

    if (!item) {
      throw new NotFoundException('事项不存在');
    }

    if (item.status !== 'pending') {
      throw new BadRequestException('只有待办状态的事项可以认领');
    }

    const oldStatus = item.status;
    const oldAssignee = item.assignee;
    const oldClaimedAt = item.claimedAt;

    const updatedItem = await ItemModel.findByIdAndUpdate(
      itemId,
      {
        $set: {
          status: 'in_progress' as ItemStatus,
          assignee: userId,
          claimedAt: new Date(),
        },
      },
      { new: true },
    ).exec();

    await this.logService.create(
      'claim',
      userId,
      itemId,
      'status',
      oldStatus,
      'in_progress',
    );

    await this.logService.create(
      'claim',
      userId,
      itemId,
      'assignee',
      oldAssignee,
      userId,
    );

    await this.logService.create(
      'claim',
      userId,
      itemId,
      'claimedAt',
      oldClaimedAt,
      new Date(),
    );

    return updatedItem!;
  }

  async addProgress(
    id: string,
    content: string,
    attachments: string[] = [],
    operatorId: Types.ObjectId,
  ): Promise<IProgress> {
    const itemId = new Types.ObjectId(id);
    const item = await ItemModel.findById(itemId).exec();

    if (!item) {
      throw new NotFoundException('事项不存在');
    }

    const progress = new ProgressModel({
      itemId,
      content,
      attachments,
      operator: operatorId,
    });

    const savedProgress = await progress.save();

    await this.logService.create(
      'progress',
      operatorId,
      itemId,
      'progress',
      null,
      { content, attachments },
    );

    return savedProgress;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkOverdue(): Promise<void> {
    const now = new Date();
    const items = await ItemModel.find({
      deadline: { $lt: now },
      status: { $nin: ['completed', 'overdue', 'archived'] },
    }).exec();

    for (const item of items) {
      const oldStatus = item.status;

      await ItemModel.findByIdAndUpdate(
        item._id,
        { $set: { status: 'overdue' as ItemStatus } },
      ).exec();

      await this.logService.create(
        'overdue_mark',
        item.assignee,
        item._id,
        'status',
        oldStatus,
        'overdue',
      );
    }
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quality, QualityDocument, QualityStatus, StatusHistoryItem } from '../../schemas/quality.schema';
import { Appointment, AppointmentDocument } from '../../schemas/appointment.schema';
import { TransitionDto } from './dto/transition.dto';
import { HandleNoShowDto } from './dto/handle-no-show.dto';
import { QualityQueryDto } from './dto/quality-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class QualityService {
  constructor(
    @InjectModel(Quality.name) private qualityModel: Model<QualityDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async findAll(query: QualityQueryDto): Promise<PaginatedResponse<Quality>> {
    const { page, pageSize, status, hasNoShow } = query;
    const skip = (page - 1) * pageSize;

    const filter: any = {};
    if (status) filter.status = status;
    if (hasNoShow !== undefined) filter.hasNoShow = hasNoShow;

    const [list, total] = await Promise.all([
      this.qualityModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
      this.qualityModel.countDocuments(filter).exec(),
    ]);

    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<Quality> {
    const quality = await this.qualityModel.findById(id).exec();
    if (!quality) {
      throw new NotFoundException('质量记录不存在');
    }
    return quality;
  }

  async create(appointmentId: string, user: CurrentUserPayload): Promise<Quality> {
    const appointment = await this.appointmentModel.findById(appointmentId).exec();
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    const existingQuality = await this.qualityModel.findOne({ appointmentId: new Types.ObjectId(appointmentId) }).exec();
    if (existingQuality) {
      throw new BadRequestException('该预约已存在质量记录');
    }

    const quality = new this.qualityModel({
      appointmentId: appointment._id,
      vehicleId: appointment.vehicleId,
      status: QualityStatus.PENDING,
      statusHistory: [
        {
          fromStatus: '',
          toStatus: QualityStatus.PENDING,
          operatorId: new Types.ObjectId(user.id),
          operatorName: user.name,
          remark: '创建质量记录',
          timestamp: new Date(),
        },
      ],
    });

    return quality.save();
  }

  async transition(id: string, transitionDto: TransitionDto, user: CurrentUserPayload): Promise<Quality> {
    const quality = await this.qualityModel.findById(id).exec();
    if (!quality) {
      throw new NotFoundException('质量记录不存在');
    }

    const fromStatus = quality.status;
    const toStatus = transitionDto.toStatus;

    const validTransitions: Record<QualityStatus, QualityStatus[]> = {
      [QualityStatus.PENDING]: [QualityStatus.IN_PROGRESS, QualityStatus.COMPLETED],
      [QualityStatus.IN_PROGRESS]: [QualityStatus.QUALITY_CHECK, QualityStatus.COMPLETED],
      [QualityStatus.QUALITY_CHECK]: [QualityStatus.COMPLETED, QualityStatus.IN_PROGRESS],
      [QualityStatus.COMPLETED]: [],
    };

    if (!validTransitions[fromStatus].includes(toStatus)) {
      throw new BadRequestException(`无法从 ${fromStatus} 流转到 ${toStatus}`);
    }

    const historyItem: StatusHistoryItem = {
      fromStatus,
      toStatus,
      operatorId: new Types.ObjectId(user.id),
      operatorName: user.name,
      remark: transitionDto.remark || '状态流转',
      timestamp: new Date(),
    };

    quality.status = toStatus;
    quality.statusHistory.push(historyItem);

    return quality.save();
  }

  async handleNoShow(id: string, handleNoShowDto: HandleNoShowDto, user: CurrentUserPayload): Promise<Quality> {
    const quality = await this.qualityModel.findById(id).exec();
    if (!quality) {
      throw new NotFoundException('质量记录不存在');
    }

    if (!quality.hasNoShow) {
      throw new BadRequestException('该质量记录没有爽约记录');
    }

    if (quality.noShowHandledAt) {
      throw new BadRequestException('该爽约记录已处理');
    }

    quality.noShowHandledBy = new Types.ObjectId(user.id);
    quality.noShowHandledAt = new Date();

    quality.statusHistory.push({
      fromStatus: quality.status,
      toStatus: quality.status,
      operatorId: new Types.ObjectId(user.id),
      operatorName: user.name,
      remark: `爽约处理：${handleNoShowDto.remark}`,
      timestamp: new Date(),
    });

    return quality.save();
  }

  async getReport(): Promise<{
    transitionRecords: StatusHistoryItem[];
    noShowRecords: Quality[];
    exceptionRecords: Quality[];
  }> {
    const qualities = await this.qualityModel.find().exec();

    const transitionRecords: StatusHistoryItem[] = [];
    const noShowRecords: Quality[] = [];
    const exceptionRecords: Quality[] = [];

    for (const quality of qualities) {
      transitionRecords.push(...quality.statusHistory);

      if (quality.hasNoShow) {
        noShowRecords.push(quality);
      }

      if (quality.exceptionId) {
        exceptionRecords.push(quality);
      }
    }

    return { transitionRecords, noShowRecords, exceptionRecords };
  }

  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<QualityStatus, number>;
    noShowCount: number;
    averageProcessingTime: number;
  }> {
    const qualities = await this.qualityModel.find().exec();

    const byStatus: Record<QualityStatus, number> = {
      [QualityStatus.PENDING]: 0,
      [QualityStatus.IN_PROGRESS]: 0,
      [QualityStatus.QUALITY_CHECK]: 0,
      [QualityStatus.COMPLETED]: 0,
    };

    let noShowCount = 0;
    let totalProcessingTime = 0;
    let completedCount = 0;

    for (const quality of qualities) {
      byStatus[quality.status]++;

      if (quality.hasNoShow) {
        noShowCount++;
      }

      if (quality.status === QualityStatus.COMPLETED && quality.statusHistory.length > 0) {
        const firstTransition = quality.statusHistory[0];
        const lastTransition = quality.statusHistory[quality.statusHistory.length - 1];
        totalProcessingTime += lastTransition.timestamp.getTime() - firstTransition.timestamp.getTime();
        completedCount++;
      }
    }

    const averageProcessingTime = completedCount > 0 ? totalProcessingTime / completedCount : 0;

    return {
      total: qualities.length,
      byStatus,
      noShowCount,
      averageProcessingTime,
    };
  }
}

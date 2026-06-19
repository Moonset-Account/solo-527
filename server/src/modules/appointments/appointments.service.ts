import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Appointment, AppointmentDocument, AppointmentStatus } from '../../schemas/appointment.schema';
import { Quality, QualityDocument, QualityStatus } from '../../schemas/quality.schema';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { NoShowDto } from './dto/no-show.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Quality.name) private qualityModel: Model<QualityDocument>,
  ) {}

  async findAll(query: AppointmentQueryDto): Promise<PaginatedResponse<Appointment>> {
    const { page, pageSize, customerName, phone, type, status, startDate, endDate } = query;
    const skip = (page - 1) * pageSize;

    const filter: any = {};
    if (customerName) filter.customerName = { $regex: customerName, $options: 'i' };
    if (phone) filter.phone = { $regex: phone, $options: 'i' };
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.scheduledDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      filter.scheduledDate = { $gte: startDate };
    } else if (endDate) {
      filter.scheduledDate = { $lte: endDate };
    }

    const [list, total] = await Promise.all([
      this.appointmentModel.find(filter).sort({ scheduledDate: -1 }).skip(skip).limit(pageSize).exec(),
      this.appointmentModel.countDocuments(filter).exec(),
    ]);

    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentModel.findById(id).exec();
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }
    return appointment;
  }

  async create(createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    const appointment = new this.appointmentModel({
      ...createAppointmentDto,
      status: AppointmentStatus.SCHEDULED,
    });
    return appointment.save();
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.appointmentModel.findByIdAndUpdate(id, updateAppointmentDto, { new: true }).exec();
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }
    return appointment;
  }

  async confirm(id: string, user: CurrentUserPayload): Promise<Appointment> {
    const appointment = await this.appointmentModel.findById(id).exec();
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('只有待确认的预约可以确认');
    }

    appointment.status = AppointmentStatus.CONFIRMED;

    const existingQuality = await this.qualityModel.findOne({ appointmentId: appointment._id }).exec();
    if (!existingQuality) {
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
            remark: '预约确认，创建质量记录',
            timestamp: new Date(),
          },
        ],
      });
      await quality.save();
    }

    return appointment.save();
  }

  async noShow(id: string, noShowDto: NoShowDto, user: CurrentUserPayload): Promise<Appointment> {
    const appointment = await this.appointmentModel.findById(id).exec();
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('只有已确认的预约可以标记爽约');
    }

    appointment.status = AppointmentStatus.NO_SHOW;
    appointment.noShowReason = noShowDto.reason;

    const quality = await this.qualityModel.findOne({ appointmentId: appointment._id }).exec();
    if (quality) {
      quality.hasNoShow = true;
      quality.statusHistory.push({
        fromStatus: quality.status,
        toStatus: quality.status,
        operatorId: new Types.ObjectId(user.id),
        operatorName: user.name,
        remark: `客户爽约，原因：${noShowDto.reason}`,
        timestamp: new Date(),
      });
      await quality.save();
    } else {
      const newQuality = new this.qualityModel({
        appointmentId: appointment._id,
        vehicleId: appointment.vehicleId,
        status: QualityStatus.PENDING,
        hasNoShow: true,
        statusHistory: [
          {
            fromStatus: '',
            toStatus: QualityStatus.PENDING,
            operatorId: new Types.ObjectId(user.id),
            operatorName: user.name,
            remark: `客户爽约，原因：${noShowDto.reason}`,
            timestamp: new Date(),
          },
        ],
      });
      await newQuality.save();
    }

    return appointment.save();
  }

  async start(id: string, user: CurrentUserPayload): Promise<Appointment> {
    const appointment = await this.appointmentModel.findById(id).exec();
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('只有已确认的预约可以开始');
    }

    appointment.status = AppointmentStatus.IN_PROGRESS;

    const quality = await this.qualityModel.findOne({ appointmentId: appointment._id }).exec();
    if (quality) {
      quality.statusHistory.push({
        fromStatus: QualityStatus.PENDING,
        toStatus: QualityStatus.IN_PROGRESS,
        operatorId: new Types.ObjectId(user.id),
        operatorName: user.name,
        remark: '开始服务',
        timestamp: new Date(),
      });
      quality.status = QualityStatus.IN_PROGRESS;
      await quality.save();
    }

    return appointment.save();
  }

  async complete(id: string, user: CurrentUserPayload): Promise<Appointment> {
    const appointment = await this.appointmentModel.findById(id).exec();
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    if (appointment.status !== AppointmentStatus.IN_PROGRESS) {
      throw new BadRequestException('只有进行中的预约可以完成');
    }

    appointment.status = AppointmentStatus.COMPLETED;

    const quality = await this.qualityModel.findOne({ appointmentId: appointment._id }).exec();
    if (quality) {
      quality.statusHistory.push({
        fromStatus: QualityStatus.IN_PROGRESS,
        toStatus: QualityStatus.QUALITY_CHECK,
        operatorId: new Types.ObjectId(user.id),
        operatorName: user.name,
        remark: '服务完成，进入质量检测',
        timestamp: new Date(),
      });
      quality.status = QualityStatus.QUALITY_CHECK;
      await quality.save();
    }

    return appointment.save();
  }
}

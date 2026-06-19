import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Followup, FollowupDocument, FollowupStatus } from '../../schemas/followup.schema';
import { Appointment, AppointmentDocument, AppointmentStatus } from '../../schemas/appointment.schema';
import { CreateFollowupDto } from './dto/create-followup.dto';
import { UpdateFollowupDto } from './dto/update-followup.dto';
import { CompleteFollowupDto } from './dto/complete-followup.dto';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class FollowupsService {
  constructor(
    @InjectModel(Followup.name) private followupModel: Model<FollowupDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
  ) {}

  async findAll(): Promise<Followup[]> {
    return this.followupModel.find().sort({ scheduledAt: -1 }).exec();
  }

  async getMyTasks(userId: string): Promise<Followup[]> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.followupModel
      .find({
        assigneeId: new Types.ObjectId(userId),
        status: FollowupStatus.PENDING,
        scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      })
      .sort({ scheduledAt: 1 })
      .exec();
  }

  async findOne(id: string): Promise<Followup> {
    const followup = await this.followupModel.findById(id).exec();
    if (!followup) {
      throw new NotFoundException('回访记录不存在');
    }
    return followup;
  }

  async create(createFollowupDto: CreateFollowupDto): Promise<Followup> {
    const followup = new this.followupModel(createFollowupDto);
    return followup.save();
  }

  async update(id: string, updateFollowupDto: UpdateFollowupDto): Promise<Followup> {
    const followup = await this.followupModel.findByIdAndUpdate(id, updateFollowupDto, { new: true }).exec();
    if (!followup) {
      throw new NotFoundException('回访记录不存在');
    }
    return followup;
  }

  async complete(id: string, completeFollowupDto: CompleteFollowupDto, user: CurrentUserPayload): Promise<Followup> {
    const followup = await this.followupModel.findById(id).exec();
    if (!followup) {
      throw new NotFoundException('回访记录不存在');
    }

    if (followup.status !== FollowupStatus.PENDING) {
      throw new BadRequestException('只有待处理的回访可以完成');
    }

    let appointmentId: Types.ObjectId | undefined;

    if (completeFollowupDto.appointmentMade) {
      if (!completeFollowupDto.appointmentData) {
        throw new BadRequestException('已预约时必须提供预约数据');
      }

      const appointment = new this.appointmentModel({
        ...completeFollowupDto.appointmentData,
        leadId: followup.leadId,
        status: AppointmentStatus.SCHEDULED,
      });

      const savedAppointment = await appointment.save();
      appointmentId = savedAppointment._id;
    }

    followup.status = FollowupStatus.COMPLETED;
    followup.result = completeFollowupDto.result;
    followup.appointmentMade = completeFollowupDto.appointmentMade;
    followup.appointmentId = appointmentId;
    followup.completedAt = new Date();

    return followup.save();
  }

  async cancel(id: string, user: CurrentUserPayload): Promise<Followup> {
    const followup = await this.followupModel.findById(id).exec();
    if (!followup) {
      throw new NotFoundException('回访记录不存在');
    }

    if (followup.status !== FollowupStatus.PENDING) {
      throw new BadRequestException('只有待处理的回访可以取消');
    }

    followup.status = FollowupStatus.CANCELLED;

    return followup.save();
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Instrument, InstrumentDocument, InstrumentBooking, InstrumentBookingDocument } from './schemas/instrument.schema';
import { CreateInstrumentDto, QueryInstrumentDto, CreateBookingDto, QueryBookingDto } from './dto/instrument.dto';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { AuditAction, InstrumentStatus } from '@/common/enums/index.enum';

@Injectable()
export class InstrumentService {
  constructor(
    @InjectModel(Instrument.name) private instrumentModel: Model<InstrumentDocument>,
    @InjectModel(InstrumentBooking.name) private bookingModel: Model<InstrumentBookingDocument>,
    private auditService: AuditService,
    private usersService: UsersService,
  ) {}

  private generateBookingNo(): string {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `IB${ymd}${random}`;
  }

  async createInstrument(dto: CreateInstrumentDto, operatorId?: string): Promise<Instrument> {
    const existing = await this.instrumentModel.findOne({ instrumentNo: dto.instrumentNo });
    if (existing) throw new BadRequestException('仪器编号已存在');

    const instrument = new this.instrumentModel({
      ...dto,
      audit: { createdBy: operatorId, updatedBy: operatorId },
    });
    await instrument.save();

    await this.auditService.create({
      action: AuditAction.CREATE,
      module: 'instrument',
      targetId: instrument._id.toString(),
      targetName: instrument.name,
      operatorId,
      details: dto,
    });

    return instrument;
  }

  async findInstruments(query: QueryInstrumentDto): Promise<{ list: Instrument[]; total: number }> {
    const { keyword, status, laboratory, page, pageSize } = query;
    const filter: any = { isActive: true };

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { instrumentNo: { $regex: keyword, $options: 'i' } },
        { model: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (laboratory) filter.laboratory = laboratory;

    const [list, total] = await Promise.all([
      this.instrumentModel.find(filter).skip((page - 1) * pageSize).limit(pageSize).sort({ createdAt: -1 }),
      this.instrumentModel.countDocuments(filter),
    ]);

    return { list, total };
  }

  async findInstrumentById(id: string): Promise<Instrument> {
    const instrument = await this.instrumentModel.findById(id);
    if (!instrument) throw new NotFoundException('仪器不存在');
    return instrument;
  }

  async createBooking(dto: CreateBookingDto, userId: string): Promise<InstrumentBooking> {
    const instrument = await this.instrumentModel.findById(dto.instrumentId);
    if (!instrument) throw new NotFoundException('仪器不存在');

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (start >= end) throw new BadRequestException('结束时间必须晚于开始时间');

    const conflict = await this.bookingModel.findOne({
      instrumentId: dto.instrumentId,
      status: { $ne: 'cancelled' },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } },
      ],
    });
    if (conflict) throw new BadRequestException('该时段仪器已被预约');

    const user = await this.usersService.findById(userId);

    const booking = new this.bookingModel({
      ...dto,
      bookingNo: this.generateBookingNo(),
      instrumentName: instrument.name,
      bookerId: userId,
      bookerName: user.realName,
      status: 'confirmed',
      audit: { createdBy: userId, updatedBy: userId },
    });
    await booking.save();

    await this.auditService.create({
      action: AuditAction.CREATE,
      module: 'instrument_booking',
      targetId: booking._id.toString(),
      targetName: booking.bookingNo,
      operatorId: userId,
      operatorName: user.realName,
      details: dto,
    });

    return booking;
  }

  async findBookings(query: QueryBookingDto): Promise<{ list: InstrumentBooking[]; total: number }> {
    const { instrumentId, bookerId, startDate, endDate, page, pageSize } = query;
    const filter: any = {};

    if (instrumentId) filter.instrumentId = instrumentId;
    if (bookerId) filter.bookerId = bookerId;
    if (startDate || endDate) {
      filter.$or = [
        { startTime: { $gte: startDate ? new Date(startDate) : new Date(0), $lte: endDate ? new Date(endDate) : new Date(8640000000000000) } },
      ];
    }

    const [list, total] = await Promise.all([
      this.bookingModel.find(filter).skip((page - 1) * pageSize).limit(pageSize).sort({ startTime: -1 }).populate('instrumentId projectId relatedApplicationIds'),
      this.bookingModel.countDocuments(filter),
    ]);

    return { list, total };
  }

  async findBookingById(id: string): Promise<InstrumentBooking> {
    const booking = await this.bookingModel.findById(id).populate('instrumentId projectId relatedApplicationIds');
    if (!booking) throw new NotFoundException('预约不存在');
    return booking;
  }

  async cancelBooking(id: string, userId: string): Promise<void> {
    const booking = await this.bookingModel.findById(id);
    if (!booking) throw new NotFoundException('预约不存在');
    if (booking.bookerId !== userId) throw new BadRequestException('只能取消自己的预约');

    booking.status = 'cancelled';
    booking.audit = { ...booking.audit, updatedBy: userId, updatedAt: new Date() };
    await booking.save();

    const user = await this.usersService.findById(userId);
    await this.auditService.create({
      action: AuditAction.CANCEL,
      module: 'instrument_booking',
      targetId: id,
      targetName: booking.bookingNo,
      operatorId: userId,
      operatorName: user.realName,
    });
  }
}

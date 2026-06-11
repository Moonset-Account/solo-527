import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Worker, WorkerDocument } from '../../schemas/worker.schema';
import { CreateWorkerDto, UpdateWorkerDto, QueryWorkerDto } from '../../dto/worker.dto';

@Injectable()
export class WorkersService {
  constructor(
    @InjectModel(Worker.name) private workerModel: Model<WorkerDocument>,
  ) {}

  private validatePhone(phone: string) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequestException('手机号格式不正确');
    }
  }

  private validateIdCard(idCard: string) {
    const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
    if (!idCardRegex.test(idCard)) {
      throw new BadRequestException('身份证号格式不正确');
    }
  }

  private async checkPhoneUnique(phone: string, excludeId?: string) {
    const filter: any = { phone };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await this.workerModel.findOne(filter).exec();
    if (existing) {
      throw new ConflictException('手机号已被使用');
    }
  }

  private async checkIdCardUnique(idCard: string, excludeId?: string) {
    const filter: any = { idCard };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const existing = await this.workerModel.findOne(filter).exec();
    if (existing) {
      throw new ConflictException('身份证号已被使用');
    }
  }

  async create(createWorkerDto: CreateWorkerDto): Promise<Worker> {
    if (!createWorkerDto.name || !createWorkerDto.name.trim()) {
      throw new BadRequestException('姓名不能为空');
    }
    if (!createWorkerDto.idCard) {
      throw new BadRequestException('身份证号不能为空');
    }
    if (!createWorkerDto.hireDate) {
      throw new BadRequestException('入职日期不能为空');
    }
    this.validatePhone(createWorkerDto.phone);
    this.validateIdCard(createWorkerDto.idCard);
    await this.checkPhoneUnique(createWorkerDto.phone);
    await this.checkIdCardUnique(createWorkerDto.idCard);

    const data: any = {
      ...createWorkerDto,
      status: createWorkerDto.status || 'off',
    };

    const createdWorker = new this.workerModel(data);
    return createdWorker.save();
  }

  async findAll(query: QueryWorkerDto): Promise<{ data: Worker[]; total: number; page: number; pageSize: number }> {
    const { status, community, skillId, page = 1, pageSize = 10, limit } = query;
    const actualPageSize = pageSize || limit || 10;
    const filter: any = {};
    if (status) filter.status = status;
    if (skillId) filter.skills = { $in: [new Types.ObjectId(skillId)] };
    if (community) filter.community = community;

    const skip = (page - 1) * actualPageSize;
    const [data, total] = await Promise.all([
      this.workerModel.find(filter).populate('skills').sort({ createdAt: -1 }).skip(skip).limit(actualPageSize).exec(),
      this.workerModel.countDocuments(filter).exec(),
    ]);
    return { data, total, page, pageSize: actualPageSize };
  }

  async findOne(id: string): Promise<Worker> {
    const worker = await this.workerModel.findById(id).populate('skills').exec();
    if (!worker) {
      throw new NotFoundException(`师傅 ID ${id} 不存在`);
    }
    return worker;
  }

  async update(id: string, updateWorkerDto: UpdateWorkerDto): Promise<Worker> {
    const existing = await this.workerModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`师傅 ID ${id} 不存在`);
    }

    if (updateWorkerDto.phone !== undefined) {
      this.validatePhone(updateWorkerDto.phone);
      await this.checkPhoneUnique(updateWorkerDto.phone, id);
    }
    if (updateWorkerDto.idCard !== undefined) {
      this.validateIdCard(updateWorkerDto.idCard);
      await this.checkIdCardUnique(updateWorkerDto.idCard, id);
    }
    if (updateWorkerDto.name !== undefined && !updateWorkerDto.name.trim()) {
      throw new BadRequestException('姓名不能为空');
    }
    if (updateWorkerDto.rating !== undefined) {
      if (typeof updateWorkerDto.rating !== 'number' || updateWorkerDto.rating < 0 || updateWorkerDto.rating > 5) {
        throw new BadRequestException('评分必须在 0-5 之间');
      }
    }

    const updatedWorker = await this.workerModel
      .findByIdAndUpdate(id, updateWorkerDto, { new: true, runValidators: true })
      .populate('skills')
      .exec();
    return updatedWorker;
  }

  async remove(id: string): Promise<Worker> {
    const deletedWorker = await this.workerModel.findByIdAndDelete(id).exec();
    if (!deletedWorker) {
      throw new NotFoundException(`师傅 ID ${id} 不存在`);
    }
    return deletedWorker;
  }

  async findBySkill(skillId: string): Promise<Worker[]> {
    return this.workerModel
      .find({ skills: { $in: [new Types.ObjectId(skillId)] }, status: 'on' })
      .populate('skills')
      .sort({ rating: -1, createdAt: -1 })
      .exec();
  }

  async findByCommunity(community: string): Promise<Worker[]> {
    return this.workerModel
      .find({ community, status: 'on' })
      .populate('skills')
      .sort({ rating: -1, createdAt: -1 })
      .exec();
  }

  async findAvailable(skillId?: string, community?: string): Promise<Worker[]> {
    const filter: any = { status: 'on' };
    if (skillId) filter.skills = { $in: [new Types.ObjectId(skillId)] };
    if (community) filter.community = community;
    return this.workerModel
      .find(filter)
      .populate('skills')
      .sort({ rating: -1, createdAt: -1 })
      .exec();
  }
}

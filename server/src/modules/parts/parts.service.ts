import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';
import { Part, PartDocument } from '../../schemas/part.schema';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { PartQueryDto } from './dto/part-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class PartsService {
  constructor(
    @InjectModel(Part.name) private partModel: Model<PartDocument>,
  ) {}

  async findAll(query: PartQueryDto): Promise<PaginatedResponse<Part>> {
    const { page = 1, pageSize = 10, keyword } = query;
    const filter: FilterQuery<PartDocument> = {};

    if (keyword) {
      filter.$or = [
        { code: { $regex: keyword, $options: 'i' } },
        { name: { $regex: keyword, $options: 'i' } },
        { brand: { $regex: keyword, $options: 'i' } },
        { model: { $regex: keyword, $options: 'i' } },
      ];
    }

    const total = await this.partModel.countDocuments(filter);
    const list = await this.partModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<Part> {
    const part = await this.partModel.findById(id).exec();
    if (!part) {
      throw new NotFoundException('配件不存在');
    }
    return part;
  }

  async create(createPartDto: CreatePartDto): Promise<Part> {
    await this.checkCodeUnique(createPartDto.code);
    const part = new this.partModel(createPartDto);
    return part.save();
  }

  async update(id: string, updatePartDto: UpdatePartDto): Promise<Part> {
    if (updatePartDto.code) {
      await this.checkCodeUnique(updatePartDto.code, id);
    }
    const part = await this.partModel
      .findByIdAndUpdate(id, updatePartDto, { new: true })
      .exec();
    if (!part) {
      throw new NotFoundException('配件不存在');
    }
    return part;
  }

  async remove(id: string): Promise<void> {
    const part = await this.partModel.findByIdAndDelete(id).exec();
    if (!part) {
      throw new NotFoundException('配件不存在');
    }
  }

  private async checkCodeUnique(code: string, excludeId?: string): Promise<void> {
    const filter: FilterQuery<PartDocument> = { code };
    if (excludeId) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const existing = await this.partModel.findOne(filter).exec();
    if (existing) {
      throw new ConflictException('配件编码已存在');
    }
  }
}

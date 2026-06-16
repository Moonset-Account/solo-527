import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemSetting } from './schemas/system-setting.schema';
import { CreateSystemSettingDto, UpdateSystemSettingDto, QuerySystemSettingDto } from './dto/system-setting.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class SystemSettingsService {
  constructor(
    @InjectModel(SystemSetting.name) private systemSettingModel: Model<SystemSetting>,
  ) {}

  async create(createSystemSettingDto: CreateSystemSettingDto): Promise<SystemSetting> {
    const existing = await this.systemSettingModel.findOne({ key: createSystemSettingDto.key });
    if (existing) {
      throw new BadRequestException('该配置键已存在');
    }
    const setting = new this.systemSettingModel(createSystemSettingDto);
    return setting.save();
  }

  async findAll(queryDto: QuerySystemSettingDto): Promise<PaginatedResult<SystemSetting>> {
    const { page = 1, pageSize = 10, keyword } = queryDto;
    const query: any = {};
    if (keyword) {
      query.$or = [
        { key: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }
    const total = await this.systemSettingModel.countDocuments(query);
    const list = await this.systemSettingModel
      .find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<SystemSetting> {
    const setting = await this.systemSettingModel.findById(id).exec();
    if (!setting) {
      throw new NotFoundException('配置不存在');
    }
    return setting;
  }

  async findByKey(key: string): Promise<SystemSetting> {
    const setting = await this.systemSettingModel.findOne({ key }).exec();
    if (!setting) {
      throw new NotFoundException('配置不存在');
    }
    return setting;
  }

  async update(
    id: string,
    updateSystemSettingDto: UpdateSystemSettingDto,
  ): Promise<SystemSetting> {
    const setting = await this.systemSettingModel
      .findByIdAndUpdate(id, updateSystemSettingDto, { new: true })
      .exec();
    if (!setting) {
      throw new NotFoundException('配置不存在');
    }
    return setting;
  }

  async updateByKey(key: string, value: string): Promise<SystemSetting> {
    const setting = await this.systemSettingModel
      .findOneAndUpdate({ key }, { value }, { new: true })
      .exec();
    if (!setting) {
      throw new NotFoundException('配置不存在');
    }
    return setting;
  }

  async remove(id: string): Promise<void> {
    const result = await this.systemSettingModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('配置不存在');
    }
  }
}

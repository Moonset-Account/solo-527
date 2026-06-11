import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service, ServiceDocument } from '../../schemas/service.schema';
import { CreateServiceDto, UpdateServiceDto, ServiceQueryDto } from '../../dto/service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel(Service.name) private serviceModel: Model<ServiceDocument>,
  ) {}

  private validateFields(dto: CreateServiceDto | UpdateServiceDto) {
    if ('price' in dto && dto.price !== undefined) {
      if (typeof dto.price !== 'number' || dto.price < 0) {
        throw new BadRequestException('价格必须是非负数字');
      }
    }
    if ('duration' in dto && dto.duration !== undefined) {
      if (typeof dto.duration !== 'number' || dto.duration < 0) {
        throw new BadRequestException('时长必须是非负数字');
      }
    }
    if ('name' in dto && dto.name !== undefined) {
      if (!dto.name || typeof dto.name !== 'string' || dto.name.trim().length === 0) {
        throw new BadRequestException('服务名称不能为空');
      }
    }
    if ('category' in dto && dto.category !== undefined) {
      if (!dto.category || typeof dto.category !== 'string' || dto.category.trim().length === 0) {
        throw new BadRequestException('分类不能为空');
      }
    }
  }

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    this.validateFields(createServiceDto);
    const data: any = {
      ...createServiceDto,
      enabled: createServiceDto.enabled !== undefined ? createServiceDto.enabled : true,
    };
    const createdService = new this.serviceModel(data);
    return createdService.save();
  }

  async findAll(query: ServiceQueryDto): Promise<{ data: Service[]; total: number; page: number; pageSize: number }> {
    const { category, enabled, page = 1, pageSize = 10 } = query;
    const filter: any = {};
    if (category) filter.category = category;
    if (enabled !== undefined) filter.enabled = enabled;

    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.serviceModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
      this.serviceModel.countDocuments(filter).exec(),
    ]);
    return { data, total, page, pageSize };
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceModel.findById(id).exec();
    if (!service) {
      throw new NotFoundException(`服务项目 ID ${id} 不存在`);
    }
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto): Promise<Service> {
    this.validateFields(updateServiceDto);
    const updateData: any = { ...updateServiceDto };
    if (updateServiceDto.enabled !== undefined) {
      updateData.enabled = updateServiceDto.enabled;
      delete updateData.enabled;
    }
    const updatedService = await this.serviceModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();
    if (!updatedService) {
      throw new NotFoundException(`服务项目 ID ${id} 不存在`);
    }
    return updatedService;
  }

  async remove(id: string): Promise<Service> {
    const deletedService = await this.serviceModel.findByIdAndDelete(id).exec();
    if (!deletedService) {
      throw new NotFoundException(`服务项目 ID ${id} 不存在`);
    }
    return deletedService;
  }

  async enable(id: string): Promise<Service> {
    const service = await this.serviceModel
      .findByIdAndUpdate(id, { enabled: true }, { new: true })
      .exec();
    if (!service) {
      throw new NotFoundException(`服务项目 ID ${id} 不存在`);
    }
    return service;
  }

  async disable(id: string): Promise<Service> {
    const service = await this.serviceModel
      .findByIdAndUpdate(id, { enabled: false }, { new: true })
      .exec();
    if (!service) {
      throw new NotFoundException(`服务项目 ID ${id} 不存在`);
    }
    return service;
  }

  async findByCategory(category: string): Promise<Service[]> {
    return this.serviceModel.find({ category, enabled: true }).sort({ createdAt: -1 }).exec();
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Service, ServiceDocument, ServiceStatus } from './service.schema';

@Injectable()
export class ServicesService {
  constructor(@InjectModel('Service') private serviceModel: Model<ServiceDocument>) {}

  async create(createServiceDto: Partial<Service>): Promise<Service> {
    const service = new this.serviceModel(createServiceDto);
    return service.save();
  }

  async findAll(query: any = {}): Promise<Service[]> {
    const filter: any = {};
    if (query.category) {
      filter.category = query.category;
    }
    if (query.status) {
      filter.status = query.status;
    }
    return this.serviceModel.find(filter).sort({ sort: 1, createdAt: -1 }).exec();
  }

  async findActive(): Promise<Service[]> {
    return this.serviceModel.find({ status: ServiceStatus.ACTIVE }).sort({ sort: 1 }).exec();
  }

  async findById(id: string): Promise<Service | null> {
    return this.serviceModel.findById(id).exec();
  }

  async update(id: string, updateServiceDto: Partial<Service>): Promise<Service | null> {
    return this.serviceModel
      .findByIdAndUpdate(id, updateServiceDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Service | null> {
    return this.serviceModel.findByIdAndDelete(id).exec();
  }
}

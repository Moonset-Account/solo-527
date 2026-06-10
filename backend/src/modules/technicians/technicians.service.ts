import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Technician, TechnicianDocument, TechnicianStatus } from './technician.schema';

@Injectable()
export class TechniciansService {
  constructor(@InjectModel('Technician') private technicianModel: Model<TechnicianDocument>) {}

  async create(createTechnicianDto: Partial<Technician>): Promise<Technician> {
    const technician = new this.technicianModel(createTechnicianDto);
    return technician.save();
  }

  async findAll(query: any = {}): Promise<Technician[]> {
    const filter: any = {};
    if (query.status) {
      filter.status = query.status;
    }
    return this.technicianModel.find(filter).sort({ sort: 1, createdAt: -1 }).exec();
  }

  async findActive(): Promise<Technician[]> {
    return this.technicianModel.find({ status: TechnicianStatus.ACTIVE }).sort({ sort: 1 }).exec();
  }

  async findById(id: string): Promise<Technician | null> {
    return this.technicianModel.findById(id).exec();
  }

  async findByServiceId(serviceId: string): Promise<Technician[]> {
    return this.technicianModel.find({
      status: TechnicianStatus.ACTIVE,
      serviceIds: serviceId,
    }).exec();
  }

  async update(id: string, updateTechnicianDto: Partial<Technician>): Promise<Technician | null> {
    return this.technicianModel
      .findByIdAndUpdate(id, updateTechnicianDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Technician | null> {
    return this.technicianModel.findByIdAndDelete(id).exec();
  }
}

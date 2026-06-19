import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';
import { Vehicle, VehicleDocument } from '../../schemas/vehicle.schema';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectModel(Vehicle.name) private vehicleModel: Model<VehicleDocument>,
  ) {}

  async findAll(query: VehicleQueryDto): Promise<PaginatedResponse<Vehicle>> {
    const { page = 1, pageSize = 10, keyword } = query;
    const filter: FilterQuery<VehicleDocument> = {};

    if (keyword) {
      filter.$or = [
        { plateNumber: { $regex: keyword, $options: 'i' } },
        { ownerName: { $regex: keyword, $options: 'i' } },
        { brand: { $regex: keyword, $options: 'i' } },
        { model: { $regex: keyword, $options: 'i' } },
      ];
    }

    const total = await this.vehicleModel.countDocuments(filter);
    const list = await this.vehicleModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();

    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleModel.findById(id).exec();
    if (!vehicle) {
      throw new NotFoundException('车辆不存在');
    }
    return vehicle;
  }

  async create(createVehicleDto: CreateVehicleDto): Promise<Vehicle> {
    await this.checkPlateNumberUnique(createVehicleDto.plateNumber);
    const vehicle = new this.vehicleModel(createVehicleDto);
    return vehicle.save();
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto): Promise<Vehicle> {
    if (updateVehicleDto.plateNumber) {
      await this.checkPlateNumberUnique(updateVehicleDto.plateNumber, id);
    }
    const vehicle = await this.vehicleModel
      .findByIdAndUpdate(id, updateVehicleDto, { new: true })
      .exec();
    if (!vehicle) {
      throw new NotFoundException('车辆不存在');
    }
    return vehicle;
  }

  async remove(id: string): Promise<void> {
    const vehicle = await this.vehicleModel.findByIdAndDelete(id).exec();
    if (!vehicle) {
      throw new NotFoundException('车辆不存在');
    }
  }

  async search(keyword: string, query: VehicleQueryDto): Promise<PaginatedResponse<Vehicle>> {
    return this.findAll({ ...query, keyword });
  }

  private async checkPlateNumberUnique(plateNumber: string, excludeId?: string): Promise<void> {
    const filter: FilterQuery<VehicleDocument> = { plateNumber };
    if (excludeId) {
      filter._id = { $ne: new Types.ObjectId(excludeId) };
    }
    const existing = await this.vehicleModel.findOne(filter).exec();
    if (existing) {
      throw new ConflictException('车牌号已存在');
    }
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Address, AddressDocument } from '../../schemas/address.schema';
import { User, UserDocument } from '../../schemas/user.schema';
import {
  CreateAddressDto,
  UpdateAddressDto,
  QueryAddressDto,
  SetDefaultDto,
} from '../../dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectModel(Address.name) private addressModel: Model<AddressDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private validatePhone(phone: string) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequestException('手机号格式不正确');
    }
  }

  private async validateUserExists(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException(`用户 ID ${userId} 不存在`);
    }
  }

  private async unsetOtherDefault(userId: Types.ObjectId, excludeId?: Types.ObjectId): Promise<void> {
    const filter: any = { userId, isDefault: true };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    await this.addressModel
      .updateMany(filter, { $set: { isDefault: false } })
      .exec();
  }

  private clearAddressRelatedCache(): void {
    this.cacheManager.store.keys('addresses:*').then((keys: string[]) => {
      keys.forEach((key: string) => {
        this.cacheManager.del(key);
      });
    });
  }

  async create(createAddressDto: CreateAddressDto): Promise<Address> {
    if (!createAddressDto.userId) {
      throw new BadRequestException('userId 不能为空');
    }
    if (!createAddressDto.contactName || !createAddressDto.contactName.trim()) {
      throw new BadRequestException('联系人姓名不能为空');
    }
    if (!createAddressDto.phone) {
      throw new BadRequestException('手机号不能为空');
    }
    this.validatePhone(createAddressDto.phone);
    if (!createAddressDto.province || !createAddressDto.province.trim()) {
      throw new BadRequestException('省份不能为空');
    }
    if (!createAddressDto.city || !createAddressDto.city.trim()) {
      throw new BadRequestException('城市不能为空');
    }
    if (!createAddressDto.district || !createAddressDto.district.trim()) {
      throw new BadRequestException('区县不能为空');
    }
    if (!createAddressDto.detail || !createAddressDto.detail.trim()) {
      throw new BadRequestException('详细地址不能为空');
    }

    await this.validateUserExists(createAddressDto.userId);

    const userIdObj = new Types.ObjectId(createAddressDto.userId);

    if (createAddressDto.isDefault) {
      await this.unsetOtherDefault(userIdObj);
    }

    const data: any = {
      ...createAddressDto,
      userId: userIdObj,
      isDefault: createAddressDto.isDefault || false,
    };

    const createdAddress = new this.addressModel(data);
    const saved = await createdAddress.save();
    this.clearAddressRelatedCache();
    return saved;
  }

  async findAll(query: QueryAddressDto): Promise<{ data: Address[]; total: number }> {
    if (!query.userId) {
      throw new BadRequestException('userId 为必填参数');
    }

    const filter: any = {
      userId: new Types.ObjectId(query.userId),
    };

    if (query.isDefault !== undefined) {
      filter.isDefault = query.isDefault;
    }

    const [data, total] = await Promise.all([
      this.addressModel.find(filter).sort({ updatedAt: -1 }).exec(),
      this.addressModel.countDocuments(filter).exec(),
    ]);
    return { data, total };
  }

  async findOne(id: string): Promise<Address> {
    const address = await this.addressModel.findById(id).exec();
    if (!address) {
      throw new NotFoundException(`地址 ID ${id} 不存在`);
    }
    return address;
  }

  async update(id: string, updateAddressDto: UpdateAddressDto): Promise<Address> {
    const existing = await this.addressModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`地址 ID ${id} 不存在`);
    }

    if (updateAddressDto.phone !== undefined) {
      this.validatePhone(updateAddressDto.phone);
    }
    if (updateAddressDto.contactName !== undefined && !updateAddressDto.contactName.trim()) {
      throw new BadRequestException('联系人姓名不能为空');
    }
    if (updateAddressDto.province !== undefined && !updateAddressDto.province.trim()) {
      throw new BadRequestException('省份不能为空');
    }
    if (updateAddressDto.city !== undefined && !updateAddressDto.city.trim()) {
      throw new BadRequestException('城市不能为空');
    }
    if (updateAddressDto.district !== undefined && !updateAddressDto.district.trim()) {
      throw new BadRequestException('区县不能为空');
    }
    if (updateAddressDto.detail !== undefined && !updateAddressDto.detail.trim()) {
      throw new BadRequestException('详细地址不能为空');
    }

    let userIdObj = existing.userId;
    if (updateAddressDto.userId !== undefined) {
      await this.validateUserExists(updateAddressDto.userId);
      userIdObj = new Types.ObjectId(updateAddressDto.userId);
    }

    if (updateAddressDto.isDefault === true) {
      await this.unsetOtherDefault(userIdObj, existing._id);
    }

    const updateData: any = { ...updateAddressDto };
    if (updateAddressDto.userId !== undefined) {
      updateData.userId = userIdObj;
    }

    const updatedAddress = await this.addressModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();
    this.clearAddressRelatedCache();
    return updatedAddress;
  }

  async setDefault(id: string, setDefaultDto: SetDefaultDto): Promise<Address> {
    const existing = await this.addressModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`地址 ID ${id} 不存在`);
    }

    if (!setDefaultDto.userId) {
      throw new BadRequestException('userId 不能为空');
    }

    const userIdObj = new Types.ObjectId(setDefaultDto.userId);

    await this.unsetOtherDefault(userIdObj, existing._id);

    const updatedAddress = await this.addressModel
      .findByIdAndUpdate(id, { isDefault: true }, { new: true, runValidators: true })
      .exec();
    this.clearAddressRelatedCache();
    return updatedAddress;
  }

  async remove(id: string): Promise<Address> {
    const deletedAddress = await this.addressModel.findByIdAndDelete(id).exec();
    if (!deletedAddress) {
      throw new NotFoundException(`地址 ID ${id} 不存在`);
    }
    this.clearAddressRelatedCache();
    return deletedAddress;
  }
}

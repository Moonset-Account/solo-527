import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DictionaryItem, DictionaryItemDocument } from './dictionary.schema';

@Injectable()
export class DictionaryService {
  constructor(
    @InjectModel('DictionaryItem') private dictionaryModel: Model<DictionaryItemDocument>,
  ) {}

  async create(createDto: Partial<DictionaryItem>, userId: string): Promise<DictionaryItem> {
    const item = new this.dictionaryModel({
      ...createDto,
      createdBy: userId,
      updatedBy: userId,
    });
    return item.save();
  }

  async findAll(query: any = {}): Promise<DictionaryItem[]> {
    const filter: any = {};
    if (query.dictType) {
      filter.dictType = query.dictType;
    }
    if (query.enabled !== undefined) {
      filter.enabled = query.enabled;
    }
    return this.dictionaryModel.find(filter).sort({ sort: 1, createdAt: -1 }).exec();
  }

  async findByType(dictType: string): Promise<DictionaryItem[]> {
    return this.dictionaryModel
      .find({ dictType, enabled: true })
      .sort({ sort: 1 })
      .exec();
  }

  async findById(id: string): Promise<DictionaryItem | null> {
    return this.dictionaryModel.findById(id).exec();
  }

  async update(id: string, updateDto: Partial<DictionaryItem>, userId: string): Promise<DictionaryItem | null> {
    updateDto.updatedBy = userId;
    return this.dictionaryModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<DictionaryItem | null> {
    return this.dictionaryModel.findByIdAndDelete(id).exec();
  }

  async batchCreate(items: Partial<DictionaryItem>[], userId: string): Promise<DictionaryItem[]> {
    const createdItems = items.map(item => ({
      ...item,
      createdBy: userId,
      updatedBy: userId,
    }));
    return this.dictionaryModel.create(createdItems);
  }

  async getDictTypes(): Promise<string[]> {
    const result = await this.dictionaryModel.distinct('dictType').exec();
    return result;
  }
}

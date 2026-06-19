import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Template, TemplateDocument } from '../../schemas/template.schema';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(Template.name) private templateModel: Model<TemplateDocument>,
  ) {}

  async findAll(): Promise<Template[]> {
    return this.templateModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Template> {
    const template = await this.templateModel.findById(id).exec();
    if (!template) {
      throw new NotFoundException('模板不存在');
    }
    return template;
  }

  async create(createTemplateDto: CreateTemplateDto): Promise<Template> {
    const template = new this.templateModel(createTemplateDto);
    return template.save();
  }

  async update(id: string, updateTemplateDto: UpdateTemplateDto): Promise<Template> {
    const template = await this.templateModel
      .findByIdAndUpdate(id, updateTemplateDto, { new: true })
      .exec();
    if (!template) {
      throw new NotFoundException('模板不存在');
    }
    return template;
  }

  async remove(id: string): Promise<void> {
    const template = await this.templateModel.findByIdAndDelete(id).exec();
    if (!template) {
      throw new NotFoundException('模板不存在');
    }
  }

  async toggle(id: string): Promise<Template> {
    const template = await this.templateModel.findById(id).exec();
    if (!template) {
      throw new NotFoundException('模板不存在');
    }
    template.isActive = !template.isActive;
    return template.save();
  }
}

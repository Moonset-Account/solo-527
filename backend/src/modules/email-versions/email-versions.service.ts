import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EmailVersion } from './schemas/email-version.schema';
import { CreateEmailVersionDto, QueryEmailVersionDto } from './dto/email-version.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class EmailVersionsService {
  constructor(
    @InjectModel(EmailVersion.name) private emailVersionModel: Model<EmailVersion>,
  ) {}

  async create(
    createEmailVersionDto: CreateEmailVersionDto,
    userId: string,
  ): Promise<EmailVersion> {
    const lastVersion = await this.emailVersionModel
      .findOne({ draftId: new Types.ObjectId(createEmailVersionDto.draftId) })
      .sort({ version: -1 })
      .exec();

    const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

    const version = new this.emailVersionModel({
      draftId: new Types.ObjectId(createEmailVersionDto.draftId),
      content: createEmailVersionDto.content,
      version: nextVersion,
      createdBy: new Types.ObjectId(userId),
      comment: createEmailVersionDto.comment,
    });
    return version.save();
  }

  async findByDraftId(
    queryDto: QueryEmailVersionDto,
  ): Promise<PaginatedResult<EmailVersion>> {
    const { page = 1, pageSize = 10, draftId } = queryDto;
    const query = { draftId: new Types.ObjectId(draftId) };
    const total = await this.emailVersionModel.countDocuments(query);
    const list = await this.emailVersionModel
      .find(query)
      .populate('createdBy', 'username email')
      .sort({ version: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .exec();
    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<EmailVersion> {
    const version = await this.emailVersionModel
      .findById(id)
      .populate('createdBy', 'username email')
      .exec();
    if (!version) {
      throw new NotFoundException('版本不存在');
    }
    return version;
  }

  async getLatestVersion(draftId: string): Promise<EmailVersion | null> {
    return this.emailVersionModel
      .findOne({ draftId: new Types.ObjectId(draftId) })
      .sort({ version: -1 })
      .populate('createdBy', 'username email')
      .exec();
  }
}

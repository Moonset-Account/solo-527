import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Exception, ExceptionDocument, ExceptionStatus } from '../../schemas/exception.schema';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { CloseExceptionDto } from './dto/close-exception.dto';
import { ExceptionQueryDto } from './dto/exception-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class ExceptionsService {
  constructor(
    @InjectModel(Exception.name) private exceptionModel: Model<ExceptionDocument>,
  ) {}

  async findAll(query: ExceptionQueryDto): Promise<PaginatedResponse<Exception>> {
    const { page, pageSize, sourceType, type, level, status, assigneeId } = query;
    const skip = (page - 1) * pageSize;

    const filter: any = {};
    if (sourceType) filter.sourceType = sourceType;
    if (type) filter.type = type;
    if (level) filter.level = level;
    if (status) filter.status = status;
    if (assigneeId) filter.assigneeId = new Types.ObjectId(assigneeId);

    const [list, total] = await Promise.all([
      this.exceptionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
      this.exceptionModel.countDocuments(filter).exec(),
    ]);

    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<Exception> {
    const exception = await this.exceptionModel.findById(id).exec();
    if (!exception) {
      throw new NotFoundException('异常记录不存在');
    }
    return exception;
  }

  async create(createExceptionDto: CreateExceptionDto): Promise<Exception> {
    const exception = new this.exceptionModel(createExceptionDto);
    return exception.save();
  }

  async process(id: string, user: CurrentUserPayload): Promise<Exception> {
    const exception = await this.exceptionModel.findById(id).exec();
    if (!exception) {
      throw new NotFoundException('异常记录不存在');
    }

    if (exception.status !== ExceptionStatus.OPEN) {
      throw new BadRequestException('只有待处理的异常可以开始处理');
    }

    exception.status = ExceptionStatus.PROCESSING;
    exception.assigneeId = new Types.ObjectId(user.id);

    return exception.save();
  }

  async close(id: string, closeExceptionDto: CloseExceptionDto, user: CurrentUserPayload): Promise<Exception> {
    const exception = await this.exceptionModel.findById(id).exec();
    if (!exception) {
      throw new NotFoundException('异常记录不存在');
    }

    if (exception.status === ExceptionStatus.CLOSED) {
      throw new BadRequestException('该异常已关闭');
    }

    if (!closeExceptionDto.closeReason || closeExceptionDto.closeReason.trim() === '') {
      throw new BadRequestException('关闭原因不能为空');
    }

    exception.status = ExceptionStatus.CLOSED;
    exception.closeReason = closeExceptionDto.closeReason;
    exception.closedBy = new Types.ObjectId(user.id);
    exception.closedAt = new Date();

    return exception.save();
  }
}

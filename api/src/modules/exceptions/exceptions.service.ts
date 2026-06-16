import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExceptionOrder } from '../../entities/exception-order.entity.js';
import { CreateExceptionDto } from './dto/create-exception.dto.js';
import { UpdateExceptionDto } from './dto/update-exception.dto.js';
import { ResolveExceptionDto } from './dto/resolve-exception.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { PaginatedResult } from '../../common/types/paginated-result.type.js';

@Injectable()
export class ExceptionsService {
  constructor(
    @InjectRepository(ExceptionOrder)
    private readonly exceptionOrderRepo: Repository<ExceptionOrder>,
  ) {}

  async create(dto: CreateExceptionDto): Promise<ExceptionOrder> {
    const exception = this.exceptionOrderRepo.create(dto);
    return this.exceptionOrderRepo.save(exception);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<ExceptionOrder>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.exceptionOrderRepo.findAndCount({
      where,
      relations: ['room', 'resolver'],
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<ExceptionOrder> {
    const exception = await this.exceptionOrderRepo.findOne({ where: { id }, relations: ['room', 'resolver'] });
    if (!exception) throw new NotFoundException(`ExceptionOrder #${id} not found`);
    return exception;
  }

  async update(id: number, dto: UpdateExceptionDto): Promise<ExceptionOrder> {
    const exception = await this.findOne(id);
    Object.assign(exception, dto);
    return this.exceptionOrderRepo.save(exception);
  }

  async remove(id: number): Promise<void> {
    const exception = await this.findOne(id);
    await this.exceptionOrderRepo.remove(exception);
  }

  async resolve(id: number, dto: ResolveExceptionDto): Promise<ExceptionOrder> {
    const exception = await this.findOne(id);
    if (!dto.resolutionNote || dto.resolutionNote.trim().length === 0) {
      throw new BadRequestException('resolutionNote must be provided');
    }
    if (exception.status === 'resolved' || exception.status === 'closed') {
      throw new BadRequestException(`Exception is already ${exception.status}`);
    }
    exception.status = 'resolved';
    exception.resolvedBy = dto.resolvedBy;
    exception.resolutionNote = dto.resolutionNote;
    exception.resolvedAt = new Date();
    return this.exceptionOrderRepo.save(exception);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { PaginationDto, PaginatedResult } from '../dto/pagination.dto';

@Injectable()
export abstract class BaseCrudService<T> {
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly entityName: string = '记录',
  ) {}

  async findAll(pagination?: PaginationDto, where?: FindOptionsWhere<T>): Promise<PaginatedResult<T>> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const queryWhere: FindOptionsWhere<T> = { ...where } as FindOptionsWhere<T>;

    if (pagination?.keyword) {
      const keywordField = this.getKeywordField();
      if (keywordField) {
        (queryWhere as any)[keywordField] = ILike(`%${pagination.keyword}%`);
      }
    }

    const [list, total] = await this.repository.findAndCount({
      where: queryWhere,
      skip,
      take: pageSize,
      order: pagination?.sortBy
        ? { [pagination.sortBy]: pagination.sortOrder || 'DESC' } as any
        : { createdAt: 'DESC' } as any,
    });

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string): Promise<T> {
    const entity = await this.repository.findOne({ where: { id } as any });
    if (!entity) {
      throw new NotFoundException(`${this.entityName}不存在`);
    }
    return entity;
  }

  async create(dto: any, createdBy?: string): Promise<T> {
    const entity = this.repository.create({
      ...dto,
      createdBy,
      updatedBy: createdBy,
    } as any);
    return (await this.repository.save(entity as any)) as T;
  }

  async update(id: string, dto: any, updatedBy?: string): Promise<T> {
    const entity = await this.findOne(id);
    this.repository.merge(entity as any, {
      ...dto,
      updatedBy,
    });
    return await this.repository.save(entity);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`${this.entityName}不存在`);
    }
  }

  protected getKeywordField(): string | null {
    return null;
  }
}

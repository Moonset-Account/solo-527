import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { PriceList } from '../../entities';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PriceListService extends BaseCrudService<PriceList> {
  constructor(
    @InjectRepository(PriceList)
    protected readonly repository: Repository<PriceList>,
  ) {
    super(repository, '价目表');
  }

  async findByCustomerId(customerId: string, pagination?: PaginationDto): Promise<PaginatedResult<PriceList>> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: FindOptionsWhere<PriceList> = {
      customerId,
    } as FindOptionsWhere<PriceList>;

    if (pagination?.keyword) {
      (where as any).productName = ILike(`%${pagination.keyword}%`);
    }

    const [list, total] = await this.repository.findAndCount({
      where,
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' } as any,
    });

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findActiveByCustomerId(customerId: string): Promise<PriceList[]> {
    return this.repository.find({
      where: {
        customerId,
        status: 'active',
      } as FindOptionsWhere<PriceList>,
      order: { productName: 'ASC' } as any,
    });
  }

  async findByProductName(customerId: string, productName: string): Promise<PriceList | null> {
    return this.repository.findOne({
      where: {
        customerId,
        productName: ILike(`%${productName}%`),
      } as FindOptionsWhere<PriceList>,
    });
  }

  async updateStatus(id: string, status: 'active' | 'inactive', updatedBy?: string): Promise<PriceList> {
    return this.update(id, { status }, updatedBy);
  }

  protected override getKeywordField(): string {
    return 'productName';
  }
}

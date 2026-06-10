import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Customer, PriceList } from '../../entities';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CustomerService extends BaseCrudService<Customer> {
  constructor(
    @InjectRepository(Customer)
    protected readonly repository: Repository<Customer>,
    @InjectRepository(PriceList)
    private readonly priceListRepository: Repository<PriceList>,
  ) {
    super(repository, '客户');
  }

  async search(pagination: PaginationDto, filters?: {
    name?: string;
    contactPerson?: string;
    phone?: string;
  }): Promise<PaginatedResult<Customer>> {
    const where: FindOptionsWhere<Customer> = {} as FindOptionsWhere<Customer>;

    if (filters?.name) {
      (where as any).name = ILike(`%${filters.name}%`);
    }
    if (filters?.contactPerson) {
      (where as any).contactPerson = ILike(`%${filters.contactPerson}%`);
    }
    if (filters?.phone) {
      (where as any).phone = ILike(`%${filters.phone}%`);
    }

    return this.findAll(pagination, where);
  }

  async findByName(name: string): Promise<Customer | null> {
    return this.repository.findOne({ where: { name } as FindOptionsWhere<Customer> });
  }

  async findByContactPerson(contactPerson: string): Promise<Customer[]> {
    return this.repository.find({
      where: { contactPerson: ILike(`%${contactPerson}%`) } as FindOptionsWhere<Customer>,
    });
  }

  async getCustomerPriceLists(customerId: string, pagination?: PaginationDto): Promise<PaginatedResult<PriceList>> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: FindOptionsWhere<PriceList> = {
      customerId,
    } as FindOptionsWhere<PriceList>;

    if (pagination?.keyword) {
      (where as any).productName = ILike(`%${pagination.keyword}%`);
    }

    const [list, total] = await this.priceListRepository.findAndCount({
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

  protected override getKeywordField(): string {
    return 'name';
  }
}

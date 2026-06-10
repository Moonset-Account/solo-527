import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class UserService extends BaseCrudService<User> implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    protected readonly repository: Repository<User>,
  ) {
    super(repository, '用户');
  }

  async onModuleInit() {
    await this.initDefaultUsers();
  }

  private async initDefaultUsers() {
    const defaultUsers: Partial<User>[] = [
      {
        username: 'admin',
        name: '管理员',
        phone: '13800000001',
        role: 'admin',
        isActive: true,
      },
      {
        username: 'sales1',
        name: '销售1',
        phone: '13800000002',
        role: 'sales',
        isActive: true,
      },
      {
        username: 'production1',
        name: '生产1',
        phone: '13800000003',
        role: 'production',
        isActive: true,
      },
      {
        username: 'quality1',
        name: '质检1',
        phone: '13800000004',
        role: 'quality',
        isActive: true,
      },
      {
        username: 'warehouse1',
        name: '仓库1',
        phone: '13800000005',
        role: 'warehouse',
        isActive: true,
      },
    ];

    for (const user of defaultUsers) {
      const exists = await this.repository.findOne({
        where: { username: user.username },
      });
      if (!exists) {
        await this.repository.save(user as User);
      }
    }
  }

  async findByRole(role: UserRole, pagination?: PaginationDto): Promise<PaginatedResult<User>> {
    return this.findAll(pagination, { role });
  }

  protected override getKeywordField(): string {
    return 'name';
  }
}

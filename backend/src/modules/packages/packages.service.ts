import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from './package.entity';
import { OperationLogService } from '../../common/services/operation-log.service';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private packagesRepository: Repository<Package>,
    private operationLogService: OperationLogService,
  ) {}

  findAll(activeOnly = false): Promise<Package[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.packagesRepository.find({
      where,
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  findOne(id: string): Promise<Package | null> {
    return this.packagesRepository.findOneBy({ id });
  }

  async create(
    pkg: Partial<Package>,
    operatorId?: string,
    operatorName?: string,
    ipAddress?: string,
  ): Promise<Package> {
    const newPackage = this.packagesRepository.create(pkg);
    const saved = await this.packagesRepository.save(newPackage);

    if (operatorId && operatorName) {
      await this.operationLogService.log(
        operatorId,
        operatorName,
        'create',
        'package',
        saved.id,
        { name: pkg.name, price: pkg.price },
        ipAddress,
      );
    }

    return saved;
  }

  async update(
    id: string,
    pkg: Partial<Package>,
    operatorId?: string,
    operatorName?: string,
    ipAddress?: string,
  ): Promise<Package | null> {
    await this.packagesRepository.update(id, pkg);
    const result = await this.findOne(id);

    if (operatorId && operatorName) {
      await this.operationLogService.log(
        operatorId,
        operatorName,
        'update',
        'package',
        id,
        { changes: Object.keys(pkg).join(', ') },
        ipAddress,
      );
    }

    return result;
  }

  async remove(
    id: string,
    operatorId?: string,
    operatorName?: string,
    ipAddress?: string,
  ): Promise<void> {
    await this.packagesRepository.delete(id);

    if (operatorId && operatorName) {
      await this.operationLogService.log(
        operatorId,
        operatorName,
        'delete',
        'package',
        id,
        {},
        ipAddress,
      );
    }
  }
}

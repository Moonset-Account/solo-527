import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Package } from './package.entity';

@Injectable()
export class PackagesService {
  constructor(
    @InjectRepository(Package)
    private packagesRepository: Repository<Package>,
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

  create(pkg: Partial<Package>): Promise<Package> {
    const newPackage = this.packagesRepository.create(pkg);
    return this.packagesRepository.save(newPackage);
  }

  async update(id: string, pkg: Partial<Package>): Promise<Package | null> {
    await this.packagesRepository.update(id, pkg);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.packagesRepository.delete(id);
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Material } from './entities/material.entity';
import { CreateMaterialDto, UpdateMaterialDto, QueryMaterialsDto, UpdateLicenseDto } from './dto/material.dto';
import { MaterialStatus, MaterialCategory } from '../../common/enums/material.enum';
import { UserRole } from '../../common/enums/user.enum';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private materialsRepository: Repository<Material>,
  ) {}

  async create(createMaterialDto: CreateMaterialDto, photographerId: string) {
    const material = this.materialsRepository.create({
      ...createMaterialDto,
      photographerId,
      createdBy: photographerId,
      status: MaterialStatus.DRAFT,
    });
    return this.materialsRepository.save(material);
  }

  async findAll(query: QueryMaterialsDto, userId?: string, userRole?: string) {
    const { status, category, photographerId, keyword, tag, page, pageSize } = query;
    const p = parseInt(page, 10) || 1;
    const ps = parseInt(pageSize, 10) || 20;

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (photographerId) where.photographerId = photographerId;

    if (userRole === UserRole.PHOTOGRAPHER && userId) {
      where.photographerId = userId;
    }

    let queryBuilder = this.materialsRepository.createQueryBuilder('m')
      .leftJoinAndSelect('m.photographer', 'photographer')
      .where(where);

    if (keyword) {
      queryBuilder.andWhere('(m.title ILIKE :keyword OR m.description ILIKE :keyword)', { keyword: `%${keyword}%` });
    }

    if (tag) {
      queryBuilder.andWhere('m.tags::text LIKE :tag', { tag: `%${tag}%` });
    }

    const [list, total] = await queryBuilder
      .orderBy('m.createdAt', 'DESC')
      .skip((p - 1) * ps)
      .take(ps)
      .getManyAndCount();

    return { list, total, page: p, pageSize: ps };
  }

  async findPublic(query: QueryMaterialsDto) {
    const q: QueryMaterialsDto = { ...query, status: MaterialStatus.ON_SHELF };
    return this.findAll(q);
  }

  async findOne(id: string) {
    const material = await this.materialsRepository.findOne({
      where: { id },
      relations: ['photographer', 'attachments'],
    });
    if (!material) throw new NotFoundException('素材不存在');
    return material;
  }

  async update(id: string, updateMaterialDto: UpdateMaterialDto, userId: string, userRole: string) {
    const material = await this.findOne(id);
    if (userRole !== UserRole.ADMIN && material.photographerId !== userId) {
      throw new ForbiddenException('无权修改此素材');
    }
    Object.assign(material, updateMaterialDto, { updatedBy: userId });
    return this.materialsRepository.save(material);
  }

  async updateLicense(id: string, dto: UpdateLicenseDto, userId: string, userRole: string) {
    return this.update(id, dto as UpdateMaterialDto, userId, userRole);
  }

  async putOnShelf(id: string, userId: string, userRole: string) {
    return this.update(id, { status: MaterialStatus.ON_SHELF }, userId, userRole);
  }

  async putOffShelf(id: string, userId: string, userRole: string) {
    return this.update(id, { status: MaterialStatus.OFF_SHELF }, userId, userRole);
  }

  async remove(id: string, userId: string, userRole: string) {
    const material = await this.findOne(id);
    if (userRole !== UserRole.ADMIN && material.photographerId !== userId) {
      throw new ForbiddenException('无权删除此素材');
    }
    await this.materialsRepository.delete(id);
    return { success: true };
  }

  async incrementView(id: string) {
    await this.materialsRepository.increment({ id }, 'viewCount', 1);
  }

  async incrementSale(ids: string[]) {
    if (ids.length === 0) return;
    await this.materialsRepository
      .createQueryBuilder()
      .update(Material)
      .set({ saleCount: () => 'sale_count + 1' })
      .where({ id: In(ids) })
      .execute();
  }

  async findByIds(ids: string[]) {
    return this.materialsRepository.findByIds(ids);
  }
}

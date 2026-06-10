import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { MaterialCost } from './material-cost.entity';
import { CreateMaterialCostDto } from './dto/create-material-cost.dto';
import { UpdateMaterialCostDto } from './dto/update-material-cost.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class MaterialCostService {
  constructor(
    @InjectRepository(MaterialCost)
    private materialCostRepository: Repository<MaterialCost>,
  ) {}

  async findAll(paginationDto: PaginationDto, projectId?: number, month?: string): Promise<PaginatedResult<MaterialCost>> {
    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0];
      where.purchaseDate = Between(startDate, endDate);
    }

    const [list, total] = await this.materialCostRepository.findAndCount({
      where,
      relations: ['project'],
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<MaterialCost> {
    const materialCost = await this.materialCostRepository.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!materialCost) {
      throw new NotFoundException(`MaterialCost with id ${id} not found`);
    }
    return materialCost;
  }

  async findByProjectId(projectId: number): Promise<MaterialCost[]> {
    return this.materialCostRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(createDto: CreateMaterialCostDto): Promise<MaterialCost> {
    const materialCost = this.materialCostRepository.create(createDto);
    if (!materialCost.totalPrice && materialCost.quantity && materialCost.unitPrice) {
      materialCost.totalPrice = materialCost.quantity * materialCost.unitPrice;
    }
    return this.materialCostRepository.save(materialCost);
  }

  async update(id: number, updateDto: UpdateMaterialCostDto): Promise<MaterialCost> {
    const materialCost = await this.findOne(id);
    Object.assign(materialCost, updateDto);
    if (!materialCost.totalPrice && materialCost.quantity && materialCost.unitPrice) {
      materialCost.totalPrice = materialCost.quantity * materialCost.unitPrice;
    }
    return this.materialCostRepository.save(materialCost);
  }

  async remove(id: number): Promise<void> {
    const result = await this.materialCostRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`MaterialCost with id ${id} not found`);
    }
  }

  async getTotalCostByProjectId(projectId: number): Promise<number> {
    const result = await this.materialCostRepository
      .createQueryBuilder('materialCost')
      .select('SUM(materialCost.totalPrice)', 'total')
      .where('materialCost.projectId = :projectId', { projectId })
      .getRawOne();
    return parseFloat(result?.total || 0);
  }

  async getMonthlyCostReport(projectId?: number, month?: string): Promise<any[]> {
    const query = this.materialCostRepository
      .createQueryBuilder('materialCost')
      .select('materialCost.materialName', 'materialName')
      .addSelect('SUM(materialCost.quantity)', 'totalQuantity')
      .addSelect('SUM(materialCost.totalPrice)', 'totalAmount')
      .addSelect('materialCost.unit', 'unit')
      .groupBy('materialCost.materialName')
      .addGroupBy('materialCost.unit');

    if (projectId) {
      query.andWhere('materialCost.projectId = :projectId', { projectId });
    }

    if (month) {
      const [year, monthNum] = month.split('-');
      const startDate = `${year}-${monthNum}-01`;
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0];
      query.andWhere('materialCost.purchaseDate BETWEEN :startDate AND :endDate', { startDate, endDate });
    }

    return query.getRawMany();
  }
}

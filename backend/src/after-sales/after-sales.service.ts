import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AfterSales } from './after-sales.entity';
import { CreateAfterSalesDto } from './dto/create-after-sales.dto';
import { UpdateAfterSalesDto } from './dto/update-after-sales.dto';
import { ProcessAfterSalesDto } from './dto/process-after-sales.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { AfterSalesStatus } from '../common/enums/after-sales-status.enum';

@Injectable()
export class AfterSalesService {
  constructor(
    @InjectRepository(AfterSales)
    private afterSalesRepository: Repository<AfterSales>,
  ) {}

  async findAll(paginationDto: PaginationDto, projectId?: number, status?: string, type?: string): Promise<PaginatedResult<AfterSales>> {
    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }

    const [list, total] = await this.afterSalesRepository.findAndCount({
      where,
      relations: ['project'],
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<AfterSales> {
    const afterSales = await this.afterSalesRepository.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!afterSales) {
      throw new NotFoundException(`AfterSales with id ${id} not found`);
    }
    return afterSales;
  }

  async findByProjectId(projectId: number): Promise<AfterSales[]> {
    return this.afterSalesRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(createDto: CreateAfterSalesDto): Promise<AfterSales> {
    const afterSales = this.afterSalesRepository.create({
      ...createDto,
      reportTime: new Date(),
    });
    return this.afterSalesRepository.save(afterSales);
  }

  async update(id: number, updateDto: UpdateAfterSalesDto): Promise<AfterSales> {
    const afterSales = await this.findOne(id);
    const updateData: any = { ...updateDto };
    
    if (updateDto.handler && !afterSales.handler) {
      updateData.handleTime = new Date();
    }
    
    Object.assign(afterSales, updateData);
    return this.afterSalesRepository.save(afterSales);
  }

  async process(id: number, processDto: ProcessAfterSalesDto): Promise<AfterSales> {
    const afterSales = await this.findOne(id);
    afterSales.solution = processDto.solution;
    if (processDto.cost !== undefined) {
      afterSales.cost = processDto.cost;
    }
    if (processDto.handler) {
      afterSales.handler = processDto.handler;
    }
    afterSales.handleTime = new Date();
    afterSales.status = processDto.status || AfterSalesStatus.PROCESSING;
    return this.afterSalesRepository.save(afterSales);
  }

  async remove(id: number): Promise<void> {
    const result = await this.afterSalesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`AfterSales with id ${id} not found`);
    }
  }
}

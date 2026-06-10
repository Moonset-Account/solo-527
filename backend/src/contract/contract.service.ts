import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from './contract.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
  ) {}

  async findAll(paginationDto: PaginationDto, projectId?: number): Promise<PaginatedResult<Contract>> {
    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }

    const [list, total] = await this.contractRepository.findAndCount({
      where,
      relations: ['project'],
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!contract) {
      throw new NotFoundException(`Contract with id ${id} not found`);
    }
    return contract;
  }

  async findByProjectId(projectId: number): Promise<Contract[]> {
    return this.contractRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(createContractDto: CreateContractDto): Promise<Contract> {
    const contract = this.contractRepository.create({
      ...createContractDto,
      handleTime: new Date(),
    });
    return this.contractRepository.save(contract);
  }

  async update(id: number, updateContractDto: UpdateContractDto): Promise<Contract> {
    const contract = await this.findOne(id);
    Object.assign(contract, updateContractDto, { handleTime: new Date() });
    return this.contractRepository.save(contract);
  }

  async remove(id: number): Promise<void> {
    const result = await this.contractRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Contract with id ${id} not found`);
    }
  }
}

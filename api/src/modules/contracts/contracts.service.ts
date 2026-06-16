import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../../entities/contract.entity.js';
import { ContractTemplate } from '../../entities/contract-template.entity.js';
import { Room } from '../../entities/room.entity.js';
import { CreateContractDto } from './dto/create-contract.dto.js';
import { UpdateContractDto } from './dto/update-contract.dto.js';
import { SignContractDto } from './dto/sign-contract.dto.js';
import { CreateContractTemplateDto } from './dto/create-contract-template.dto.js';
import { UpdateContractTemplateDto } from './dto/update-contract-template.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { PaginatedResult } from '../../common/types/paginated-result.type.js';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
    @InjectRepository(ContractTemplate)
    private readonly templateRepo: Repository<ContractTemplate>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
  ) {}

  async create(dto: CreateContractDto): Promise<Contract> {
    const contract = this.contractRepo.create({
      ...dto,
      status: 'draft',
    });
    return this.contractRepo.save(contract);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Contract>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.contractRepo.findAndCount({
      where,
      relations: ['room', 'tenant', 'owner', 'template'],
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Contract> {
    const contract = await this.contractRepo.findOne({ where: { id }, relations: ['room', 'tenant', 'owner', 'template'] });
    if (!contract) throw new NotFoundException(`Contract #${id} not found`);
    return contract;
  }

  async update(id: number, dto: UpdateContractDto): Promise<Contract> {
    const contract = await this.findOne(id);
    Object.assign(contract, dto);
    return this.contractRepo.save(contract);
  }

  async remove(id: number): Promise<void> {
    const contract = await this.findOne(id);
    await this.contractRepo.remove(contract);
  }

  async sign(id: number, dto: SignContractDto): Promise<Contract> {
    const contract = await this.findOne(id);

    if (dto.signedBy === 'owner') {
      if (contract.status !== 'draft') {
        throw new BadRequestException(`Contract must be in draft status for owner to sign, current: ${contract.status}`);
      }
      contract.status = 'owner_signed';
    } else if (dto.signedBy === 'tenant') {
      if (contract.status !== 'owner_signed') {
        throw new BadRequestException(`Contract must be in owner_signed status for tenant to sign, current: ${contract.status}`);
      }
      contract.status = 'tenant_signed';
      contract.signedAt = new Date();

      await this.roomRepo.update(contract.roomId, { status: 'rented' });

      contract.status = 'archived';
    }

    return this.contractRepo.save(contract);
  }

  async findAllTemplates(query: PaginationQueryDto): Promise<PaginatedResult<ContractTemplate>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.isActive = query.status === 'active' ? true : false;
    }

    const [data, total] = await this.templateRepo.findAndCount({
      where,
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOneTemplate(id: number): Promise<ContractTemplate> {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException(`ContractTemplate #${id} not found`);
    return template;
  }

  async createTemplate(dto: CreateContractTemplateDto): Promise<ContractTemplate> {
    const template = this.templateRepo.create(dto);
    return this.templateRepo.save(template);
  }

  async updateTemplate(id: number, dto: UpdateContractTemplateDto): Promise<ContractTemplate> {
    const template = await this.findOneTemplate(id);
    Object.assign(template, dto);
    return this.templateRepo.save(template);
  }

  async removeTemplate(id: number): Promise<void> {
    const template = await this.findOneTemplate(id);
    await this.templateRepo.remove(template);
  }
}

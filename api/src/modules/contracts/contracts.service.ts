import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract } from '../../entities/contract.entity.js';
import { Room } from '../../entities/room.entity.js';
import { CreateContractDto } from './dto/create-contract.dto.js';
import { UpdateContractDto } from './dto/update-contract.dto.js';
import { SignContractDto } from './dto/sign-contract.dto.js';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
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

  async findAll(): Promise<Contract[]> {
    return this.contractRepo.find({ relations: ['room', 'tenant', 'owner', 'template'], order: { id: 'ASC' } });
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
}

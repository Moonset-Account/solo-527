import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentSlotConfig } from '../../entities/appointment-slot-config.entity.js';
import { WorkflowNodeConfig } from '../../entities/workflow-node-config.entity.js';
import { CreateAppointmentSlotDto } from './dto/create-appointment-slot.dto.js';
import { UpdateAppointmentSlotDto } from './dto/update-appointment-slot.dto.js';
import { CreateWorkflowNodeDto } from './dto/create-workflow-node.dto.js';
import { UpdateWorkflowNodeDto } from './dto/update-workflow-node.dto.js';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(AppointmentSlotConfig)
    private readonly slotConfigRepo: Repository<AppointmentSlotConfig>,
    @InjectRepository(WorkflowNodeConfig)
    private readonly workflowNodeRepo: Repository<WorkflowNodeConfig>,
  ) {}

  async findAllSlots(): Promise<AppointmentSlotConfig[]> {
    return this.slotConfigRepo.find({ order: { id: 'ASC' } });
  }

  async findOneSlot(id: number): Promise<AppointmentSlotConfig> {
    const slot = await this.slotConfigRepo.findOne({ where: { id } });
    if (!slot) throw new NotFoundException(`AppointmentSlotConfig #${id} not found`);
    return slot;
  }

  async createSlot(dto: CreateAppointmentSlotDto): Promise<AppointmentSlotConfig> {
    const slot = this.slotConfigRepo.create(dto);
    return this.slotConfigRepo.save(slot);
  }

  async updateSlot(id: number, dto: UpdateAppointmentSlotDto): Promise<AppointmentSlotConfig> {
    const slot = await this.findOneSlot(id);
    Object.assign(slot, dto);
    return this.slotConfigRepo.save(slot);
  }

  async removeSlot(id: number): Promise<void> {
    const slot = await this.findOneSlot(id);
    await this.slotConfigRepo.remove(slot);
  }

  async findAllWorkflowNodes(): Promise<WorkflowNodeConfig[]> {
    return this.workflowNodeRepo.find({ order: { orderNum: 'ASC' } });
  }

  async findOneWorkflowNode(id: number): Promise<WorkflowNodeConfig> {
    const node = await this.workflowNodeRepo.findOne({ where: { id } });
    if (!node) throw new NotFoundException(`WorkflowNodeConfig #${id} not found`);
    return node;
  }

  async createWorkflowNode(dto: CreateWorkflowNodeDto): Promise<WorkflowNodeConfig> {
    const node = this.workflowNodeRepo.create(dto);
    return this.workflowNodeRepo.save(node);
  }

  async updateWorkflowNode(id: number, dto: UpdateWorkflowNodeDto): Promise<WorkflowNodeConfig> {
    const node = await this.findOneWorkflowNode(id);
    Object.assign(node, dto);
    return this.workflowNodeRepo.save(node);
  }

  async removeWorkflowNode(id: number): Promise<void> {
    const node = await this.findOneWorkflowNode(id);
    await this.workflowNodeRepo.remove(node);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VacancyStats } from '../../entities/vacancy-stats.entity.js';
import { VacancyAlert } from '../../entities/vacancy-alert.entity.js';
import { VacancyAlertConfig } from '../../entities/vacancy-alert-config.entity.js';
import { CreateVacancyAlertConfigDto } from './dto/create-vacancy-alert-config.dto.js';
import { UpdateVacancyAlertConfigDto } from './dto/update-vacancy-alert-config.dto.js';

@Injectable()
export class VacancyService {
  constructor(
    @InjectRepository(VacancyStats)
    private readonly vacancyStatsRepo: Repository<VacancyStats>,
    @InjectRepository(VacancyAlert)
    private readonly vacancyAlertRepo: Repository<VacancyAlert>,
    @InjectRepository(VacancyAlertConfig)
    private readonly vacancyAlertConfigRepo: Repository<VacancyAlertConfig>,
  ) {}

  async getStats(days?: number): Promise<VacancyStats[]> {
    if (days) {
      const since = new Date();
      since.setDate(since.getDate() - days);
      return this.vacancyStatsRepo.find({
        where: { statsDate: since.toISOString().split('T')[0] },
        relations: ['room'],
        order: { id: 'ASC' },
      });
    }
    return this.vacancyStatsRepo.find({ relations: ['room'], order: { id: 'ASC' } });
  }

  async getAlerts(): Promise<VacancyAlert[]> {
    return this.vacancyAlertRepo.find({ relations: ['room', 'config'], order: { id: 'ASC' } });
  }

  async readAlert(id: number): Promise<VacancyAlert> {
    const alert = await this.vacancyAlertRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException(`VacancyAlert #${id} not found`);
    alert.status = 'read';
    alert.readAt = new Date();
    return this.vacancyAlertRepo.save(alert);
  }

  async findAllAlertConfigs(): Promise<VacancyAlertConfig[]> {
    return this.vacancyAlertConfigRepo.find({ order: { id: 'ASC' } });
  }

  async findOneAlertConfig(id: number): Promise<VacancyAlertConfig> {
    const config = await this.vacancyAlertConfigRepo.findOne({ where: { id } });
    if (!config) throw new NotFoundException(`VacancyAlertConfig #${id} not found`);
    return config;
  }

  async createAlertConfig(dto: CreateVacancyAlertConfigDto): Promise<VacancyAlertConfig> {
    const config = this.vacancyAlertConfigRepo.create(dto);
    return this.vacancyAlertConfigRepo.save(config);
  }

  async updateAlertConfig(id: number, dto: UpdateVacancyAlertConfigDto): Promise<VacancyAlertConfig> {
    const config = await this.findOneAlertConfig(id);
    Object.assign(config, dto);
    return this.vacancyAlertConfigRepo.save(config);
  }

  async removeAlertConfig(id: number): Promise<void> {
    const config = await this.findOneAlertConfig(id);
    await this.vacancyAlertConfigRepo.remove(config);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VacancyStats } from '../../entities/vacancy-stats.entity.js';
import { VacancyAlert } from '../../entities/vacancy-alert.entity.js';
import { VacancyAlertConfig } from '../../entities/vacancy-alert-config.entity.js';
import { Room } from '../../entities/room.entity.js';
import { CreateVacancyAlertConfigDto } from './dto/create-vacancy-alert-config.dto.js';
import { UpdateVacancyAlertConfigDto } from './dto/update-vacancy-alert-config.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { PaginatedResult } from '../../common/types/paginated-result.type.js';

export interface DailyVacancyStat {
  date: string;
  totalRooms: number;
  vacantRooms: number;
  vacancyRate: number;
}

export interface VacancyAlertDto {
  id: number;
  projectArea: string;
  vacancyRate: number;
  threshold: number;
  triggeredAt: Date;
  isRead: boolean;
}

@Injectable()
export class VacancyService {
  constructor(
    @InjectRepository(VacancyStats)
    private readonly vacancyStatsRepo: Repository<VacancyStats>,
    @InjectRepository(VacancyAlert)
    private readonly vacancyAlertRepo: Repository<VacancyAlert>,
    @InjectRepository(VacancyAlertConfig)
    private readonly vacancyAlertConfigRepo: Repository<VacancyAlertConfig>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
  ) {}

  async getStats(days?: number): Promise<DailyVacancyStat[]> {
    const queryDays = days || 30;
    const result: DailyVacancyStat[] = [];
    const totalRooms = await this.roomRepo.count();

    for (let i = queryDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayStats = await this.vacancyStatsRepo.find({
        where: { statsDate: dateStr },
      });

      let vacantRooms = 0;
      if (dayStats.length > 0) {
        const avgRate = dayStats.reduce((sum, s) => sum + Number(s.vacancyRate), 0) / dayStats.length;
        vacantRooms = Math.round((avgRate / 100) * totalRooms);
      } else {
        const vacantRoomCount = await this.roomRepo.count({ where: { status: 'vacant' } });
        vacantRooms = vacantRoomCount;
      }

      const vacancyRate = totalRooms > 0 ? Number(((vacantRooms / totalRooms) * 100).toFixed(2)) : 0;

      result.push({
        date: dateStr,
        totalRooms,
        vacantRooms,
        vacancyRate,
      });
    }

    return result;
  }

  async getAlerts(query: PaginationQueryDto): Promise<PaginatedResult<VacancyAlertDto>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [alerts, total] = await this.vacancyAlertRepo.findAndCount({
      where,
      relations: ['room'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const data = alerts.map((alert) => ({
      id: alert.id,
      projectArea: alert.projectArea || alert.room?.name || '未知区域',
      vacancyRate: Number(alert.vacancyRate),
      threshold: Number(alert.threshold),
      triggeredAt: alert.createdAt,
      isRead: alert.isRead,
    }));

    return { data, total, page, limit };
  }

  async readAlert(id: number): Promise<VacancyAlert> {
    const alert = await this.vacancyAlertRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException(`VacancyAlert #${id} not found`);
    alert.status = 'read';
    alert.readAt = new Date();
    alert.isRead = true;
    return this.vacancyAlertRepo.save(alert);
  }

  async findAllAlertConfigs(query: PaginationQueryDto): Promise<PaginatedResult<VacancyAlertConfig>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.isEnabled = query.status === 'active' ? true : false;
    }

    const [data, total] = await this.vacancyAlertConfigRepo.findAndCount({
      where,
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
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

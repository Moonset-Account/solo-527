import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VacancyStats } from '../../entities/vacancy-stats.entity.js';
import { VacancyAlert } from '../../entities/vacancy-alert.entity.js';
import { VacancyAlertConfig } from '../../entities/vacancy-alert-config.entity.js';
import { VacancyController } from './vacancy.controller.js';
import { VacancyService } from './vacancy.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([VacancyStats, VacancyAlert, VacancyAlertConfig])],
  controllers: [VacancyController],
  providers: [VacancyService],
  exports: [VacancyService],
})
export class VacancyModule {}

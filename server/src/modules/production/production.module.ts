import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductionNode, ProductionProgress, Team, TeamSchedule } from '../../entities';
import {
  ProductionNodeService,
  ProductionProgressService,
  TeamService,
  TeamScheduleService,
} from './production.service';
import {
  ProductionNodeController,
  ProductionProgressController,
  TeamController,
  TeamScheduleController,
} from './production.controller';
import { SystemConfigModule } from '../system-config/system-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductionNode, ProductionProgress, Team, TeamSchedule]),
    SystemConfigModule,
  ],
  providers: [
    ProductionNodeService,
    ProductionProgressService,
    TeamService,
    TeamScheduleService,
  ],
  controllers: [
    ProductionNodeController,
    ProductionProgressController,
    TeamController,
    TeamScheduleController,
  ],
  exports: [
    ProductionNodeService,
    ProductionProgressService,
    TeamService,
    TeamScheduleService,
  ],
})
export class ProductionModule {}

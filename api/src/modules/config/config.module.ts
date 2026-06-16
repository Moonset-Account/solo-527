import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentSlotConfig } from '../../entities/appointment-slot-config.entity.js';
import { WorkflowNodeConfig } from '../../entities/workflow-node-config.entity.js';
import { ConfigController } from './config.controller.js';
import { ConfigService } from './config.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([AppointmentSlotConfig, WorkflowNodeConfig])],
  controllers: [ConfigController],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}

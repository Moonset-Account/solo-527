import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Property } from './entities/property.entity';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { RoomStatusLogsModule } from '../room-status-logs/room-status-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Property]),
    AuditLogsModule,
    RoomStatusLogsModule,
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}

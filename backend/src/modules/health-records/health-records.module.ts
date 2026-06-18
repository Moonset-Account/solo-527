import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthRecordsController } from './health-records.controller';
import { HealthRecordsService } from './health-records.service';
import { HealthRecord } from '../../entities/health-record.entity';
import { OperationLog } from '../../entities/operation-log.entity';
import { User } from '../../entities/user.entity';
import { Pet } from '../../entities/pet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HealthRecord, OperationLog, User, Pet])],
  controllers: [HealthRecordsController],
  providers: [HealthRecordsService],
  exports: [HealthRecordsService],
})
export class HealthRecordsModule {}

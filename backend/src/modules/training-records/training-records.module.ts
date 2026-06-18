import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingRecordsController } from './training-records.controller';
import { TrainingRecordsService } from './training-records.service';
import { TrainingRecord } from '../../entities/training-record.entity';
import { OperationLog } from '../../entities/operation-log.entity';
import { User } from '../../entities/user.entity';
import { Pet } from '../../entities/pet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingRecord, OperationLog, User, Pet])],
  controllers: [TrainingRecordsController],
  providers: [TrainingRecordsService],
  exports: [TrainingRecordsService],
})
export class TrainingRecordsModule {}

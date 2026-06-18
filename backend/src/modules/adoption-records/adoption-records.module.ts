import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdoptionRecordsController } from './adoption-records.controller';
import { AdoptionRecordsService } from './adoption-records.service';
import { AdoptionRecord } from '../../entities/adoption-record.entity';
import { OperationLog } from '../../entities/operation-log.entity';
import { User } from '../../entities/user.entity';
import { Pet } from '../../entities/pet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdoptionRecord, OperationLog, User, Pet])],
  controllers: [AdoptionRecordsController],
  providers: [AdoptionRecordsService],
  exports: [AdoptionRecordsService],
})
export class AdoptionRecordsModule {}

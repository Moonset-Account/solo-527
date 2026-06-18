import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FosterRecordsController } from './foster-records.controller';
import { FosterRecordsService } from './foster-records.service';
import { FosterRecord } from '../../entities/foster-record.entity';
import { OperationLog } from '../../entities/operation-log.entity';
import { User } from '../../entities/user.entity';
import { Pet } from '../../entities/pet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FosterRecord, OperationLog, User, Pet])],
  controllers: [FosterRecordsController],
  providers: [FosterRecordsService],
  exports: [FosterRecordsService],
})
export class FosterRecordsModule {}

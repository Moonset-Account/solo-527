import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefundsService } from './refunds.service';
import { RefundsController } from './refunds.controller';
import { Refund } from '../../entities/refund.entity';
import { Appointment } from '../../entities/appointment.entity';
import { User } from '../../entities/user.entity';
import { ProcessingRecord } from '../../entities/processing-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Refund, Appointment, User, ProcessingRecord])],
  controllers: [RefundsController],
  providers: [RefundsService],
  exports: [RefundsService],
})
export class RefundsModule {}

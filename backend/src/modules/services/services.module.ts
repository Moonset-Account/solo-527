import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { Service } from '../../entities/service.entity';
import { Counselor } from '../../entities/counselor.entity';
import { ProcessingRecord } from '../../entities/processing-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Counselor, ProcessingRecord])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}

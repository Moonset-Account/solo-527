import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { Service } from '../../entities/service.entity';
import { OperationLog } from '../../entities/operation-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service, OperationLog])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}

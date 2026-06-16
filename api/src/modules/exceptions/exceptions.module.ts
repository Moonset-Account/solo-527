import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExceptionOrder } from '../../entities/exception-order.entity.js';
import { ExceptionsController } from './exceptions.controller.js';
import { ExceptionsService } from './exceptions.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ExceptionOrder])],
  controllers: [ExceptionsController],
  providers: [ExceptionsService],
  exports: [ExceptionsService],
})
export class ExceptionsModule {}

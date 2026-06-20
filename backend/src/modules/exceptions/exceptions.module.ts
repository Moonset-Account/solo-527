import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExceptionsService } from './exceptions.service';
import { ExceptionsController } from './exceptions.controller';
import { ExceptionRecord } from './entities/exception-record.entity';
import { UsersModule } from '../users/users.module';
import { AttachmentsModule } from '../attachments/attachments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExceptionRecord]),
    UsersModule,
    AttachmentsModule,
  ],
  controllers: [ExceptionsController],
  providers: [ExceptionsService],
  exports: [TypeOrmModule, ExceptionsService],
})
export class ExceptionsModule {}

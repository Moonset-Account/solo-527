import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExceptionsController } from './exceptions.controller';
import { ExceptionsService } from './exceptions.service';
import { Exception, ExceptionSchema } from '../../schemas/exception.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Exception.name, schema: ExceptionSchema }]),
  ],
  controllers: [ExceptionsController],
  providers: [ExceptionsService],
  exports: [ExceptionsService],
})
export class ExceptionsModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessException, AccessExceptionSchema } from './access-exception.schema';
import { AccessExceptionsService } from './access-exceptions.service';
import { AccessExceptionsController } from './access-exceptions.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: AccessException.name, schema: AccessExceptionSchema }])],
  controllers: [AccessExceptionsController],
  providers: [AccessExceptionsService],
})
export class AccessExceptionsModule {}

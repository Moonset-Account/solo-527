import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OperationController } from './operation.controller';
import { OperationService } from './operation.service';
import { PlatformAccount, PlatformAccountSchema } from './schemas/platform-account.schema';
import { Material, MaterialSchema } from './schemas/material.schema';
import { Schedule, ScheduleSchema } from './schemas/schedule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlatformAccount.name, schema: PlatformAccountSchema },
      { name: Material.name, schema: MaterialSchema },
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
  ],
  controllers: [OperationController],
  providers: [OperationService],
  exports: [OperationService],
})
export class OperationModule {}

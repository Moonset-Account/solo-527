import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Reagent, ReagentSchema } from './schemas/reagent.schema';
import { ReagentService } from './reagent.service';
import { ReagentController } from './reagent.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Reagent.name, schema: ReagentSchema }]),
    forwardRef(() => NotificationModule),
  ],
  controllers: [ReagentController],
  providers: [ReagentService],
  exports: [ReagentService],
})
export class ReagentModule {}

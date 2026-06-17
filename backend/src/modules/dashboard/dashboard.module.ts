import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OriginalDocument, OriginalDocumentSchema } from './schemas/original-document.schema';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { UsersModule } from '../users/users.module';
import { ReagentModule } from '../reagent/reagent.module';
import { ApplicationModule } from '../application/application.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OriginalDocument.name, schema: OriginalDocumentSchema }]),
    UsersModule,
    forwardRef(() => ReagentModule),
    forwardRef(() => ApplicationModule),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

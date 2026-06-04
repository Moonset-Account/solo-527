import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from '../../entities/quote.entity';
import { QuoteVersion } from '../../entities/quote-version.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { CustomerRequirement } from '../../entities/customer-requirement.entity';
import { QuoteService } from './quote.service';
import { QuoteController } from './quote.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quote, QuoteVersion, AuditLog, CustomerRequirement]),
    NotificationModule,
  ],
  providers: [QuoteService],
  controllers: [QuoteController],
  exports: [QuoteService],
})
export class QuoteModule {}

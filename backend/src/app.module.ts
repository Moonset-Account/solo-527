import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bull';
import { dataSourceOptions } from './database/typeorm.config';
import { CommonModule } from './common/common.module';
import { CustomerModule } from './modules/customer/customer.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { BillModule } from './modules/bill/bill.module';
import { CollectionModule } from './modules/collection/collection.module';
import { CashForecastModule } from './modules/cash-forecast/cash-forecast.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { ExportModule } from './modules/export/export.module';
import { AuditModule } from './modules/audit/audit.module';
import { AttachmentModule } from './modules/attachment/attachment.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSourceOptions),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    CommonModule,
    CustomerModule,
    SubscriptionModule,
    BillModule,
    CollectionModule,
    CashForecastModule,
    InvoiceModule,
    ReconciliationModule,
    ExportModule,
    AuditModule,
    AttachmentModule,
    DashboardModule,
  ],
})
export class AppModule {}

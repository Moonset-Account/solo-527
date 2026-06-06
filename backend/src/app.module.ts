import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { DemandModule } from './modules/demand/demand.module';
import { QuoteModule } from './modules/quote/quote.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { ContractModule } from './modules/contract/contract.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ExportModule } from './modules/export/export.module';
import { QueueModule } from './queues/queue.module';
import { StorageModule } from './storage/storage.module';
import { User } from './entities/user.entity';
import { Demand } from './entities/demand.entity';
import { Quote } from './entities/quote.entity';
import { QuoteItem } from './entities/quote-item.entity';
import { Supplier } from './entities/supplier.entity';
import { Contract } from './entities/contract.entity';
import { ApprovalLog } from './entities/approval-log.entity';
import { PaymentNode } from './entities/payment-node.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'travel_quote',
      entities: [User, Demand, Quote, QuoteItem, Supplier, Contract, ApprovalLog, PaymentNode],
      synchronize: false,
      migrationsRun: false,
      logging: false,
    }),
    QueueModule,
    StorageModule,
    AuthModule,
    DemandModule,
    QuoteModule,
    SupplierModule,
    ContractModule,
    DashboardModule,
    FinanceModule,
    ExportModule,
  ],
})
export class AppModule {}

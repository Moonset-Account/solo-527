import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { ProjectModule } from './project/project.module.js';
import { BudgetModule } from './budget/budget.module.js';
import { ContractModule } from './contract/contract.module.js';
import { FeedbackModule } from './feedback/feedback.module.js';
import { AfterSaleModule } from './after-sale/after-sale.module.js';
import { NotificationModule } from './notification/notification.module.js';
import { ExportModule } from './export/export.module.js';
import { FileModule } from './file/file.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'renovation_budget',
      autoLoadEntities: true,
      synchronize: true,
    }),
    AuthModule,
    ProjectModule,
    BudgetModule,
    ContractModule,
    FeedbackModule,
    AfterSaleModule,
    NotificationModule,
    ExportModule,
    FileModule,
  ],
})
export class AppModule {}

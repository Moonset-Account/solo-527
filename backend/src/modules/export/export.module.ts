import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { PropertiesModule } from '../properties/properties.module';
import { LeasesModule } from '../leases/leases.module';
import { BillsModule } from '../bills/bills.module';
import { DepositsModule } from '../deposits/deposits.module';

@Module({
  imports: [
    PropertiesModule,
    LeasesModule,
    BillsModule,
    DepositsModule,
  ],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}

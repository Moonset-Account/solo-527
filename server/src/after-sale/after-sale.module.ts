import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AfterSaleController } from './after-sale.controller.js';
import { AfterSaleService } from './after-sale.service.js';
import { AfterSaleOrder } from './after-sale.entity.js';
import { ExportModule } from '../export/export.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([AfterSaleOrder]), ExportModule],
  controllers: [AfterSaleController],
  providers: [AfterSaleService],
  exports: [AfterSaleService],
})
export class AfterSaleModule {}

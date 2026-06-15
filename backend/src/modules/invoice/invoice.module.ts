import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '@/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice])],
  controllers: [],
  providers: [],
  exports: [],
})
export class InvoiceModule {}

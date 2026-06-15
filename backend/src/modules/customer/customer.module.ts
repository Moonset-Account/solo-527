import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '@/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  controllers: [],
  providers: [],
  exports: [],
})
export class CustomerModule {}

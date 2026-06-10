import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialShortage } from '../../entities';
import { MaterialShortageService } from './shortage.service';
import { MaterialShortageController } from './shortage.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaterialShortage]),
  ],
  providers: [MaterialShortageService],
  controllers: [MaterialShortageController],
  exports: [MaterialShortageService],
})
export class ShortageModule {}

import { Module } from '@nestjs/common';
import { GapService } from './gap.service';
import { GapController } from './gap.controller';

@Module({
  controllers: [GapController],
  providers: [GapService],
})
export class GapModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WaitlistRulesService } from './waitlist-rules.service';
import { WaitlistRulesController } from './waitlist-rules.controller';
import { WaitlistRule } from '../../entities/waitlist-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WaitlistRule])],
  controllers: [WaitlistRulesController],
  providers: [WaitlistRulesService],
  exports: [WaitlistRulesService],
})
export class WaitlistRulesModule {}

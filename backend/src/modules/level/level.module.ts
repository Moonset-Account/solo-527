import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LevelService } from './level.service';
import { LevelController } from './level.controller';
import { LevelRule, LevelRuleSchema } from './level.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: LevelRule.name, schema: LevelRuleSchema }]),
  ],
  controllers: [LevelController],
  providers: [LevelService],
  exports: [LevelService],
})
export class LevelModule {}

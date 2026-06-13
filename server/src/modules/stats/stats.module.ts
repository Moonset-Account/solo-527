import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { Content, ContentSchema } from '../content/schemas/content.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Content.name, schema: ContentSchema }])],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TagsController } from './tags.controller.js';
import { TagsService } from './tags.service.js';
import { Tag, TagSchema } from './tag.schema.js';
import { Lead, LeadSchema } from '../leads/lead.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tag.name, schema: TagSchema },
      { name: Lead.name, schema: LeadSchema },
    ]),
  ],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}

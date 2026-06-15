import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from '@/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Attachment])],
  controllers: [],
  providers: [],
  exports: [],
})
export class AttachmentModule {}

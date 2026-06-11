import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileController } from './file.controller.js';
import { FileService } from './file.service.js';
import { Attachment } from './attachment.entity.js';
import { ProjectPhoto } from './project-photo.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Attachment, ProjectPhoto])],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}

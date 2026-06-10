import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StagePhoto } from './stage-photo.entity';
import { StagePhotoService } from './stage-photo.service';
import { StagePhotoController } from './stage-photo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StagePhoto])],
  controllers: [StagePhotoController],
  providers: [StagePhotoService],
  exports: [StagePhotoService, TypeOrmModule],
})
export class StagePhotoModule {}

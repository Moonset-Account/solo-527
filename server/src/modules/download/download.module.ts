import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DownloadController } from './download.controller';
import { DownloadService } from './download.service';
import { DownloadDetail, DownloadDetailSchema } from '../../schemas/download-detail.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: DownloadDetail.name, schema: DownloadDetailSchema }])],
  controllers: [DownloadController],
  providers: [DownloadService],
  exports: [DownloadService],
})
export class DownloadModule {}

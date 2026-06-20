import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DownloadService } from './download.service';
import { QueryDownloadDto } from './download.dto';

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get('details')
  findAll(@Query() query: QueryDownloadDto) {
    return this.downloadService.findAll(query);
  }

  @Get('export')
  async export(@Query() query: QueryDownloadDto, @Res() res: Response) {
    const buffer = await this.downloadService.exportAsXlsx(query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=download-details.xlsx');
    res.send(buffer);
  }
}

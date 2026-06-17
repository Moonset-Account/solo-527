import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ExportService, ExportType } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post(':type')
  async export(
    @Param('type') type: ExportType,
    @Body() query: any,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.export(type, query);

    const fileName = `${type}_${Date.now()}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    );
    res.setHeader('Content-Length', buffer.length);

    res.status(HttpStatus.OK).send(buffer);
  }
}

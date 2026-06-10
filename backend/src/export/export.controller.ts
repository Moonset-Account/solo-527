import { Controller, Get, Param, Res, ParseIntPipe, Query } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';

@Controller('export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('project/:id')
  async exportProject(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const data = await this.exportService.exportProject(id);
    const fileName = `project-${id}-archive-${Date.now()}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(JSON.stringify(data, null, 2));
  }

  @Get('material-cost')
  async exportMaterialCost(
    @Query('projectId') projectId?: string,
    @Query('month') month?: string,
  ) {
    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;
    return this.exportService.exportMaterialCost(projectIdNum, month);
  }

  @Get('monthly/:month')
  async exportMonthly(@Param('month') month: string) {
    return this.exportService.exportMonthlyReport(month);
  }
}

import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { StatisticsService } from './statistics.service';
import { StatisticsQueryDto, ExportQueryDto } from './dto/statistics.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user.enum';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.PHOTOGRAPHER)
  getDashboard(@Query() query: StatisticsQueryDto) {
    return this.statisticsService.getDashboard(query);
  }

  @Get('trend')
  @Roles(UserRole.ADMIN, UserRole.PHOTOGRAPHER)
  getTrend(@Query() query: StatisticsQueryDto) {
    return this.statisticsService.getTrend(query);
  }

  @Get('satisfaction')
  @Roles(UserRole.ADMIN, UserRole.PHOTOGRAPHER)
  getSatisfactionStats(@Query() query: StatisticsQueryDto) {
    return this.statisticsService.getSatisfactionStats(query);
  }

  @Get('export')
  @Roles(UserRole.ADMIN)
  async export(@Query() query: ExportQueryDto, @Res() res: Response) {
    const { workbook, filename } = await this.statisticsService.export(query);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
    await workbook.xlsx.write(res);
    res.end();
  }
}

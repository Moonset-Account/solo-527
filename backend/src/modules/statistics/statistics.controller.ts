import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { StatisticsQueryDto } from './dto/statistics.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('statistics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  async getOverview(@Query() queryDto: StatisticsQueryDto) {
    return this.statisticsService.getOverview(queryDto);
  }

  @Get('by-person')
  @Roles('admin')
  async getByPerson(@Query() queryDto: StatisticsQueryDto) {
    return this.statisticsService.getByPerson(queryDto);
  }

  @Get('by-date')
  async getByDate(@Query() queryDto: StatisticsQueryDto) {
    return this.statisticsService.getByDate(queryDto);
  }

  @Get('by-low-confidence-reason')
  @Roles('admin')
  async getByLowConfidenceReason(@Query() queryDto: StatisticsQueryDto) {
    return this.statisticsService.getByLowConfidenceReason(queryDto);
  }

  @Get('call-logs')
  @Roles('admin')
  async getCallLogsStatistics(@Query() queryDto: StatisticsQueryDto) {
    return this.statisticsService.getCallLogsStatistics(queryDto);
  }
}

import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
@UseGuards(AuthGuard('jwt'))
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('service-repurchase')
  async getServiceRepurchase(
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    return this.statisticsService.getServiceRepurchaseStatistics(
      startTime ? new Date(startTime) : undefined,
      endTime ? new Date(endTime) : undefined,
    );
  }

  @Get('foster-safety')
  async getFosterSafety(
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    return this.statisticsService.getFosterSafetyStatistics(
      startTime ? new Date(startTime) : undefined,
      endTime ? new Date(endTime) : undefined,
    );
  }

  @Get('appointment-overview')
  async getAppointmentOverview(
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    return this.statisticsService.getAppointmentOverview(
      startTime ? new Date(startTime) : undefined,
      endTime ? new Date(endTime) : undefined,
    );
  }

  @Get('adoption-overview')
  async getAdoptionOverview(
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
  ) {
    return this.statisticsService.getAdoptionOverview(
      startTime ? new Date(startTime) : undefined,
      endTime ? new Date(endTime) : undefined,
    );
  }
}

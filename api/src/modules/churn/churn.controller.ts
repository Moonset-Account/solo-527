import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ChurnService } from './churn.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('churn')
@UseGuards(JwtAuthGuard)
export class ChurnController {
  constructor(private churnService: ChurnService) {}

  @Get('reasons')
  async getReasons() {
    return this.churnService.getReasons();
  }

  @Get('stats')
  async getStats() {
    return this.churnService.getStats();
  }

  @Get('trend')
  async getTrend(@Query('months') months?: string) {
    return this.churnService.getTrend(months ? parseInt(months, 10) : 6);
  }

  @Get('warnings')
  async getWarnings() {
    return this.churnService.getWarnings();
  }
}

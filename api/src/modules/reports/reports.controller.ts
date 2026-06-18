import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('lead-quality')
  async getLeadQuality() {
    return this.reportsService.getLeadQuality();
  }

  @Get('contract-pending')
  async getContractPending() {
    return this.reportsService.getContractPending();
  }

  @Get('processing-time')
  async getProcessingTime() {
    return this.reportsService.getProcessingTime();
  }

  @Get('performance')
  async getPerformance() {
    return this.reportsService.getPerformance();
  }

  @Get('responsible-person')
  async getResponsiblePerson() {
    return this.reportsService.getPerformance();
  }
}

import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('exports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('interview-details')
  @Roles(Role.ADMIN, Role.HR)
  exportInterviewDetails(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('interviewerId') interviewerId?: string,
    @Query('keyword') keyword?: string,
    @CurrentUser() user?: any,
    @Res() res?: Response,
  ) {
    return this.exportsService.exportInterviewDetails(
      { startDate, endDate, status, interviewerId, keyword },
      user.id,
      res,
    );
  }

  @Get('assessment-stats')
  @Roles(Role.ADMIN, Role.HR)
  exportAssessmentStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('interviewerId') interviewerId?: string,
    @CurrentUser() user?: any,
    @Res() res?: Response,
  ) {
    return this.exportsService.exportAssessmentStats(
      { startDate, endDate, interviewerId },
      user.id,
      res,
    );
  }
}

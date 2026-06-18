import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CheckIn } from './checkin.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('checkins')
@UseGuards(JwtAuthGuard)
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Get()
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ): Promise<{ data: CheckIn[]; total: number }> {
    return this.checkinsService.findAll(
      startDate,
      endDate,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('today')
  getTodayCheckins(): Promise<CheckIn[]> {
    return this.checkinsService.getTodayCheckins();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<CheckIn | null> {
    return this.checkinsService.findOne(id);
  }

  @Post()
  checkIn(
    @Body() body: { appointmentId: string; notes?: string },
    @CurrentUser() user: any,
  ): Promise<CheckIn> {
    return this.checkinsService.checkIn(
      body.appointmentId,
      user.sub,
      user.name,
      body.notes,
    );
  }
}

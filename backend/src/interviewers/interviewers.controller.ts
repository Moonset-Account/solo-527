import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { InterviewersService } from './interviewers.service';
import { CreateScheduleDto, CreateScheduleBatchDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SearchDto } from '../common/dto/search.dto';

@Controller('interviewers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterviewersController {
  constructor(private readonly interviewersService: InterviewersService) {}

  @Post('schedules')
  @Roles(Role.ADMIN, Role.HR)
  createSchedule(@Body() createScheduleDto: CreateScheduleDto, @CurrentUser() user: any) {
    return this.interviewersService.createSchedule(createScheduleDto, user.id);
  }

  @Post('schedules/batch')
  @Roles(Role.ADMIN, Role.HR)
  createScheduleBatch(@Body() dto: CreateScheduleBatchDto, @CurrentUser() user: any) {
    return this.interviewersService.createScheduleBatch(dto, user.id);
  }

  @Get('schedules')
  findSchedules(@Query() searchDto: SearchDto) {
    return this.interviewersService.findSchedules(searchDto);
  }

  @Get('schedules/available')
  findAvailableSchedules(
    @Query('interviewerId') interviewerId?: string,
    @Query('date') date?: string,
  ) {
    return this.interviewersService.findAvailableSchedules(interviewerId, date);
  }

  @Get('schedules/:id')
  findScheduleById(@Param('id') id: string) {
    return this.interviewersService.findScheduleById(id);
  }

  @Patch('schedules/:id')
  @Roles(Role.ADMIN, Role.HR)
  updateSchedule(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @CurrentUser() user: any,
  ) {
    return this.interviewersService.updateSchedule(id, updateScheduleDto, user.id);
  }

  @Delete('schedules/:id')
  @Roles(Role.ADMIN, Role.HR)
  deleteSchedule(@Param('id') id: string, @CurrentUser() user: any) {
    return this.interviewersService.deleteSchedule(id, user.id);
  }

  @Get(':id/stats')
  getInterviewerStats(@Param('id') id: string) {
    return this.interviewersService.getInterviewerStats(id);
  }
}

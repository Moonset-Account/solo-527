import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto, QuickCreateInterviewDto } from './dto/create-interview.dto';
import { UpdateInterviewDto, UpdateInterviewStatusDto } from './dto/update-interview.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SearchDto } from '../common/dto/search.dto';

@Controller('interviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  create(@Body() createInterviewDto: CreateInterviewDto, @CurrentUser() user: any) {
    return this.interviewsService.create(createInterviewDto, user.id);
  }

  @Post('quick')
  quickCreate(@Body() dto: QuickCreateInterviewDto, @CurrentUser() user: any) {
    return this.interviewsService.quickCreate(dto, user.id);
  }

  @Get()
  findAll(@Query() searchDto: SearchDto, @CurrentUser() user: any) {
    return this.interviewsService.findAll(searchDto, user);
  }

  @Get('today')
  getTodayInterviews(@Query('interviewerId') interviewerId?: string) {
    return this.interviewsService.getTodayInterviews(interviewerId);
  }

  @Get('statistics')
  @Roles(Role.ADMIN, Role.HR)
  getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.interviewsService.getStatistics(startDate, endDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.interviewsService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInterviewDto: UpdateInterviewDto,
    @CurrentUser() user: any,
  ) {
    return this.interviewsService.update(id, updateInterviewDto, user.id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInterviewStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.interviewsService.updateStatus(id, dto, user.id);
  }

  @Post(':id/checkin')
  checkIn(@Param('id') id: string, @CurrentUser() user: any) {
    return this.interviewsService.checkIn(id, user.id);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body('reason') reason?: string,
    @CurrentUser() user?: any,
  ) {
    return this.interviewsService.cancel(id, user.id, reason);
  }
}

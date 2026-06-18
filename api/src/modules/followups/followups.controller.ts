import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { FollowupsService } from './followups.service.js';
import { CreateFollowupDto } from './dto/create-followup.dto.js';
import { UpdateFollowupDto } from './dto/update-followup.dto.js';
import { QueryFollowupDto } from './dto/query-followup.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('followups')
@UseGuards(JwtAuthGuard)
export class FollowupsController {
  constructor(private followupsService: FollowupsService) {}

  @Get()
  async findAll(@Query() query: QueryFollowupDto) {
    return this.followupsService.findAll(query);
  }

  @Get('calendar')
  async getCalendar(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.followupsService.getCalendar(startDate, endDate);
  }

  @Post()
  async create(@Body() createFollowupDto: CreateFollowupDto, @Req() req: any) {
    return this.followupsService.create(createFollowupDto, req.user.userId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateFollowupDto: UpdateFollowupDto) {
    return this.followupsService.update(id, updateFollowupDto);
  }
}

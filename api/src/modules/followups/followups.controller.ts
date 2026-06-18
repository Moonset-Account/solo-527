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
    const calendar = await this.followupsService.getCalendar(startDate, endDate);
    const events: any[] = [];
    for (const [date, followups] of Object.entries(calendar)) {
      for (const f of followups as any[]) {
        const now = new Date();
        const scheduled = new Date(f.scheduledAt);
        let urgency = 'upcoming';
        if (scheduled < now) urgency = 'overdue';
        else if (scheduled.toDateString() === now.toDateString()) urgency = 'today';
        events.push({
          id: f._id,
          date,
          leadName: (f.leadId as any)?.customerName || '',
          type: f.type,
          urgency,
        });
      }
    }
    return events;
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

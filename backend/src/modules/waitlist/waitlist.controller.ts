import { Controller, Get, Post, Body, Put, Param, Query, UseGuards, Req } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('waitlist')
@UseGuards(JwtAuthGuard)
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post('join')
  joinWaitlist(@Body() joinDto: any, @Req() req) {
    return this.waitlistService.joinWaitlist(joinDto, req.user.userId);
  }

  @Get()
  findAll(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query() filters: any,
  ) {
    return this.waitlistService.findAll(page, pageSize, filters);
  }

  @Get('my')
  findMyWaitlist(
    @Req() req,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ) {
    return this.waitlistService.findByClient(req.user.userId, page, pageSize);
  }

  @Get('position')
  getQueuePosition(
    @Query('counselorId') counselorId: string,
    @Query('preferredDate') preferredDate: string,
  ) {
    return this.waitlistService.getQueuePosition(counselorId, preferredDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.waitlistService.findOne(id);
  }

  @Post(':id/notify')
  notifyEntry(@Param('id') id: string, @Req() req) {
    return this.waitlistService.notifyEntry(id, req.user.userId);
  }

  @Post(':id/confirm')
  confirmEntry(@Param('id') id: string, @Req() req) {
    return this.waitlistService.confirmEntry(id, req.user.userId);
  }

  @Post(':id/cancel')
  cancelEntry(@Param('id') id: string, @Body() body: { reason: string }, @Req() req) {
    return this.waitlistService.cancelEntry(id, body.reason, req.user.userId);
  }

  @Post(':id/expire')
  expireEntry(@Param('id') id: string, @Req() req) {
    return this.waitlistService.expireEntry(id, req.user.userId);
  }
}

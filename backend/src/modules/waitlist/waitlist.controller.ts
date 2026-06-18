import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { Waitlist } from './waitlist.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WaitlistStatus } from '../../common/enums/waitlist-status.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('status') status?: WaitlistStatus,
    @Query('counselorId') counselorId?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ): Promise<{ data: Waitlist[]; total: number }> {
    return this.waitlistService.findAll(
      status,
      counselorId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('count')
  getWaitingCount(@Query('counselorId') counselorId?: string): Promise<number> {
    return this.waitlistService.getWaitingCount(counselorId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string): Promise<Waitlist | null> {
    return this.waitlistService.findOne(id);
  }

  @Post()
  create(@Body() waitlist: Partial<Waitlist>): Promise<Waitlist> {
    return this.waitlistService.create(waitlist);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() waitlist: Partial<Waitlist>,
    @CurrentUser() user: any,
    @Request() req: any,
  ): Promise<Waitlist | null> {
    return this.waitlistService.update(id, waitlist, user.sub, user.name, req.ip);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: WaitlistStatus,
    @CurrentUser() user: any,
    @Request() req: any,
  ): Promise<Waitlist | null> {
    return this.waitlistService.updateStatus(id, status, user.sub, user.name, req.ip);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Request() req: any,
  ): Promise<void> {
    return this.waitlistService.remove(id, user.sub, user.name, req.ip);
  }
}

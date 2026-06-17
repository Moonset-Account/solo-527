import { Controller, Get, Post, Body, Put, Param, Query, UseGuards, Req } from '@nestjs/common';
import { RefundsService } from './refunds.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('refunds')
@UseGuards(JwtAuthGuard)
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  create(@Body() createRefundDto: any, @Req() req) {
    return this.refundsService.create(createRefundDto, req.user.userId);
  }

  @Get()
  findAll(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query() filters: any,
  ) {
    return this.refundsService.findAll(page, pageSize, filters);
  }

  @Get('my')
  findMyRefunds(
    @Req() req,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ) {
    return this.refundsService.findByClient(req.user.userId, page, pageSize);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.refundsService.findOne(id);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() body: { approvedBy: string }, @Req() req) {
    return this.refundsService.approve(id, body.approvedBy, req.user.userId);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() body: { rejectReason: string }, @Req() req) {
    return this.refundsService.reject(id, body.rejectReason, req.user.userId);
  }

  @Post(':id/complete')
  complete(
    @Param('id') id: string,
    @Body() body: { refundMethod: string; transactionId?: string },
    @Req() req,
  ) {
    return this.refundsService.complete(id, body.refundMethod, body.transactionId, req.user.userId);
  }
}

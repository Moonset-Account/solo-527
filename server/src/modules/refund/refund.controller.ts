import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { RefundService } from './refund.service';
import { CreateRefundDto, UpdateRefundDto, QueryRefundDto } from './refund.dto';

@Controller('refunds')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post()
  create(@Body() dto: CreateRefundDto) {
    return this.refundService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryRefundDto) {
    return this.refundService.findAll(query);
  }

  @Patch(':id')
  review(@Param('id') id: string, @Body() dto: UpdateRefundDto) {
    if (dto.status === 'processed') {
      return this.refundService.process(id);
    }
    return this.refundService.review(id, dto);
  }
}

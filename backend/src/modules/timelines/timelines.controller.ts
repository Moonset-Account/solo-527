import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TimelinesService } from './timelines.service';
import { CreateTimelineDto, QueryTimelinesDto } from './dto/timeline.dto';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';

@UseGuards(AuthGuard('jwt'))
@Controller('timelines')
export class TimelinesController {
  constructor(private readonly timelinesService: TimelinesService) {}

  @Post()
  create(
    @Body() dto: CreateTimelineDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.timelinesService.create(dto, userId);
  }

  @Get()
  findAll(@Query() query: QueryTimelinesDto) {
    return this.timelinesService.findAll(query);
  }

  @Get('order/:orderId')
  findByOrderId(@Param('orderId') orderId: string) {
    return this.timelinesService.findByOrderId(orderId);
  }
}

import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityDto, UpdateActivityDto, RegisterActivityDto, CancelRegistrationDto, QueryActivityDto } from './activity.dto';

@Controller('activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  create(@Body() dto: CreateActivityDto) {
    return this.activityService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryActivityDto) {
    return this.activityService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.activityService.findOne(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.activityService.update(id, dto);
  }

  @Post(':id/register')
  register(@Param('id') id: string, @Body() dto: RegisterActivityDto) {
    return this.activityService.register(id, dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: CancelRegistrationDto) {
    return this.activityService.cancel(id, dto);
  }
}

import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FollowupsService } from './followups.service';
import { CreateFollowupDto } from './dto/create-followup.dto';
import { UpdateFollowupDto } from './dto/update-followup.dto';
import { CompleteFollowupDto } from './dto/complete-followup.dto';
import { Followup } from '../../schemas/followup.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('回访管理')
@ApiBearerAuth()
@Controller('api/followups')
@UseGuards(JwtAuthGuard)
export class FollowupsController {
  constructor(private readonly followupsService: FollowupsService) {}

  @Get()
  @ApiOperation({ summary: '获取回访列表' })
  @ApiResponse({ status: 200, type: [Followup] })
  async findAll(): Promise<Followup[]> {
    return this.followupsService.findAll();
  }

  @Get('my-tasks')
  @ApiOperation({ summary: '获取我的待回访任务' })
  @ApiResponse({ status: 200, type: [Followup] })
  async getMyTasks(@CurrentUser() user: CurrentUserPayload): Promise<Followup[]> {
    return this.followupsService.getMyTasks(user.id);
  }

  @Post()
  @ApiOperation({ summary: '创建回访记录' })
  @ApiResponse({ status: 201, type: Followup })
  async create(@Body() createFollowupDto: CreateFollowupDto): Promise<Followup> {
    return this.followupsService.create(createFollowupDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新回访记录' })
  @ApiResponse({ status: 200, type: Followup })
  async update(@Param('id') id: string, @Body() updateFollowupDto: UpdateFollowupDto): Promise<Followup> {
    return this.followupsService.update(id, updateFollowupDto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成回访' })
  @ApiResponse({ status: 200, type: Followup })
  async complete(
    @Param('id') id: string,
    @Body() completeFollowupDto: CompleteFollowupDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<Followup> {
    return this.followupsService.complete(id, completeFollowupDto, user);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消回访' })
  @ApiResponse({ status: 200, type: Followup })
  async cancel(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload): Promise<Followup> {
    return this.followupsService.cancel(id, user);
  }
}

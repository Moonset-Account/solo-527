import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  ProductionNodeService,
  ProductionProgressService,
  TeamService,
  TeamScheduleService,
  CreateProductionNodeDto,
  UpdateProductionNodeDto,
  CreateProductionProgressDto,
  UpdateProductionProgressDto,
  ProgressQueryDto,
  CreateTeamDto,
  UpdateTeamDto,
  CreateTeamScheduleDto,
  UpdateTeamScheduleDto,
  ScheduleQueryDto,
} from './production.service';
import { ProductionNode, ProductionProgress, Team, TeamSchedule } from '../../entities';

@ApiTags('生产管理-生产节点')
@Controller('production/nodes')
export class ProductionNodeController {
  constructor(private readonly service: ProductionNodeService) {}

  @Get()
  @ApiOperation({ summary: '获取生产节点列表' })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: '获取所有启用的生产节点' })
  findAllActive(): Promise<ProductionNode[]> {
    return this.service.findAllActive();
  }

  @Get('type/:nodeType')
  @ApiOperation({ summary: '按类型获取生产节点' })
  findByNodeType(@Param('nodeType') nodeType: string): Promise<ProductionNode[]> {
    return this.service.findByNodeType(nodeType);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取生产节点详情' })
  findOne(@Param('id') id: string): Promise<ProductionNode> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建生产节点' })
  create(
    @Body() dto: CreateProductionNodeDto,
    @Query('operator') operator: string = 'system',
  ): Promise<ProductionNode> {
    return this.service.create(dto, operator);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新生产节点' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductionNodeDto,
    @Query('operator') operator: string = 'system',
  ): Promise<ProductionNode> {
    return this.service.update(id, dto, operator);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除生产节点' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }
}

@ApiTags('生产管理-生产进度')
@Controller('production/progress')
export class ProductionProgressController {
  constructor(private readonly service: ProductionProgressService) {}

  @Get()
  @ApiOperation({ summary: '获取生产进度列表（支持多条件筛选）' })
  findAll(@Query() query: ProgressQueryDto) {
    return this.service.findAllWithFilters(query);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: '获取订单的生产进度列表' })
  findByOrderId(@Param('orderId') orderId: string): Promise<ProductionProgress[]> {
    return this.service.findByOrderId(orderId);
  }

  @Get('delays')
  @ApiOperation({ summary: '检查即将延误的生产进度' })
  checkDelays(): Promise<ProductionProgress[]> {
    return this.service.checkDelays();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取生产进度详情（关联查询）' })
  findOne(@Param('id') id: string): Promise<ProductionProgress> {
    return this.service.findOneWithRelations(id);
  }

  @Post()
  @ApiOperation({ summary: '创建生产进度' })
  create(
    @Body() dto: CreateProductionProgressDto,
    @Query('operator') operator: string = 'system',
  ): Promise<ProductionProgress> {
    return this.service.create(dto, operator);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新生产进度' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductionProgressDto,
    @Query('operator') operator: string = 'system',
  ): Promise<ProductionProgress> {
    return this.service.update(id, dto, operator);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除生产进度' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }

  @Post(':id/start')
  @ApiOperation({ summary: '开始生产节点' })
  startProgress(
    @Param('id') id: string,
    @Query('operator') operator: string = 'system',
  ): Promise<ProductionProgress> {
    return this.service.startProgress(id, operator);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: '暂停生产节点' })
  pauseProgress(
    @Param('id') id: string,
    @Query('operator') operator: string = 'system',
  ): Promise<ProductionProgress> {
    return this.service.pauseProgress(id, operator);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成生产节点' })
  completeProgress(
    @Param('id') id: string,
    @Body() body?: { completedQuantity?: number },
    @Query('operator') operator: string = 'system',
  ): Promise<ProductionProgress> {
    return this.service.completeProgress(id, body?.completedQuantity, operator);
  }

  @Post(':id/assign-team')
  @ApiOperation({ summary: '分配班组' })
  assignTeam(
    @Param('id') id: string,
    @Body() body: { teamId: string },
    @Query('operator') operator: string = 'system',
  ): Promise<ProductionProgress> {
    return this.service.assignTeam(id, body.teamId, operator);
  }
}

@ApiTags('生产管理-班组管理')
@Controller('production/teams')
export class TeamController {
  constructor(private readonly service: TeamService) {}

  @Get()
  @ApiOperation({ summary: '获取班组列表' })
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: '获取所有启用的班组' })
  findAllActive(): Promise<Team[]> {
    return this.service.findAllActive();
  }

  @Get('type/:teamType')
  @ApiOperation({ summary: '按类型获取班组' })
  findByTeamType(@Param('teamType') teamType: string): Promise<Team[]> {
    return this.service.findByTeamType(teamType);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取班组详情' })
  findOne(@Param('id') id: string): Promise<Team> {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建班组' })
  create(
    @Body() dto: CreateTeamDto,
    @Query('operator') operator: string = 'system',
  ): Promise<Team> {
    return this.service.create(dto, operator);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新班组' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
    @Query('operator') operator: string = 'system',
  ): Promise<Team> {
    return this.service.update(id, dto, operator);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除班组' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }
}

@ApiTags('生产管理-班组排期')
@Controller('production/schedules')
export class TeamScheduleController {
  constructor(private readonly service: TeamScheduleService) {}

  @Get()
  @ApiOperation({ summary: '获取班组排期列表（支持多条件筛选）' })
  findAll(@Query() query: ScheduleQueryDto) {
    return this.service.findAllWithFilters(query);
  }

  @Get('team/:teamId/date/:date')
  @ApiOperation({ summary: '获取指定班组某一天的排期' })
  findByTeamAndDate(
    @Param('teamId') teamId: string,
    @Param('date') date: string,
  ): Promise<TeamSchedule[]> {
    return this.service.findByTeamAndDate(teamId, new Date(date));
  }

  @Get('range')
  @ApiOperation({ summary: '获取日期范围内的排期' })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<TeamSchedule[]> {
    return this.service.findByDateRange(new Date(startDate), new Date(endDate));
  }

  @Get(':id')
  @ApiOperation({ summary: '获取班组排期详情' })
  findOne(@Param('id') id: string): Promise<TeamSchedule> {
    return this.service.findOneWithRelations(id);
  }

  @Post()
  @ApiOperation({ summary: '创建班组排期' })
  create(
    @Body() dto: CreateTeamScheduleDto,
    @Query('operator') operator: string = 'system',
  ): Promise<TeamSchedule> {
    return this.service.create(dto, operator);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新班组排期' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTeamScheduleDto,
    @Query('operator') operator: string = 'system',
  ): Promise<TeamSchedule> {
    return this.service.update(id, dto, operator);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除班组排期' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }

  @Post(':id/start')
  @ApiOperation({ summary: '开始排期任务' })
  startSchedule(
    @Param('id') id: string,
    @Query('operator') operator: string = 'system',
  ): Promise<TeamSchedule> {
    return this.service.startSchedule(id, operator);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成排期任务' })
  completeSchedule(
    @Param('id') id: string,
    @Body() body?: { actualQuantity?: number },
    @Query('operator') operator: string = 'system',
  ): Promise<TeamSchedule> {
    return this.service.completeSchedule(id, body?.actualQuantity, operator);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消排期任务' })
  cancelSchedule(
    @Param('id') id: string,
    @Query('operator') operator: string = 'system',
  ): Promise<TeamSchedule> {
    return this.service.cancelSchedule(id, operator);
  }
}

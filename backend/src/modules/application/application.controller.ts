import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import {
  CreateApplicationDto,
  SubmitApplicationDto,
  ApproveApplicationDto,
  RejectApplicationDto,
  PickApplicationDto,
  QueryApplicationDto,
} from './dto/application.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@/common/enums/index.enum';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @ApiOperation({ summary: '创建领用申请（草稿）' })
  async create(@Body() dto: CreateApplicationDto, @CurrentUser('sub') userId: string) {
    return this.applicationService.create(dto, userId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交申请' })
  async submit(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto?: SubmitApplicationDto,
  ) {
    return this.applicationService.submit(id, userId, dto);
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '审核通过' })
  async approve(
    @Param('id') id: string,
    @CurrentUser('sub') approverId: string,
    @Body() dto: ApproveApplicationDto,
  ) {
    return this.applicationService.approve(id, approverId, dto);
  }

  @Post(':id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '审核驳回' })
  async reject(
    @Param('id') id: string,
    @CurrentUser('sub') approverId: string,
    @Body() dto: RejectApplicationDto,
  ) {
    return this.applicationService.reject(id, approverId, dto);
  }

  @Post(':id/pick')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '确认领取（发放试剂）' })
  async pick(
    @Param('id') id: string,
    @CurrentUser('sub') operatorId: string,
    @Body() dto: PickApplicationDto,
  ) {
    return this.applicationService.pick(id, operatorId, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消申请' })
  async cancel(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.applicationService.cancel(id, userId);
  }

  @Get()
  @ApiOperation({ summary: '获取申请列表' })
  async findAll(
    @Query() query: QueryApplicationDto,
    @CurrentUser('roles') userRoles: string[],
    @CurrentUser('sub') userId: string,
  ) {
    return this.applicationService.findAll(query, userRoles, userId);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取申请统计' })
  async getStatistics() {
    return this.applicationService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取申请详情' })
  async findOne(@Param('id') id: string) {
    return this.applicationService.findById(id);
  }
}

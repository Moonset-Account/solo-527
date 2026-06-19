import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { NoShowDto } from './dto/no-show.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { Appointment } from '../../schemas/appointment.schema';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('预约管理')
@ApiBearerAuth()
@Controller('api/appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: '获取预约分页列表' })
  @ApiResponse({ status: 200, description: '成功获取预约列表' })
  async findAll(@Query() query: AppointmentQueryDto): Promise<PaginatedResponse<Appointment>> {
    return this.appointmentsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取预约详情' })
  @ApiResponse({ status: 200, type: Appointment })
  async findOne(@Param('id') id: string): Promise<Appointment> {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建预约' })
  @ApiResponse({ status: 201, type: Appointment })
  async create(@Body() createAppointmentDto: CreateAppointmentDto): Promise<Appointment> {
    return this.appointmentsService.create(createAppointmentDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新预约' })
  @ApiResponse({ status: 200, type: Appointment })
  async update(@Param('id') id: string, @Body() updateAppointmentDto: UpdateAppointmentDto): Promise<Appointment> {
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认预约' })
  @ApiResponse({ status: 200, type: Appointment })
  async confirm(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload): Promise<Appointment> {
    return this.appointmentsService.confirm(id, user);
  }

  @Post(':id/no-show')
  @ApiOperation({ summary: '标记爽约' })
  @ApiResponse({ status: 200, type: Appointment })
  async noShow(
    @Param('id') id: string,
    @Body() noShowDto: NoShowDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<Appointment> {
    return this.appointmentsService.noShow(id, noShowDto, user);
  }

  @Post(':id/start')
  @ApiOperation({ summary: '开始服务' })
  @ApiResponse({ status: 200, type: Appointment })
  async start(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload): Promise<Appointment> {
    return this.appointmentsService.start(id, user);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成服务' })
  @ApiResponse({ status: 200, type: Appointment })
  async complete(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload): Promise<Appointment> {
    return this.appointmentsService.complete(id, user);
  }
}

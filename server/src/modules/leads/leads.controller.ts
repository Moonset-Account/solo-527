import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { BatchAssignLeadDto } from './dto/batch-assign.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
import { Lead } from '../../schemas/lead.schema';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('线索管理')
@ApiBearerAuth()
@Controller('api/leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: '获取线索分页列表' })
  @ApiResponse({ status: 200, description: '成功获取线索列表' })
  async findAll(@Query() query: LeadQueryDto): Promise<PaginatedResponse<Lead>> {
    return this.leadsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取线索详情' })
  @ApiResponse({ status: 200, type: Lead })
  async findOne(@Param('id') id: string): Promise<Lead> {
    return this.leadsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建线索' })
  @ApiResponse({ status: 201, type: Lead })
  async create(@Body() createLeadDto: CreateLeadDto): Promise<Lead> {
    return this.leadsService.create(createLeadDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新线索' })
  @ApiResponse({ status: 200, type: Lead })
  async update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto): Promise<Lead> {
    return this.leadsService.update(id, updateLeadDto);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: '分配线索给顾问' })
  @ApiResponse({ status: 200, type: Lead })
  async assign(@Param('id') id: string, @Body() assignLeadDto: AssignLeadDto): Promise<Lead> {
    return this.leadsService.assign(id, assignLeadDto);
  }

  @Post('batch-assign')
  @ApiOperation({ summary: '批量分配线索' })
  @ApiResponse({ status: 200, description: '批量分配结果' })
  async batchAssign(@Body() batchAssignLeadDto: BatchAssignLeadDto): Promise<{ success: number; failed: number; errors: string[] }> {
    return this.leadsService.batchAssign(batchAssignLeadDto);
  }
}

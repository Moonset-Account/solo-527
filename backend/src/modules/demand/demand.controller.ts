import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DemandService } from './demand.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('客户需求')
@Controller('demands')
@UseGuards(JwtAuthGuard)
export class DemandController {
  constructor(private readonly demandService: DemandService) {}

  @Get()
  @ApiOperation({ summary: '获取需求列表' })
  async findAll(@Query() query: any) {
    return this.demandService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取需求详情' })
  async findOne(@Param('id') id: string) {
    return this.demandService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建客户需求' })
  async create(@Body() dto: any, @CurrentUser() user: User) {
    return this.demandService.create(dto, user);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新需求' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.demandService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除需求' })
  async remove(@Param('id') id: string) {
    return this.demandService.remove(id);
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SupplierService } from './supplier.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('供应商管理')
@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  @ApiOperation({ summary: '获取供应商列表' })
  async findAll(@Query() query: any) {
    return this.supplierService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取供应商详情' })
  async findOne(@Param('id') id: string) {
    return this.supplierService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建供应商' })
  async create(@Body() dto: any) {
    return this.supplierService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新供应商' })
  async update(@Param('id') id: string, @Body() dto: any) {
    return this.supplierService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除供应商' })
  async remove(@Param('id') id: string) {
    return this.supplierService.remove(id);
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PartsService } from './parts.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { PartQueryDto } from './dto/part-query.dto';
import { Part } from '../../schemas/part.schema';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('配件报价')
@Controller('parts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Get()
  @ApiOperation({ summary: '获取配件分页列表' })
  @ApiResponse({ status: 200, description: '配件列表' })
  async findAll(@Query() query: PartQueryDto): Promise<PaginatedResponse<Part>> {
    return this.partsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取配件详情' })
  @ApiResponse({ status: 200, description: '配件详情', type: Part })
  async findOne(@Param('id') id: string): Promise<Part> {
    return this.partsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建配件' })
  @ApiResponse({ status: 201, description: '创建成功', type: Part })
  async create(@Body() createPartDto: CreatePartDto): Promise<Part> {
    return this.partsService.create(createPartDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新配件' })
  @ApiResponse({ status: 200, description: '更新成功', type: Part })
  async update(
    @Param('id') id: string,
    @Body() updatePartDto: UpdatePartDto,
  ): Promise<Part> {
    return this.partsService.update(id, updatePartDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除配件' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.partsService.remove(id);
  }
}

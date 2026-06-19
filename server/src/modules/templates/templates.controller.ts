import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Template } from '../../schemas/template.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('检测模板')
@Controller('templates')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: '获取模板列表' })
  @ApiResponse({ status: 200, description: '模板列表', type: [Template] })
  async findAll(): Promise<Template[]> {
    return this.templatesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取模板详情' })
  @ApiResponse({ status: 200, description: '模板详情', type: Template })
  async findOne(@Param('id') id: string): Promise<Template> {
    return this.templatesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建模板' })
  @ApiResponse({ status: 201, description: '创建成功', type: Template })
  async create(@Body() createTemplateDto: CreateTemplateDto): Promise<Template> {
    return this.templatesService.create(createTemplateDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新模板' })
  @ApiResponse({ status: 200, description: '更新成功', type: Template })
  async update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ): Promise<Template> {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除模板' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.templatesService.remove(id);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: '启停模板' })
  @ApiResponse({ status: 200, description: '操作成功', type: Template })
  async toggle(@Param('id') id: string): Promise<Template> {
    return this.templatesService.toggle(id);
  }
}

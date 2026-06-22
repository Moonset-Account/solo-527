import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { IngredientsService } from './ingredients.service.js';
import { Ingredient } from '../../schemas/ingredient.schema.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';

@ApiTags('ingredients')
@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get()
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'category', required: false, description: '分类筛选' })
  @ApiQuery({ name: 'lowStock', required: false, description: '低库存筛选' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async findAll(
    @Req() req: Request,
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('lowStock') lowStock?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResult<Ingredient>> {
    return this.ingredientsService.findAll(req.isSandbox, {
      keyword,
      category,
      lowStock: lowStock === 'true' || lowStock === '1',
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Ingredient | null> {
    return this.ingredientsService.findOne(id);
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body() data: Partial<Ingredient>,
  ): Promise<Ingredient> {
    return this.ingredientsService.create({
      ...data,
      isSandbox: req.isSandbox,
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<Ingredient>,
  ): Promise<Ingredient | null> {
    return this.ingredientsService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Ingredient | null> {
    return this.ingredientsService.remove(id);
  }
}

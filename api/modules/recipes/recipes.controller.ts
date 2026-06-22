import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { RecipesService } from './recipes.service.js';
import { Recipe } from '../../schemas/recipe.schema.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @ApiQuery({ name: 'keyword', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'category', required: false, description: '分类筛选' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async findAll(
    @Req() req: Request,
    @Query('keyword') keyword?: string,
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResult<Recipe>> {
    return this.recipesService.findAll(req.isSandbox, {
      keyword,
      category,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Recipe | null> {
    return this.recipesService.findOne(id);
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body() data: Partial<Recipe>,
  ): Promise<Recipe> {
    return this.recipesService.create({
      ...data,
      isSandbox: req.isSandbox,
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<Recipe>,
  ): Promise<Recipe | null> {
    return this.recipesService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Recipe | null> {
    return this.recipesService.remove(id);
  }
}

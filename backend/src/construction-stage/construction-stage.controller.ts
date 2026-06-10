import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { ConstructionStageService } from './construction-stage.service';
import { CreateConstructionStageDto } from './dto/create-construction-stage.dto';
import { UpdateConstructionStageDto } from './dto/update-construction-stage.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('construction-stages')
export class ConstructionStageController {
  constructor(private readonly constructionStageService: ConstructionStageService) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto, @Query('projectId') projectId?: string) {
    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;
    return this.constructionStageService.findAll(paginationDto, projectIdNum);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.constructionStageService.findOne(id);
  }

  @Get('project/:projectId')
  findByProjectId(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.constructionStageService.findByProjectId(projectId);
  }

  @Post()
  create(@Body() createDto: CreateConstructionStageDto) {
    return this.constructionStageService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateConstructionStageDto) {
    return this.constructionStageService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.constructionStageService.remove(id);
  }
}

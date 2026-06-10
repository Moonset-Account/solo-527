import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { DesignPlanService } from './design-plan.service';
import { CreateDesignPlanDto } from './dto/create-design-plan.dto';
import { UpdateDesignPlanDto } from './dto/update-design-plan.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('design-plans')
export class DesignPlanController {
  constructor(private readonly designPlanService: DesignPlanService) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto, @Query('projectId') projectId?: string) {
    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;
    return this.designPlanService.findAll(paginationDto, projectIdNum);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.designPlanService.findOne(id);
  }

  @Get('project/:projectId')
  findByProjectId(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.designPlanService.findByProjectId(projectId);
  }

  @Post()
  create(@Body() createDesignPlanDto: CreateDesignPlanDto) {
    return this.designPlanService.create(createDesignPlanDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDesignPlanDto: UpdateDesignPlanDto) {
    return this.designPlanService.update(id, updateDesignPlanDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.designPlanService.remove(id);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { MaterialCostService } from './material-cost.service';
import { CreateMaterialCostDto } from './dto/create-material-cost.dto';
import { UpdateMaterialCostDto } from './dto/update-material-cost.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('material-costs')
export class MaterialCostController {
  constructor(private readonly materialCostService: MaterialCostService) {}

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('projectId') projectId?: string,
    @Query('month') month?: string,
  ) {
    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;
    return this.materialCostService.findAll(paginationDto, projectIdNum, month);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materialCostService.findOne(id);
  }

  @Get('project/:projectId')
  findByProjectId(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.materialCostService.findByProjectId(projectId);
  }

  @Post()
  create(@Body() createDto: CreateMaterialCostDto) {
    return this.materialCostService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateMaterialCostDto) {
    return this.materialCostService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.materialCostService.remove(id);
  }
}

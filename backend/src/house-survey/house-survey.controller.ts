import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { HouseSurveyService } from './house-survey.service';
import { CreateHouseSurveyDto } from './dto/create-house-survey.dto';
import { UpdateHouseSurveyDto } from './dto/update-house-survey.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('house-surveys')
export class HouseSurveyController {
  constructor(private readonly houseSurveyService: HouseSurveyService) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto, @Query('projectId') projectId?: string) {
    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;
    return this.houseSurveyService.findAll(paginationDto, projectIdNum);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.houseSurveyService.findOne(id);
  }

  @Get('project/:projectId')
  findByProjectId(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.houseSurveyService.findByProjectId(projectId);
  }

  @Post()
  create(@Body() createHouseSurveyDto: CreateHouseSurveyDto) {
    return this.houseSurveyService.create(createHouseSurveyDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateHouseSurveyDto: UpdateHouseSurveyDto) {
    return this.houseSurveyService.update(id, updateHouseSurveyDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.houseSurveyService.remove(id);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { StagePhotoService } from './stage-photo.service';
import { CreateStagePhotoDto } from './dto/create-stage-photo.dto';
import { UpdateStagePhotoDto } from './dto/update-stage-photo.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('stage-photos')
export class StagePhotoController {
  constructor(private readonly stagePhotoService: StagePhotoService) {}

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('projectId') projectId?: string,
    @Query('stageId') stageId?: string,
  ) {
    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;
    const stageIdNum = stageId ? parseInt(stageId, 10) : undefined;
    return this.stagePhotoService.findAll(paginationDto, projectIdNum, stageIdNum);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stagePhotoService.findOne(id);
  }

  @Get('project/:projectId')
  findByProjectId(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.stagePhotoService.findByProjectId(projectId);
  }

  @Get('stage/:stageId')
  findByStageId(@Param('stageId', ParseIntPipe) stageId: number) {
    return this.stagePhotoService.findByStageId(stageId);
  }

  @Post()
  create(@Body() createDto: CreateStagePhotoDto) {
    return this.stagePhotoService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateStagePhotoDto) {
    return this.stagePhotoService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.stagePhotoService.remove(id);
  }
}

import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { AfterSalesService } from './after-sales.service';
import { CreateAfterSalesDto } from './dto/create-after-sales.dto';
import { UpdateAfterSalesDto } from './dto/update-after-sales.dto';
import { ProcessAfterSalesDto } from './dto/process-after-sales.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('after-sales')
export class AfterSalesController {
  constructor(private readonly afterSalesService: AfterSalesService) {}

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;
    return this.afterSalesService.findAll(paginationDto, projectIdNum, status, type);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.afterSalesService.findOne(id);
  }

  @Get('project/:projectId')
  findByProjectId(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.afterSalesService.findByProjectId(projectId);
  }

  @Post()
  create(@Body() createDto: CreateAfterSalesDto) {
    return this.afterSalesService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateAfterSalesDto) {
    return this.afterSalesService.update(id, updateDto);
  }

  @Patch(':id/process')
  process(@Param('id', ParseIntPipe) id: number, @Body() processDto: ProcessAfterSalesDto) {
    return this.afterSalesService.process(id, processDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.afterSalesService.remove(id);
  }
}

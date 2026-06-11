import { Controller, Get, Post, Body, Put, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { CreateWorkerDto, UpdateWorkerDto, QueryWorkerDto } from '../../dto/worker.dto';
import { Worker } from '../../schemas/worker.schema';

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createWorkerDto: CreateWorkerDto): Promise<Worker> {
    return this.workersService.create(createWorkerDto);
  }

  @Get()
  findAll(@Query() query: QueryWorkerDto): Promise<{ data: Worker[]; total: number; page: number; pageSize: number }> {
    return this.workersService.findAll(query);
  }

  @Get('skill/:skillId')
  findBySkill(@Param('skillId') skillId: string): Promise<Worker[]> {
    return this.workersService.findBySkill(skillId);
  }

  @Get('community/:community')
  findByCommunity(@Param('community') community: string): Promise<Worker[]> {
    return this.workersService.findByCommunity(community);
  }

  @Get('available')
  findAvailable(
    @Query('skillId') skillId?: string,
    @Query('community') community?: string,
  ): Promise<Worker[]> {
    return this.workersService.findAvailable(skillId, community);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Worker> {
    return this.workersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateWorkerDto: UpdateWorkerDto): Promise<Worker> {
    return this.workersService.update(id, updateWorkerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<Worker> {
    return this.workersService.remove(id);
  }
}

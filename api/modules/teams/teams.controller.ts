import { Controller, Get, Post, Put, Delete, Param, Body, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { TeamsService } from './teams.service.js';
import { Team } from '../../schemas/team.schema.js';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  async findAll(@Req() req: Request): Promise<Team[]> {
    return this.teamsService.findAll(req.isSandbox);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Team | null> {
    return this.teamsService.findOne(id);
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body() data: Partial<Team>,
  ): Promise<Team> {
    return this.teamsService.create({
      ...data,
      isSandbox: req.isSandbox,
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<Team>,
  ): Promise<Team | null> {
    return this.teamsService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Team | null> {
    return this.teamsService.remove(id);
  }
}

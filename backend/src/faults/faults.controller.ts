import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { FaultsService } from './faults.service';
import { CreateFaultDto } from './dto/create-fault.dto';
import { UpdateFaultDto } from './dto/update-fault.dto';
import { QueryFaultsDto } from './dto/query-faults.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('faults')
@UseGuards(JwtAuthGuard)
export class FaultsController {
  constructor(private faultsService: FaultsService) {}

  @Get()
  async findAll(@Query() query: QueryFaultsDto) {
    return this.faultsService.findAll(query);
  }

  @Get('alerts')
  async findAlerts() {
    return this.faultsService.findAlerts();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.faultsService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateFaultDto, @CurrentUser() user: any) {
    return this.faultsService.create(createDto, user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateFaultDto, @CurrentUser() user: any) {
    return this.faultsService.update(id, updateDto, user);
  }

  @Post(':id/resolve')
  async resolve(@Param('id') id: string, @Body() body: { resolution: string }, @CurrentUser() user: any) {
    return this.faultsService.resolve(id, body.resolution, user);
  }
}

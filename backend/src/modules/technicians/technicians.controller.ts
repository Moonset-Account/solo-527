import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TechniciansService } from './technicians.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('technicians')
export class TechniciansController {
  constructor(private readonly techniciansService: TechniciansService) {}

  @Post()
  create(@Body() createTechnicianDto: any) {
    return this.techniciansService.create(createTechnicianDto);
  }

  @Public()
  @Get()
  findAll(@Query() query: any) {
    return this.techniciansService.findAll(query);
  }

  @Public()
  @Get('active')
  findActive() {
    return this.techniciansService.findActive();
  }

  @Public()
  @Get('service/:serviceId')
  findByServiceId(@Param('serviceId') serviceId: string) {
    return this.techniciansService.findByServiceId(serviceId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.techniciansService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTechnicianDto: any) {
    return this.techniciansService.update(id, updateTechnicianDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.techniciansService.remove(id);
  }
}

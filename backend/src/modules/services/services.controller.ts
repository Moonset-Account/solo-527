import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ServicesService } from './services.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(@Body() createServiceDto: any) {
    return this.servicesService.create(createServiceDto);
  }

  @Public()
  @Get()
  findAll(@Query() query: any) {
    return this.servicesService.findAll(query);
  }

  @Public()
  @Get('active')
  findActive() {
    return this.servicesService.findActive();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceDto: any) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}

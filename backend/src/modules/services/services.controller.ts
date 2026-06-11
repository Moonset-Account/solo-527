import { Controller, Get, Post, Body, Put, Param, Delete, Query, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto, ServiceQueryDto } from '../../dto/service.dto';
import { Service } from '../../schemas/service.schema';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createServiceDto: CreateServiceDto): Promise<Service> {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  findAll(@Query() query: ServiceQueryDto): Promise<{ data: Service[]; total: number; page: number; pageSize: number }> {
    return this.servicesService.findAll(query);
  }

  @Get('category/:category')
  findByCategory(@Param('category') category: string): Promise<Service[]> {
    return this.servicesService.findByCategory(category);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Service> {
    return this.servicesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto): Promise<Service> {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<Service> {
    return this.servicesService.remove(id);
  }

  @Patch(':id/enable')
  enable(@Param('id') id: string): Promise<Service> {
    return this.servicesService.enable(id);
  }

  @Patch(':id/disable')
  disable(@Param('id') id: string): Promise<Service> {
    return this.servicesService.disable(id);
  }
}

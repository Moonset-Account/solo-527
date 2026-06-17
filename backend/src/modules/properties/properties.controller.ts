import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  Ip,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import { UpdatePropertyStatusDto } from './dto/update-property-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('properties')
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const data = await this.propertiesService.create(
      createPropertyDto,
      req.user?.userId,
      ip,
    );
    return { success: true, data };
  }

  @Get()
  async findAll(@Query() query: PropertyQueryDto) {
    const data = await this.propertiesService.findAll(query);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.propertiesService.findOne(id);
    return { success: true, data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const data = await this.propertiesService.update(
      id,
      updatePropertyDto,
      req.user?.userId,
      ip,
    );
    return { success: true, data };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdatePropertyStatusDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const data = await this.propertiesService.updateStatus(
      id,
      updateStatusDto,
      req.user?.userId,
      ip,
    );
    return { success: true, data };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    await this.propertiesService.remove(id, req.user?.userId, ip);
    return { success: true, data: null };
  }
}

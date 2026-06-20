import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ConfigService } from './config.service';
import { CreateConfigDto, UpdateConfigDto, QueryConfigDto } from './config.dto';

@Controller('configs')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  findAll(@Query() query: QueryConfigDto) {
    return this.configService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateConfigDto) {
    return this.configService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateConfigDto) {
    return this.configService.update(id, dto);
  }
}

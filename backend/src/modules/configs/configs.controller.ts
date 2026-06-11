import { Controller, Get, Post, Body, Put, Param, Delete, Query, Patch, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfigsService } from './configs.service';
import { CreateConfigDto, UpdateConfigDto, QueryConfigDto, ConfigQueryDto } from '../../dto/config.dto';
import { Config, ChangeLog, ChangeLogItem } from '../../schemas/config.schema';

export type ConfigQueryDtoAlias = ConfigQueryDto;

@Controller('configs')
export class ConfigsController {
  constructor(private readonly configsService: ConfigsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createConfigDto: CreateConfigDto): Promise<Config> {
    return this.configsService.create(createConfigDto);
  }

  @Get()
  findAll(@Query() query: QueryConfigDto): Promise<{ data: Config[]; total: number; page: number; pageSize: number }> {
    return this.configsService.findAll(query);
  }

  @Get('key/:key')
  findByKey(@Param('key') key: string): Promise<Config> {
    return this.configsService.findByKey(key);
  }

  @Get('type/:type')
  getByType(@Param('type') type: string): Promise<Config[]> {
    return this.configsService.getByType(type);
  }

  @Get('group/by-type')
  groupByType(): Promise<Record<string, Config[]>> {
    return this.configsService.groupByType();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Config> {
    return this.configsService.findOne(id);
  }

  @Get(':id/changelog')
  getChangeLog(@Param('id') id: string): Promise<ChangeLogItem[]> {
    return this.configsService.getChangeLog(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateConfigDto: UpdateConfigDto): Promise<Config> {
    return this.configsService.update(id, updateConfigDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<Config> {
    return this.configsService.remove(id);
  }

  @Patch(':id/enable')
  enable(
    @Param('id') id: string,
    @Body('modifiedBy') modifiedBy?: string,
  ): Promise<Config> {
    return this.configsService.enable(id, modifiedBy);
  }

  @Patch(':id/disable')
  disable(
    @Param('id') id: string,
    @Body('modifiedBy') modifiedBy?: string,
  ): Promise<Config> {
    return this.configsService.disable(id, modifiedBy);
  }
}

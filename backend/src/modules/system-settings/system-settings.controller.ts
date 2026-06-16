import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { CreateSystemSettingDto, UpdateSystemSettingDto, QuerySystemSettingDto } from './dto/system-setting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('system-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Post()
  async create(@Body() createSystemSettingDto: CreateSystemSettingDto) {
    return this.systemSettingsService.create(createSystemSettingDto);
  }

  @Get()
  async findAll(@Query() queryDto: QuerySystemSettingDto) {
    return this.systemSettingsService.findAll(queryDto);
  }

  @Get('key/:key')
  async findByKey(@Param('key') key: string) {
    return this.systemSettingsService.findByKey(key);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.systemSettingsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSystemSettingDto: UpdateSystemSettingDto,
  ) {
    return this.systemSettingsService.update(id, updateSystemSettingDto);
  }

  @Patch('key/:key')
  async updateByKey(
    @Param('key') key: string,
    @Body() body: { value: string },
  ) {
    return this.systemSettingsService.updateByKey(key, body.value);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.systemSettingsService.remove(id);
    return { success: true };
  }
}

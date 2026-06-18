import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator';

class CreateDictDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsNumber()
  @IsOptional()
  sort?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

class UpdateDictDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsNumber()
  @IsOptional()
  sort?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

class CreateReminderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsArray()
  @IsOptional()
  channels?: string[];

  @IsString()
  @IsNotEmpty()
  template: string;

  @IsOptional()
  scope?: { departments?: string[]; roles?: string[] };

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

class UpdateReminderDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsArray()
  @IsOptional()
  channels?: string[];

  @IsString()
  @IsOptional()
  template?: string;

  @IsOptional()
  scope?: { departments?: string[]; roles?: string[] };

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

class CreateScopeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsArray()
  @IsOptional()
  values?: string[];
}

class UpdateScopeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsArray()
  @IsOptional()
  values?: string[];
}

class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsOptional()
  values?: string[];
}

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get('dicts')
  async getDicts(@Query('category') category?: string) {
    return this.settingsService.getDicts(category);
  }

  @Post('dicts')
  async createDict(@Body() dto: CreateDictDto) {
    return this.settingsService.createDict(dto);
  }

  @Patch('dicts/:id')
  async updateDict(@Param('id') id: string, @Body() dto: UpdateDictDto) {
    return this.settingsService.updateDict(id, dto);
  }

  @Delete('dicts/:id')
  async deleteDict(@Param('id') id: string) {
    await this.settingsService.deleteDict(id);
    return { message: '删除成功' };
  }

  @Get('reminders')
  async getReminders() {
    return this.settingsService.getReminders();
  }

  @Post('reminders')
  async createReminder(@Body() dto: CreateReminderDto) {
    return this.settingsService.createReminder(dto);
  }

  @Patch('reminders/:id')
  async updateReminder(@Param('id') id: string, @Body() dto: UpdateReminderDto) {
    return this.settingsService.updateReminder(id, dto);
  }

  @Delete('reminders/:id')
  async deleteReminder(@Param('id') id: string) {
    await this.settingsService.deleteReminder(id);
    return { message: '删除成功' };
  }

  @Get('scopes')
  async getScopes(@Query('type') type?: string) {
    return this.settingsService.getScopes(type);
  }

  @Post('scopes')
  async createScope(@Body() dto: CreateScopeDto) {
    return this.settingsService.createScope(dto);
  }

  @Patch('scopes/:id')
  async updateScope(@Param('id') id: string, @Body() dto: UpdateScopeDto) {
    return this.settingsService.updateScope(id, dto);
  }

  @Delete('scopes/:id')
  async deleteScope(@Param('id') id: string) {
    await this.settingsService.deleteScope(id);
    return { message: '删除成功' };
  }

  @Get('roles')
  async getRoles() {
    return this.settingsService.getRoles();
  }

  @Post('roles')
  async createRole(@Body() dto: CreateRoleDto) {
    return this.settingsService.createRole(dto);
  }

  @Patch('roles/:id')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateScopeDto) {
    return this.settingsService.updateRole(id, dto);
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    await this.settingsService.deleteRole(id);
    return { message: '删除成功' };
  }
}

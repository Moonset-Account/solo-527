import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Types } from 'mongoose';
import { ConfigService } from './config.service.js';
import { UpdateSwitchDto } from './dto/update-switch.dto.js';
import { CreateDepartmentDto } from './dto/create-department.dto.js';
import { UpdateDepartmentDto } from './dto/update-department.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { IUser } from '../../common/types/index.js';

@Controller('configs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @Roles('pm', 'admin')
  async getConfig() {
    return this.configService.getConfig();
  }

  @Patch('switches')
  @Roles('admin')
  async updateSwitch(@Body() dto: UpdateSwitchDto, @CurrentUser() user: IUser) {
    return this.configService.updateSwitch(dto.key, dto.value, user._id);
  }

  @Get('departments')
  @Roles('pm', 'admin')
  async getDepartments() {
    return this.configService.getDepartments();
  }

  @Post('departments')
  @Roles('admin')
  async createDepartment(@Body() dto: CreateDepartmentDto, @CurrentUser() user: IUser) {
    return this.configService.createDepartment(dto.name, dto.head, user._id);
  }

  @Patch('departments/:id')
  @Roles('admin')
  async updateDepartment(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() user: IUser,
  ) {
    return this.configService.updateDepartment(id, dto.name, dto.head, user._id);
  }

  @Delete('departments/:id')
  @Roles('admin')
  async deleteDepartment(@Param('id') id: string, @CurrentUser() user: IUser) {
    return this.configService.deleteDepartment(id, user._id);
  }

  @Get('attachments')
  @Roles('pm', 'admin')
  async getAttachments(@Query('refId') refId?: string, @Query('refType') refType: string = 'config') {
    return this.configService.getAttachments(refId || '', refType);
  }

  @Post('attachments')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Body('refId') refId: string,
    @Body('refType') refType: 'item' | 'config' = 'config',
    @CurrentUser() user: IUser,
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    if (!refId) {
      throw new BadRequestException('缺少 refId 参数');
    }
    const refObjectId = new Types.ObjectId(refId);
    return this.configService.uploadAttachment(file, refObjectId, refType, user._id);
  }

  @Get('changelog')
  @Roles('admin')
  async getChangelog(@Query('page') page: string = '1', @Query('limit') limit: string = '20') {
    return this.configService.getChangelog(parseInt(page, 10), parseInt(limit, 10));
  }
}

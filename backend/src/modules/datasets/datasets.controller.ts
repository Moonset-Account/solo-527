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
  HttpCode,
} from '@nestjs/common';
import { DatasetsService } from './datasets.service';
import {
  CreateDatasetDto,
  UpdateDatasetDto,
  AddPermissionDto,
  UpdatePermissionDto,
  QueryDatasetsDto,
} from './dto/dataset.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('datasets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DatasetsController {
  constructor(private readonly datasetsService: DatasetsService) {}

  @Post()
  @Roles('admin', 'manager')
  create(
    @Body() createDto: CreateDatasetDto,
    @CurrentUser() user: any,
  ) {
    return this.datasetsService.create(createDto, user);
  }

  @Get()
  findAll(
    @Query() query: QueryDatasetsDto,
    @CurrentUser() user: any,
  ) {
    return this.datasetsService.findAll(query, user);
  }

  @Get('expiring-permissions')
  @Roles('admin', 'manager')
  getExpiringPermissions(@Query('days') days: number = 7) {
    return this.datasetsService.getExpiringPermissions(days);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.datasetsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() updateDto: UpdateDatasetDto) {
    return this.datasetsService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.datasetsService.remove(id);
  }

  @Post(':id/permissions')
  @Roles('admin', 'manager')
  @HttpCode(200)
  addPermissions(
    @Param('id') id: string,
    @Body() dto: AddPermissionDto,
  ) {
    return this.datasetsService.addPermissions(id, dto);
  }

  @Patch(':id/permissions')
  @Roles('admin', 'manager')
  updatePermission(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.datasetsService.updatePermission(id, dto);
  }

  @Delete(':id/permissions/:userId')
  @Roles('admin', 'manager')
  removePermission(
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.datasetsService.removePermission(id, userId);
  }
}

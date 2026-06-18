import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HealthRecordsService } from './health-records.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { HealthRecordType } from '../../entities/health-record.entity';

@Controller('health-records')
export class HealthRecordsController {
  constructor(private readonly healthRecordsService: HealthRecordsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('type') type?: HealthRecordType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('petId') petId?: string,
    @Query('veterinarianId') veterinarianId?: string,
  ) {
    return this.healthRecordsService.findAll({
      page,
      pageSize,
      type,
      startDate,
      endDate,
      petId,
      veterinarianId,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.healthRecordsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  async create(@Body() dto: any, @Request() req) {
    return this.healthRecordsService.create(dto, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any, @Request() req) {
    return this.healthRecordsService.update(id, dto, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.healthRecordsService.remove(id, req.user);
  }
}

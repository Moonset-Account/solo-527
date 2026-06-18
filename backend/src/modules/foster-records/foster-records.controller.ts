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
import { FosterRecordsService } from './foster-records.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { FosterStatus } from '../../entities/foster-record.entity';

@Controller('foster-records')
export class FosterRecordsController {
  constructor(private readonly fosterRecordsService: FosterRecordsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('status') status?: FosterStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('volunteerId') volunteerId?: string,
    @Query('petId') petId?: string,
  ) {
    return this.fosterRecordsService.findAll({
      page,
      pageSize,
      status,
      startDate,
      endDate,
      volunteerId,
      petId,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.fosterRecordsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  async create(@Body() dto: any, @Request() req) {
    return this.fosterRecordsService.create(dto, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any, @Request() req) {
    return this.fosterRecordsService.update(id, dto, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.fosterRecordsService.remove(id, req.user);
  }
}

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
import { AdoptionRecordsService } from './adoption-records.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { AdoptionStatus } from '../../entities/adoption-record.entity';

@Controller('adoption-records')
export class AdoptionRecordsController {
  constructor(private readonly adoptionRecordsService: AdoptionRecordsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
    @Query('status') status?: AdoptionStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('approverId') approverId?: string,
    @Query('adopterId') adopterId?: string,
  ) {
    return this.adoptionRecordsService.findAll({
      page,
      pageSize,
      status,
      startDate,
      endDate,
      approverId,
      adopterId,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.adoptionRecordsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  async create(@Body() dto: any, @Request() req) {
    return this.adoptionRecordsService.create(dto, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any, @Request() req) {
    return this.adoptionRecordsService.update(id, dto, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':id/approve')
  async approve(@Param('id') id: string, @Request() req) {
    return this.adoptionRecordsService.approve(id, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
    @Request() req,
  ) {
    return this.adoptionRecordsService.reject(id, rejectionReason, req.user);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.adoptionRecordsService.remove(id, req.user);
  }
}

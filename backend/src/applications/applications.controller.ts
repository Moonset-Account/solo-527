import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.applicationsService.findAll(pagination, status, priority);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.applicationsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.IT_SUPERVISOR, UserRole.ADMIN)
  async create(@Body() createDto: CreateApplicationDto, @CurrentUser() user: any) {
    return this.applicationsService.create(createDto, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.IT_SUPERVISOR, UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdateApplicationDto, @CurrentUser() user: any) {
    return this.applicationsService.update(id, updateDto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.applicationsService.remove(id, user);
  }
}

import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { InspectionTemplatesService } from './inspection-templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('inspection-templates')
@UseGuards(JwtAuthGuard)
export class InspectionTemplatesController {
  constructor(private templatesService: InspectionTemplatesService) {}

  @Get()
  async findAll(@Query() pagination: PaginationDto, @Query('all') all?: string) {
    if (all === 'true') {
      return this.templatesService.findAllNoPagination();
    }
    return this.templatesService.findAll(pagination);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.IT_SUPERVISOR, UserRole.ADMIN)
  async create(@Body() createDto: CreateTemplateDto, @CurrentUser() user: any) {
    return this.templatesService.create(createDto, user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.IT_SUPERVISOR, UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdateTemplateDto, @CurrentUser() user: any) {
    return this.templatesService.update(id, updateDto, user);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.templatesService.remove(id, user);
  }
}

import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto, UpdateMaterialDto, QueryMaterialsDto, UpdateLicenseDto } from './dto/material.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user.enum';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get('public')
  findPublic(@Query() query: QueryMaterialsDto) {
    return this.materialsService.findPublic(query);
  }

  @Get('public/:id')
  async findOnePublic(@Param('id') id: string) {
    await this.materialsService.incrementView(id);
    return this.materialsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  create(
    @Body() createMaterialDto: CreateMaterialDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.materialsService.create(createMaterialDto, userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Get()
  findAll(
    @Query() query: QueryMaterialsDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.materialsService.findAll(query, userId, userRole);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.materialsService.update(id, updateMaterialDto, userId, userRole);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Put(':id/license')
  updateLicense(
    @Param('id') id: string,
    @Body() dto: UpdateLicenseDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.materialsService.updateLicense(id, dto, userId, userRole);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Put(':id/on-shelf')
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  putOnShelf(
    @Param('id') id: string,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.materialsService.putOnShelf(id, userId, userRole);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Put(':id/off-shelf')
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  putOffShelf(
    @Param('id') id: string,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.materialsService.putOffShelf(id, userId, userRole);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete(':id')
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  remove(
    @Param('id') id: string,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.materialsService.remove(id, userId, userRole);
  }
}

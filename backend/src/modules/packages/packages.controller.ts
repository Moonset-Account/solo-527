import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { Package } from './package.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  findAll(@Query('active') active?: string): Promise<Package[]> {
    return this.packagesService.findAll(active === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Package | null> {
    return this.packagesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() pkg: Partial<Package>): Promise<Package> {
    return this.packagesService.create(pkg);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() pkg: Partial<Package>): Promise<Package | null> {
    return this.packagesService.update(id, pkg);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.packagesService.remove(id);
  }
}

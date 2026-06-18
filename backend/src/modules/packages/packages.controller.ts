import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { Package } from './package.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

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
  create(
    @Body() pkg: Partial<Package>,
    @CurrentUser() user: any,
    @Request() req: any,
  ): Promise<Package> {
    return this.packagesService.create(pkg, user.sub, user.name, req.ip);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() pkg: Partial<Package>,
    @CurrentUser() user: any,
    @Request() req: any,
  ): Promise<Package | null> {
    return this.packagesService.update(id, pkg, user.sub, user.name, req.ip);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Request() req: any,
  ): Promise<void> {
    return this.packagesService.remove(id, user.sub, user.name, req.ip);
  }
}

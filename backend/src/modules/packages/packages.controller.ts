import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { Package } from './package.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OperationLogService } from '../../common/services/operation-log.service';

@Controller('packages')
export class PackagesController {
  constructor(
    private readonly packagesService: PackagesService,
    private readonly operationLogService: OperationLogService,
  ) {}

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
  async create(
    @Body() pkg: Partial<Package>,
    @CurrentUser() user: any,
    @Request() req: any,
  ): Promise<Package> {
    const result = await this.packagesService.create(pkg);

    this.operationLogService.log(
      user.sub,
      user.name,
      'create',
      'package',
      result.id,
      { name: pkg.name, price: pkg.price },
      req.ip,
    );

    return result;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() pkg: Partial<Package>,
    @CurrentUser() user: any,
    @Request() req: any,
  ): Promise<Package | null> {
    const result = await this.packagesService.update(id, pkg);

    this.operationLogService.log(
      user.sub,
      user.name,
      'update',
      'package',
      id,
      { changes: Object.keys(pkg).join(', ') },
      req.ip,
    );

    return result;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Request() req: any,
  ): Promise<void> {
    await this.packagesService.remove(id);

    this.operationLogService.log(
      user.sub,
      user.name,
      'delete',
      'package',
      id,
      {},
      req.ip,
    );
  }
}

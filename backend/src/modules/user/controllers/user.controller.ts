import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../dto/auth.dto';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequiresPermission } from '../../../common/decorators/requires-permission.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @RequiresPermission('user:manage')
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.userService.create(dto, user);
  }

  @Get()
  @RequiresPermission('user:manage')
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('clinicId') clinicId?: string,
    @Query('keyword') keyword?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.userService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      clinicId,
      keyword,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  @Get(':id')
  @RequiresPermission('user:manage')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Put(':id')
  @RequiresPermission('user:manage')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.userService.update(id, dto, user);
  }

  @Get('roles/list')
  @RequiresPermission('permission:view')
  async getRoles() {
    return this.userService.findAllRoles();
  }

  @Get('permissions/list')
  @RequiresPermission('permission:view')
  async getPermissions() {
    return this.userService.findAllPermissions();
  }
}

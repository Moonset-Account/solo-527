import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User, UserRole } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async findById(@Param('id') id: string): Promise<User> {
    return this.userService.findById(id);
  }

  @Get('role/:role')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async findByRole(@Param('role') role: UserRole): Promise<User[]> {
    return this.userService.findByRole(role);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() data: Partial<User>, @CurrentUser() user: User): Promise<User> {
    data.createdBy = user.id;
    return this.userService.create(data);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() data: Partial<User>,
    @CurrentUser() user: User,
  ): Promise<User> {
    data.updatedBy = user.id;
    return this.userService.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string): Promise<void> {
    return this.userService.delete(id);
  }
}

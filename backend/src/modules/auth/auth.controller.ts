import { Controller, Post, Body, Get, Param, Query, Put } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService, LoginDto } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('认证/权限')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiBearerAuth()
  @Get('profile')
  async profile(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getProfile(user.id);
  }

  @ApiBearerAuth()
  @Get('users')
  @RequirePermissions('user:manage')
  async listUsers(@Query('keyword') keyword?: string) {
    return this.authService.listUsers(keyword);
  }

  @ApiBearerAuth()
  @Get('roles')
  async listRoles() {
    return this.authService.listRoles();
  }

  @ApiBearerAuth()
  @Get('permissions')
  @RequirePermissions('permission:manage')
  async listPermissions() {
    return this.authService.listPermissions();
  }

  @ApiBearerAuth()
  @Put('users/:userId/roles')
  @RequirePermissions('user:manage', 'role:manage')
  async assignRoles(
    @Param('userId') userId: string,
    @Body() body: { roleIds: string[] },
  ) {
    return this.authService.assignRoles(userId, body.roleIds);
  }

  @ApiBearerAuth()
  @Put('roles/:roleId/permissions')
  @RequirePermissions('role:manage', 'permission:manage')
  async assignPermissions(
    @Param('roleId') roleId: string,
    @Body() body: { permissionIds: string[] },
  ) {
    return this.authService.assignPermissions(roleId, body.permissionIds);
  }
}

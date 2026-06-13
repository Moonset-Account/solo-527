import { Controller, Post, Body, Get, Patch, Request, Ip, Headers } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto, ChangePasswordDto } from '../dto/auth.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequiresPermission } from '../../../common/decorators/requires-permission.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.login(loginDto.username, loginDto.password, ip, userAgent);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getCurrentUserInfo(user.id);
  }

  @Patch('password')
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto.oldPassword, dto.newPassword);
  }

  @Get('permissions')
  async getPermissions(@CurrentUser() user: CurrentUserPayload) {
    return {
      roles: user.roles,
      permissions: user.permissions,
    };
  }
}

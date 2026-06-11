import { Controller, Post, Body, Param } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto.js';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('portal/:token')
  async portalLogin(@Param('token') token: string) {
    return this.authService.portalLogin(token);
  }
}

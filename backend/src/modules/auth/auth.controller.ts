import { Controller, Post, UseGuards, Request, Body, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {
    this.authService.initDefaultUsers();
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req, @Req() request) {
    const ip = request.ip || request.connection?.remoteAddress;
    const ua = request.headers['user-agent'];
    return this.authService.login(req.user, ip, ua);
  }

  @Post('register')
  async register(@Body() registerDto: any) {
    return this.authService.register(registerDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}

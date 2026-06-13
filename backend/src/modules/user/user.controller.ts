import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto, LoginDto, QueryUserDto } from './dto/user.dto';
import { User } from './entities/user.entity';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.userService.validateUser(loginDto.username, loginDto.password);
    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);
    
    const { password, ...userWithoutPassword } = user;
    return {
      accessToken: token,
      user: userWithoutPassword,
    };
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll(@Query() query?: QueryUserDto): Promise<User[]> {
    return this.userService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }
}

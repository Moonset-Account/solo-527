import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, QueryUsersDto } from './dto/user.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RolesGuard } from '@/common/guards/roles.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { UserRole } from '@/common/enums/index.enum';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: '创建用户' })
  async create(@Body() dto: CreateUserDto, @CurrentUser('sub') operatorId: string) {
    return this.usersService.create(dto, operatorId);
  }

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  async findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: '获取当前用户信息' })
  async getProfile(@CurrentUser('sub') id: string) {
    return this.usersService.findById(id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个用户信息' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: '更新用户信息' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('sub') operatorId: string,
  ) {
    return this.usersService.update(id, dto, operatorId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: '禁用用户' })
  async remove(@Param('id') id: string, @CurrentUser('sub') operatorId: string) {
    return this.usersService.remove(id, operatorId);
  }

  @Post('change-password')
  @ApiOperation({ summary: '修改密码' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser('sub') id: string,
  ) {
    return this.usersService.changePassword(id, dto);
  }
}

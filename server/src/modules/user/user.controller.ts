import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserService } from './user.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UserRole } from '../../entities';

@ApiTags('用户管理')
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  @Get('role/:role')
  @ApiOperation({ summary: '按角色查询用户' })
  findByRole(@Param('role') role: UserRole, @Query() pagination: PaginationDto) {
    return this.service.findByRole(role, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个用户' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  create(@Body() dto: any, @Query('operator') operator: string = 'system') {
    return this.service.create(dto, operator);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户' })
  update(
    @Param('id') id: string,
    @Body() dto: any,
    @Query('operator') operator: string = 'system',
  ) {
    return this.service.update(id, dto, operator);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }
}

import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MemberService } from './member.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

@Controller('members')
export class MemberController {
  constructor(private memberService: MemberService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
    @Query('level') level?: string,
    @CurrentUser() user?: any,
  ) {
    const params: any = { page, pageSize, keyword, level };
    if (user.role === UserRole.STORE_GUIDE && user.storeId) {
      params.storeId = user.storeId;
    }
    return this.memberService.findAll(params);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats() {
    return this.memberService.getStats();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return this.memberService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: any) {
    return this.memberService.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() body: any) {
    return this.memberService.update(id, body);
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LevelService } from './level.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums';

@Controller('levels')
export class LevelController {
  constructor(private levelService: LevelService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Query('enabledOnly') enabledOnly?: string) {
    return this.levelService.findAll(enabledOnly === 'true');
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return this.levelService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)
  async create(@Body() body: any) {
    return this.levelService.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)
  async update(@Param('id') id: string, @Body() body: any) {
    return this.levelService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.levelService.remove(id);
  }
}

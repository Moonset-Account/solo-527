import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BenefitService } from './benefit.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums';

@Controller('benefits')
export class BenefitController {
  constructor(private benefitService: BenefitService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Query('enabledOnly') enabledOnly?: string,
    @Query('level') level?: string,
    @Query('type') type?: string,
  ) {
    return this.benefitService.findAll({
      enabledOnly: enabledOnly === 'true',
      level,
      type,
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return this.benefitService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)
  async create(@Body() body: any) {
    return this.benefitService.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.BRAND_OPERATOR)
  async update(@Param('id') id: string, @Body() body: any) {
    return this.benefitService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.benefitService.remove(id);
  }
}

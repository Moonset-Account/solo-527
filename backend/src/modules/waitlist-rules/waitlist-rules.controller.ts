import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { WaitlistRulesService } from './waitlist-rules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('waitlist-rules')
@UseGuards(JwtAuthGuard)
export class WaitlistRulesController {
  constructor(private readonly waitlistRulesService: WaitlistRulesService) {}

  @Post()
  create(@Body() createRuleDto: any) {
    return this.waitlistRulesService.create(createRuleDto);
  }

  @Get()
  findAll(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query('isActive') isActive: string,
  ) {
    const active = isActive === undefined ? undefined : isActive === 'true';
    return this.waitlistRulesService.findAll(page, pageSize, active);
  }

  @Get('active')
  getActiveRules() {
    return this.waitlistRulesService.getActiveRules();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.waitlistRulesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateRuleDto: any) {
    return this.waitlistRulesService.update(id, updateRuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.waitlistRulesService.remove(id);
  }

  @Post(':id/toggle')
  toggleActive(@Param('id') id: string) {
    return this.waitlistRulesService.toggleActive(id);
  }
}

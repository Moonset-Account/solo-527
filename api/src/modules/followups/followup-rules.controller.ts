import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FollowupRulesService } from './followup-rules.service.js';
import { CreateFollowupRuleDto } from './dto/create-followup-rule.dto.js';
import { UpdateFollowupRuleDto } from './dto/update-followup-rule.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('followup-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FollowupRulesController {
  constructor(private followupRulesService: FollowupRulesService) {}

  @Get()
  async findAll() {
    return this.followupRulesService.findAll();
  }

  @Post()
  @Roles('admin', 'manager')
  async create(@Body() dto: CreateFollowupRuleDto) {
    return this.followupRulesService.create(dto);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  async update(@Param('id') id: string, @Body() dto: UpdateFollowupRuleDto) {
    return this.followupRulesService.update(id, dto);
  }

  @Patch(':id/toggle')
  @Roles('admin', 'manager')
  async toggle(@Param('id') id: string) {
    return this.followupRulesService.toggle(id);
  }
}

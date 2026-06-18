import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AlertRulesService } from './alert-rules.service';
import {
  CreateAlertRuleDto,
  UpdateAlertRuleDto,
  QueryAlertRulesDto,
} from './dto/alert-rule.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('alert-rules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertRulesController {
  constructor(private readonly alertRulesService: AlertRulesService) {}

  @Post()
  @Roles('admin', 'manager')
  create(
    @Body() createDto: CreateAlertRuleDto,
    @CurrentUser() user: any,
  ) {
    return this.alertRulesService.create(createDto, user);
  }

  @Get()
  findAll(@Query() query: QueryAlertRulesDto) {
    return this.alertRulesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alertRulesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'manager')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAlertRuleDto,
  ) {
    return this.alertRulesService.update(id, updateDto);
  }

  @Patch(':id/toggle')
  @Roles('admin', 'manager')
  toggleStatus(@Param('id') id: string) {
    return this.alertRulesService.toggleStatus(id);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  remove(@Param('id') id: string) {
    return this.alertRulesService.remove(id);
  }
}

import { Controller, Get, Post, Body, Param, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SettlementsService } from './settlements.service';
import { CreateSettlementDto, ConfirmSettlementDto, PaySettlementDto, QuerySettlementsDto } from './dto/settlement.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user.enum';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @Body() dto: CreateSettlementDto,
    @GetCurrentUser('id') operatorId: string,
  ) {
    return this.settlementsService.create(dto, operatorId);
  }

  @Post('monthly')
  @Roles(UserRole.ADMIN)
  createMonthly(
    @Body('photographerId') photographerId: string,
    @Body('period') period: string,
    @GetCurrentUser('id') operatorId: string,
  ) {
    return this.settlementsService.createMonthly(photographerId, period, operatorId);
  }

  @Get()
  findAll(
    @Query() query: QuerySettlementsDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.settlementsService.findAll(query, userId, userRole);
  }

  @Get('summary')
  getSummary(
    @Query('photographerId') photographerId?: string,
    @Query('period') period?: string,
  ) {
    return this.settlementsService.getSummary(photographerId, period);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.settlementsService.findOne(id);
  }

  @Put(':id/confirm')
  @Roles(UserRole.ADMIN, UserRole.PHOTOGRAPHER)
  confirm(
    @Param('id') id: string,
    @Body() dto: ConfirmSettlementDto,
    @GetCurrentUser('id') operatorId: string,
  ) {
    return this.settlementsService.confirm(id, dto, operatorId);
  }

  @Put(':id/pay')
  @Roles(UserRole.ADMIN)
  pay(
    @Param('id') id: string,
    @Body() dto: PaySettlementDto,
    @GetCurrentUser('id') operatorId: string,
  ) {
    return this.settlementsService.pay(id, dto, operatorId);
  }

  @Put(':id/cancel')
  @Roles(UserRole.ADMIN)
  cancel(
    @Param('id') id: string,
    @Body('remark') remark: string,
    @GetCurrentUser('id') operatorId: string,
  ) {
    return this.settlementsService.cancel(id, remark, operatorId);
  }
}

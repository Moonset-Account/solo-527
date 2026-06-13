import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ChargeService } from '../services/charge.service';
import { CreateChargeDto, PayChargeDto, CheckChargeDto, ChargeListQueryDto } from '../dto/charge.dto';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequiresPermission } from '../../../common/decorators/requires-permission.decorator';

@Controller('charges')
export class ChargeController {
  constructor(private readonly chargeService: ChargeService) {}

  @Post()
  @RequiresPermission('charge:create')
  async create(
    @Body() dto: CreateChargeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chargeService.create(dto, user);
  }

  @Get()
  @RequiresPermission('charge:view')
  async findAll(
    @Query() query: ChargeListQueryDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.chargeService.findAll(query, user?.clinicId);
  }

  @Get('items')
  @RequiresPermission('charge:view')
  async getChargeItems(
    @Query('category') category?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.chargeService.findChargeItems(user?.clinicId, category);
  }

  @Get('accuracy')
  @RequiresPermission('charge_accuracy:view')
  async getChargeAccuracy(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('isAccurate') isAccurate?: string,
    @Query('isRevisitBackfill') isRevisitBackfill?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.chargeService.getChargeAccuracyList({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      clinicId: user?.clinicId,
      isAccurate: isAccurate !== undefined ? isAccurate === 'true' : undefined,
      isRevisitBackfill: isRevisitBackfill !== undefined ? isRevisitBackfill === 'true' : undefined,
    });
  }

  @Get(':id')
  @RequiresPermission('charge:view')
  async findOne(@Param('id') id: string) {
    return this.chargeService.findOne(id);
  }

  @Put(':id/pay')
  @RequiresPermission('charge:create')
  async pay(
    @Param('id') id: string,
    @Body() dto: PayChargeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chargeService.pay(id, dto, user);
  }

  @Put(':id/check')
  @RequiresPermission('charge:check')
  async check(
    @Param('id') id: string,
    @Body() dto: CheckChargeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.chargeService.check(id, dto, user);
  }
}

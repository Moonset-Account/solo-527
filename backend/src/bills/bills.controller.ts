import { Controller, Get, Post, Body, Put, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { CreateBillDto, UpdateBillDto, PaymentRecordDto } from './dto/bill.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/decorators/roles.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.schema';

@ApiTags('账单管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '创建账单(管理端)' })
  create(@Body() dto: CreateBillDto, @CurrentUser() user: User) {
    return this.billsService.create(dto, user._id);
  }

  @Post('batch')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '批量创建账单' })
  createBatch(@Body() dtos: CreateBillDto[], @CurrentUser() user: User) {
    return this.billsService.createBatch(dtos, user._id);
  }

  @Get()
  @ApiOperation({ summary: '账单列表' })
  findAll(@Query() query: any) {
    return this.billsService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: '收费进度统计' })
  getStatistics() {
    return this.billsService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '账单详情' })
  findOne(@Param('id') id: string) {
    return this.billsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '更新账单' })
  update(@Param('id') id: string, @Body() dto: UpdateBillDto, @CurrentUser() user: User) {
    return this.billsService.update(id, dto, user._id);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: '缴费(客服端)' })
  pay(@Param('id') id: string, @Body() dto: PaymentRecordDto, @CurrentUser() user: User) {
    return this.billsService.pay(id, dto, user._id);
  }
}

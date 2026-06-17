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
  Req,
  Ip,
} from '@nestjs/common';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import { BillQueryDto } from './dto/bill-query.dto';
import { ReconcileBillDto } from './dto/reconcile-bill.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('bills')
@UseGuards(JwtAuthGuard)
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  async create(
    @Body() createBillDto: CreateBillDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const data = await this.billsService.create(
      createBillDto,
      req.user?.userId,
      ip,
    );
    return { success: true, data };
  }

  @Get()
  async findAll(@Query() query: BillQueryDto) {
    const data = await this.billsService.findAll(query);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.billsService.findOne(id);
    return { success: true, data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBillDto: UpdateBillDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const data = await this.billsService.update(
      id,
      updateBillDto,
      req.user?.userId,
      ip,
    );
    return { success: true, data };
  }

  @Patch(':id/reconcile')
  async reconcile(
    @Param('id') id: string,
    @Body() reconcileDto: ReconcileBillDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const data = await this.billsService.reconcile(
      id,
      reconcileDto,
      req.user?.userId,
      ip,
    );
    return { success: true, data };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    await this.billsService.remove(id, req.user?.userId, ip);
    return { success: true, data: null };
  }
}

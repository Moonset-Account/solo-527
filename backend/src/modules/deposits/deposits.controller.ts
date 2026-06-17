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
import { DepositsService } from './deposits.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { DepositQueryDto } from './dto/deposit-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('deposits')
@UseGuards(JwtAuthGuard)
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Post()
  async create(
    @Body() createDepositDto: CreateDepositDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const data = await this.depositsService.create(
      createDepositDto,
      req.user?.userId,
      ip,
    );
    return { success: true, data };
  }

  @Get()
  async findAll(@Query() query: DepositQueryDto) {
    const data = await this.depositsService.findAll(query);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.depositsService.findOne(id);
    return { success: true, data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDepositDto: Partial<CreateDepositDto>,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const data = await this.depositsService.update(
      id,
      updateDepositDto,
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
    await this.depositsService.remove(id, req.user?.userId, ip);
    return { success: true, data: null };
  }
}

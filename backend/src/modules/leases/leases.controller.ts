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
import { LeasesService } from './leases.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { LeaseQueryDto } from './dto/lease-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leases')
@UseGuards(JwtAuthGuard)
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Post()
  async create(
    @Body() createLeaseDto: CreateLeaseDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const data = await this.leasesService.create(
      createLeaseDto,
      req.user?.userId,
      ip,
    );
    return { success: true, data };
  }

  @Get()
  async findAll(@Query() query: LeaseQueryDto) {
    const data = await this.leasesService.findAll(query);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.leasesService.findOne(id);
    return { success: true, data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateLeaseDto: UpdateLeaseDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const data = await this.leasesService.update(
      id,
      updateLeaseDto,
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
    await this.leasesService.remove(id, req.user?.userId, ip);
    return { success: true, data: null };
  }
}

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
import { PricingService } from './pricing.service';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { PricingQueryDto } from './dto/pricing-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('pricing')
@UseGuards(JwtAuthGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post()
  async create(
    @Body() createPricingDto: CreatePricingDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const data = await this.pricingService.create(
      createPricingDto,
      req.user?.userId,
      ip,
    );
    return { success: true, data };
  }

  @Get()
  async findAll(@Query() query: PricingQueryDto) {
    const data = await this.pricingService.findAll(query);
    return { success: true, data };
  }

  @Get('current/:propertyId')
  async findCurrent(@Param('propertyId') propertyId: string) {
    const data = await this.pricingService.findCurrentByPropertyId(propertyId);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.pricingService.findOne(id);
    return { success: true, data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePricingDto: Partial<CreatePricingDto>,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const data = await this.pricingService.update(
      id,
      updatePricingDto,
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
    await this.pricingService.remove(id, req.user?.userId, ip);
    return { success: true, data: null };
  }
}

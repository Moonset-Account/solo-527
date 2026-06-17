import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InstrumentService } from './instrument.service';
import { CreateInstrumentDto, QueryInstrumentDto, CreateBookingDto, QueryBookingDto } from './dto/instrument.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/index.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('instruments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('instruments')
export class InstrumentController {
  constructor(private readonly instrumentService: InstrumentService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LAB_MANAGER)
  @ApiOperation({ summary: '新增仪器' })
  async createInstrument(@Body() dto: CreateInstrumentDto, @CurrentUser('sub') operatorId: string) {
    return this.instrumentService.createInstrument(dto, operatorId);
  }

  @Get()
  @ApiOperation({ summary: '获取仪器列表' })
  async findInstruments(@Query() query: QueryInstrumentDto) {
    return this.instrumentService.findInstruments(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取仪器详情' })
  async findInstrument(@Param('id') id: string) {
    return this.instrumentService.findInstrumentById(id);
  }

  @Post('bookings')
  @ApiOperation({ summary: '预约仪器' })
  async createBooking(@Body() dto: CreateBookingDto, @CurrentUser('sub') userId: string) {
    return this.instrumentService.createBooking(dto, userId);
  }

  @Get('bookings/list')
  @ApiOperation({ summary: '获取预约列表' })
  async findBookings(@Query() query: QueryBookingDto) {
    return this.instrumentService.findBookings(query);
  }

  @Get('bookings/:id')
  @ApiOperation({ summary: '获取预约详情' })
  async findBooking(@Param('id') id: string) {
    return this.instrumentService.findBookingById(id);
  }

  @Post('bookings/:id/cancel')
  @ApiOperation({ summary: '取消预约' })
  async cancelBooking(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.instrumentService.cancelBooking(id, userId);
  }
}

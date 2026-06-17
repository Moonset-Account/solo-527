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
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { CreateTicketLogDto } from './dto/create-ticket-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  async create(
    @Body() createTicketDto: CreateTicketDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const data = await this.ticketsService.create(
      createTicketDto,
      req.user?.userId,
      ip,
    );
    return { success: true, data };
  }

  @Get()
  async findAll(@Query() query: TicketQueryDto) {
    const data = await this.ticketsService.findAll(query);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.ticketsService.findOne(id);
    return { success: true, data };
  }

  @Get(':id/logs')
  async getLogs(@Param('id') id: string) {
    const data = await this.ticketsService.getLogs(id);
    return { success: true, data };
  }

  @Post(':id/logs')
  async addLog(
    @Param('id') id: string,
    @Body() createTicketLogDto: CreateTicketLogDto,
    @Req() req: any,
  ) {
    const data = await this.ticketsService.addLog(
      id,
      createTicketLogDto,
      req.user?.userId,
    );
    return { success: true, data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const data = await this.ticketsService.update(
      id,
      updateTicketDto,
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
    await this.ticketsService.remove(id, req.user?.userId, ip);
    return { success: true, data: null };
  }
}

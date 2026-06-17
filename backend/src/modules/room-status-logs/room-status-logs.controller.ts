import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  Ip,
} from '@nestjs/common';
import { RoomStatusLogsService } from './room-status-logs.service';
import { CreateRoomStatusLogDto } from './dto/create-room-status-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('room-status-logs')
@UseGuards(JwtAuthGuard)
export class RoomStatusLogsController {
  constructor(private readonly roomStatusLogsService: RoomStatusLogsService) {}

  @Post()
  async create(
    @Body() createRoomStatusLogDto: CreateRoomStatusLogDto,
    @Req() req: any,
    @Ip() ip: string,
  ) {
    const data = await this.roomStatusLogsService.create(
      createRoomStatusLogDto,
      req.user?.userId,
    );
    return { success: true, data };
  }

  @Get()
  async findAll(
    @Query('propertyId') propertyId?: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    const data = await this.roomStatusLogsService.findAll(propertyId, page, pageSize);
    return { success: true, data };
  }

  @Get('property/:propertyId')
  async findByPropertyId(@Param('propertyId') propertyId: string) {
    const data = await this.roomStatusLogsService.findByPropertyId(propertyId);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.roomStatusLogsService.findOne(id);
    return { success: true, data };
  }
}

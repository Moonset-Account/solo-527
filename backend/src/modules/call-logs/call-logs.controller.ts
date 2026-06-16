import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CallLogsService } from './call-logs.service';
import { CreateCallLogDto, QueryCallLogDto } from './dto/call-log.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('call-logs')
@UseGuards(JwtAuthGuard)
export class CallLogsController {
  constructor(private readonly callLogsService: CallLogsService) {}

  @Post()
  async create(
    @Body() createCallLogDto: CreateCallLogDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    const isDemo = user.role === 'demo';
    return this.callLogsService.create(createCallLogDto, user.sub || user.id, isDemo);
  }

  @Get()
  async findAll(
    @Query() queryDto: QueryCallLogDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    return this.callLogsService.findAll(queryDto, user.sub || user.id, user.role);
  }
}

import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ProcessingRecordsService } from './processing-records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { RecordEntityType } from './entities/processing-record.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('processing-records')
@UseGuards(JwtAuthGuard)
export class ProcessingRecordsController {
  constructor(private processingRecordsService: ProcessingRecordsService) {}

  @Get('entity/:entityType/:entityId')
  async findByEntity(
    @Param('entityType') entityType: RecordEntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.processingRecordsService.findByEntity(entityType, entityId);
  }

  @Post()
  async create(@Body() createDto: CreateRecordDto, @CurrentUser() user: any) {
    return this.processingRecordsService.create(createDto, user);
  }
}

import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { CollectionService } from './collection.service';
import {
  CreateCollectionRhythmDto,
  UpdateCollectionRhythmDto,
  CreateCollectionRecordDto,
  UpdateCollectionRecordDto,
  CollectionFilterDto,
  RhythmFilterDto,
} from './dto/collection.dto';
import { AuditLog } from '@/common/decorators/audit-log.decorator';

@Controller('collection')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post('rhythms')
  @AuditLog({ action: 'create', entityType: 'collection_rhythm', description: 'Create collection rhythm' })
  createRhythm(@Body() dto: CreateCollectionRhythmDto) {
    return this.collectionService.createRhythm(dto);
  }

  @Get('rhythms')
  findAllRhythms(@Query() filters: RhythmFilterDto) {
    return this.collectionService.findAllRhythms(filters);
  }

  @Get('rhythms/:id')
  findOneRhythm(@Param('id') id: string) {
    return this.collectionService.findOneRhythm(id);
  }

  @Put('rhythms/:id')
  @AuditLog({ action: 'update', entityType: 'collection_rhythm', description: 'Update collection rhythm' })
  updateRhythm(@Param('id') id: string, @Body() dto: UpdateCollectionRhythmDto) {
    return this.collectionService.updateRhythm(id, dto);
  }

  @Post('records')
  @AuditLog({ action: 'create', entityType: 'collection_record', description: 'Create collection record' })
  createRecord(@Body() dto: CreateCollectionRecordDto) {
    return this.collectionService.createRecord(dto);
  }

  @Get('records')
  findAllRecords(@Query() filters: CollectionFilterDto) {
    return this.collectionService.findAllRecords(filters);
  }

  @Get('records/statistics')
  getStatistics() {
    return this.collectionService.getStatistics();
  }

  @Get('records/:id')
  findOneRecord(@Param('id') id: string) {
    return this.collectionService.findOneRecord(id);
  }

  @Put('records/:id')
  @AuditLog({ action: 'update', entityType: 'collection_record', description: 'Update collection record' })
  updateRecord(@Param('id') id: string, @Body() dto: UpdateCollectionRecordDto) {
    return this.collectionService.updateRecord(id, dto);
  }
}

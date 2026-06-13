import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ContentService } from './content.service';
import {
  CreateContentDto,
  UpdateContentDto,
  QueryContentDto,
  SubmitReviewDto,
  HandleExceptionDto,
} from './dto/content.dto';

@Controller('contents')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  create(@Body() dto: CreateContentDto) {
    return this.contentService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryContentDto) {
    return this.contentService.findAll(query);
  }

  @Get('exceptions')
  findExceptions(@Query() query: QueryContentDto) {
    return this.contentService.findAll({ ...query, isException: true });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContentDto & { operator: string }) {
    const { operator, ...rest } = dto;
    return this.contentService.update(id, rest, operator || 'system');
  }

  @Post(':id/submit-review')
  submitReview(@Param('id') id: string, @Body() dto: SubmitReviewDto) {
    return this.contentService.submitReview(id, dto);
  }

  @Post(':id/handle-exception')
  handleException(@Param('id') id: string, @Body() dto: HandleExceptionDto) {
    return this.contentService.handleException(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Body('operator') operator: string = 'system') {
    return this.contentService.remove(id, operator);
  }
}

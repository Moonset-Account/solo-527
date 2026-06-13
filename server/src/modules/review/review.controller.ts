import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import {
  CreateReviewFlowDto,
  UpdateReviewFlowDto,
  QueryReviewRecordDto,
  CreateReviewRecordDto,
} from './dto/review.dto';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('flows')
  createFlow(@Body() dto: CreateReviewFlowDto) {
    return this.reviewService.createFlow(dto);
  }

  @Get('flows')
  findAllFlows() {
    return this.reviewService.findAllFlows();
  }

  @Get('flows/active')
  findActiveFlows() {
    return this.reviewService.findActiveFlows();
  }

  @Get('flows/:id')
  findOneFlow(@Param('id') id: string) {
    return this.reviewService.findOneFlow(id);
  }

  @Put('flows/:id')
  updateFlow(@Param('id') id: string, @Body() dto: UpdateReviewFlowDto) {
    return this.reviewService.updateFlow(id, dto);
  }

  @Delete('flows/:id')
  removeFlow(@Param('id') id: string) {
    return this.reviewService.removeFlow(id);
  }

  @Post('records')
  createReviewRecord(@Body() dto: CreateReviewRecordDto) {
    return this.reviewService.createReviewRecord(dto);
  }

  @Get('records')
  findReviewRecords(@Query() query: QueryReviewRecordDto) {
    return this.reviewService.findReviewRecords(query);
  }
}

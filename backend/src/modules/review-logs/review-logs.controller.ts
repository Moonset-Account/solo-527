import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReviewLogsService } from './review-logs.service';
import { CreateReviewLogDto, QueryReviewLogDto } from './dto/review-log.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('review-logs')
@UseGuards(JwtAuthGuard)
export class ReviewLogsController {
  constructor(private readonly reviewLogsService: ReviewLogsService) {}

  @Post()
  async create(
    @Body() createReviewLogDto: CreateReviewLogDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    const isDemo = user.role === 'demo';
    return this.reviewLogsService.create(createReviewLogDto, user.sub || user.id, isDemo);
  }

  @Get()
  async findAll(@Query() queryDto: QueryReviewLogDto) {
    return this.reviewLogsService.findAll(queryDto);
  }

  @Get('draft/:draftId')
  async findByDraftId(@Param('draftId') draftId: string) {
    return this.reviewLogsService.findByDraftId(draftId);
  }
}

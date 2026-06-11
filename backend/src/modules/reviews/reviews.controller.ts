import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  QueryReviewDto,
  PendingFollowUpDto,
  FollowUpDto,
  ReplyReviewDto,
  BatchFollowUpDto,
} from '../../dto/review.dto';
import { Types } from 'mongoose';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  async createReview(@Body() dto: CreateReviewDto) {
    try {
      const review = await this.reviewsService.createReview(dto);
      return {
        code: 0,
        message: '创建评价成功',
        data: review,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '创建评价失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async queryReviews(@Query() query: QueryReviewDto) {
    try {
      const result = await this.reviewsService.queryReviews(query);
      return {
        code: 0,
        message: '查询评价列表成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '查询评价列表失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('pending')
  async getPendingFollowUpList(@Query() query: PendingFollowUpDto) {
    try {
      const result = await this.reviewsService.getPendingFollowUpList(query);
      return {
        code: 0,
        message: '查询待回访列表成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '查询待回访列表失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('stats')
  async getStats() {
    try {
      const result = await this.reviewsService.getStats();
      return {
        code: 0,
        message: '查询评价统计成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '查询评价统计失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async getReviewDetail(@Param('id') id: string) {
    try {
      const reviewId = new Types.ObjectId(id);
      const review = await this.reviewsService.getReviewDetail(reviewId);
      return {
        code: 0,
        message: '查询评价详情成功',
        data: review,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '查询评价详情失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id/reply')
  async replyReview(@Param('id') id: string, @Body() dto: ReplyReviewDto) {
    try {
      const reviewId = new Types.ObjectId(id);
      const review = await this.reviewsService.replyReview(reviewId, dto);
      return {
        code: 0,
        message: '商家回复成功',
        data: review,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '商家回复失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':id/follow-up')
  async followUp(@Param('id') id: string, @Body() dto: FollowUpDto) {
    try {
      const reviewId = new Types.ObjectId(id);
      const review = await this.reviewsService.followUp(reviewId, dto);
      return {
        code: 0,
        message: '回访成功',
        data: review,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '回访失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch('batch-followup')
  async batchFollowUp(@Body() dto: BatchFollowUpDto) {
    try {
      const result = await this.reviewsService.batchFollowUp(dto);
      return {
        code: 0,
        message: '批量回访完成',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '批量回访失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}

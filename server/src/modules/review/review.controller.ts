import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ReviewService, type PaginatedResult, type StatisticsResult } from './review.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import type { IReview, IUser, ReviewConclusion } from '../../common/types/index.js';

@Controller('api/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  async findAll(
    @Query()
    query: {
      page?: string;
      pageSize?: string;
      itemId?: string;
      conclusion?: ReviewConclusion;
    },
  ): Promise<PaginatedResult<IReview>> {
    return this.reviewService.findAll({
      ...query,
      page: query.page ? parseInt(query.page, 10) : undefined,
      pageSize: query.pageSize ? parseInt(query.pageSize, 10) : undefined,
    });
  }

  @Get('statistics')
  async getStatistics(
    @Query()
    query: {
      department?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<StatisticsResult> {
    return this.reviewService.getStatistics(
      query.department,
      query.startDate,
      query.endDate,
    );
  }

  @Post()
  async create(
    @Body() data: CreateReviewDto,
    @CurrentUser() user: IUser,
  ): Promise<IReview> {
    return this.reviewService.create(data.itemId, data.conclusion, data.remark, user._id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateReviewDto,
    @CurrentUser() user: IUser,
  ): Promise<IReview> {
    return this.reviewService.update(id, data.conclusion, data.remark, user._id);
  }
}

import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

export type GroupByType = 'community' | 'date' | 'reason' | 'all';
export type TrendGranularity = 'day' | 'week' | 'month';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const data = await this.analyticsService.getOverview(startDate, endDate);
      return {
        code: 0,
        message: '获取总览数据成功',
        data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '获取总览数据失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('ontime')
  async getOntimeAnalysis(
    @Query('groupBy') groupBy: GroupByType = 'all',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('communities') communities?: string,
  ) {
    try {
      const communityList = communities ? communities.split(',').filter(Boolean) : [];
      const data = await this.analyticsService.getOntimeAnalysis(
        groupBy,
        startDate,
        endDate,
        communityList,
      );
      return {
        code: 0,
        message: '获取履约准时率分析成功',
        data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '获取履约准时率分析失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('region-demand')
  async getRegionDemand(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('communities') communities?: string,
    @Query('categories') categories?: string,
  ) {
    try {
      const communityList = communities ? communities.split(',').filter(Boolean) : [];
      const categoryList = categories ? categories.split(',').filter(Boolean) : [];
      const data = await this.analyticsService.getRegionDemand(
        startDate,
        endDate,
        communityList,
        categoryList,
      );
      return {
        code: 0,
        message: '获取区域需求分析成功',
        data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '获取区域需求分析失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('trend')
  async getTrend(
    @Query('granularity') granularity: TrendGranularity = 'day',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const data = await this.analyticsService.getTrend(granularity, startDate, endDate);
      return {
        code: 0,
        message: '获取趋势分析成功',
        data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '获取趋势分析失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('workers')
  async getWorkerPerformance(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy: 'completed' | 'onTimeRate' | 'rating' | 'reschedule' = 'completed',
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    try {
      const data = await this.analyticsService.getWorkerPerformance(
        startDate,
        endDate,
        sortBy,
        page,
        pageSize,
      );
      return {
        code: 0,
        message: '获取师傅绩效成功',
        data,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '获取师傅绩效失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}

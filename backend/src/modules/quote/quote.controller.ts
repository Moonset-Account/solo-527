import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { QuoteService } from './quote.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('报价管理')
@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Get()
  @ApiOperation({ summary: '获取报价列表' })
  async findAll(@Query() query: any) {
    return this.quoteService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取报价详情' })
  async findOne(@Param('id') id: string) {
    return this.quoteService.findOne(id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: '获取报价历史版本' })
  async getVersions(@Param('id') id: string) {
    return this.quoteService.getVersions(id);
  }

  @Get(':id/compare')
  @ApiOperation({ summary: '版本对比' })
  async compareVersions(
    @Param('id') id: string,
    @Query('version1') version1: number,
    @Query('version2') version2: number,
  ) {
    return this.quoteService.compareVersions(id, version1, version2);
  }

  @Post()
  @ApiOperation({ summary: '创建报价' })
  async create(@Body() dto: any, @CurrentUser() user: User) {
    return this.quoteService.create(dto, user);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交报价审批' })
  async submitForApproval(@Param('id') id: string, @CurrentUser() user: User) {
    return this.quoteService.submitForApproval(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新报价（创建新版本）' })
  async update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: User) {
    return this.quoteService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除报价' })
  async remove(@Param('id') id: string) {
    return this.quoteService.remove(id);
  }
}

import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SampleService } from './sample.service';
import { CreateSampleDto, UpdateSampleStatusDto, QuerySampleDto } from './dto/sample.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/index.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('samples')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('samples')
export class SampleController {
  constructor(private readonly sampleService: SampleService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER, UserRole.LAB_MANAGER)
  @ApiOperation({ summary: '创建样本' })
  async create(@Body() dto: CreateSampleDto, @CurrentUser('sub') operatorId: string) {
    return this.sampleService.create(dto, operatorId);
  }

  @Get()
  @ApiOperation({ summary: '获取样本列表' })
  async findAll(@Query() query: QuerySampleDto) {
    return this.sampleService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取样本统计' })
  async getStatistics() {
    return this.sampleService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取样本详情' })
  async findOne(@Param('id') id: string) {
    return this.sampleService.findById(id);
  }

  @Put(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER, UserRole.LAB_MANAGER)
  @ApiOperation({ summary: '更新样本状态（含去向不明标记）' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSampleStatusDto,
    @CurrentUser('sub') operatorId: string,
  ) {
    return this.sampleService.updateStatus(id, dto, operatorId);
  }
}

import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CreateOriginalDocumentDto, QueryOriginalDocumentDto } from './dto/dashboard.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@/common/enums/index.enum';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: '获取首页概览数据' })
  async getOverview() {
    return this.dashboardService.getOverview();
  }

  @Post('documents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '上传原始单据' })
  async createDocument(@Body() dto: CreateOriginalDocumentDto, @CurrentUser('sub') operatorId: string) {
    return this.dashboardService.createDocument(dto, operatorId);
  }

  @Get('documents')
  @ApiOperation({ summary: '获取原始单据列表' })
  async findDocuments(@Query() query: QueryOriginalDocumentDto) {
    return this.dashboardService.findDocuments(query);
  }

  @Get('documents/:id')
  @ApiOperation({ summary: '获取原始单据详情' })
  async findDocument(@Param('id') id: string) {
    return this.dashboardService.findDocumentById(id);
  }
}

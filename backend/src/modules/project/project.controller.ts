import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProjectService } from './project.service';
import { CreateProjectDto, QueryProjectDto, CreateProjectReportDto } from './dto/project.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@/common/enums/index.enum';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER, UserRole.LAB_MANAGER)
  @ApiOperation({ summary: '创建课题' })
  async createProject(@Body() dto: CreateProjectDto, @CurrentUser('sub') operatorId: string) {
    return this.projectService.createProject(dto, operatorId);
  }

  @Get()
  @ApiOperation({ summary: '获取课题列表' })
  async findProjects(@Query() query: QueryProjectDto) {
    return this.projectService.findProjects(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取课题详情' })
  async findProject(@Param('id') id: string) {
    return this.projectService.findProjectById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER, UserRole.LAB_MANAGER)
  @ApiOperation({ summary: '更新课题' })
  async updateProject(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProjectDto>,
    @CurrentUser('sub') operatorId: string,
  ) {
    return this.projectService.updateProject(id, dto, operatorId);
  }

  @Post('reports')
  @ApiOperation({ summary: '创建课题报表' })
  async createReport(@Body() dto: CreateProjectReportDto, @CurrentUser('sub') userId: string) {
    return this.projectService.createReport(dto, userId);
  }

  @Get(':projectId/reports')
  @ApiOperation({ summary: '获取课题报表列表' })
  async findReports(@Param('projectId') projectId: string) {
    return this.projectService.findReportsByProject(projectId);
  }
}

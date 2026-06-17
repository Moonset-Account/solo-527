import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HazardousService } from './hazardous.service';
import { CreateHazardousLabelDto, QueryHazardousLabelDto } from './dto/hazardous.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@/common/enums/index.enum';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('hazardous')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hazardous')
export class HazardousController {
  constructor(private readonly hazardousService: HazardousService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '创建危化品标签' })
  async create(@Body() dto: CreateHazardousLabelDto, @CurrentUser('sub') operatorId: string) {
    return this.hazardousService.create(dto, operatorId);
  }

  @Get()
  @ApiOperation({ summary: '获取危化品标签列表' })
  async findAll(@Query() query: QueryHazardousLabelDto) {
    return this.hazardousService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取危化品标签详情' })
  async findOne(@Param('id') id: string) {
    return this.hazardousService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '更新危化品标签' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateHazardousLabelDto>,
    @CurrentUser('sub') operatorId: string,
  ) {
    return this.hazardousService.update(id, dto, operatorId);
  }
}

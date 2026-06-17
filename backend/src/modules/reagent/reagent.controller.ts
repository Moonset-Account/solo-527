import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReagentService } from './reagent.service';
import { CreateReagentDto, UpdateReagentDto, QueryReagentDto } from './dto/reagent.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@/common/enums/index.enum';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('reagents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reagents')
export class ReagentController {
  constructor(private readonly reagentService: ReagentService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '新增试剂' })
  async create(@Body() dto: CreateReagentDto, @CurrentUser('sub') operatorId: string) {
    return this.reagentService.create(dto, operatorId);
  }

  @Get()
  @ApiOperation({ summary: '获取试剂列表' })
  async findAll(@Query() query: QueryReagentDto) {
    return this.reagentService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取试剂统计' })
  async getStatistics() {
    return this.reagentService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取试剂详情' })
  async findOne(@Param('id') id: string) {
    return this.reagentService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '更新试剂' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReagentDto,
    @CurrentUser('sub') operatorId: string,
  ) {
    return this.reagentService.update(id, dto, operatorId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '删除试剂' })
  async remove(@Param('id') id: string, @CurrentUser('sub') operatorId: string) {
    return this.reagentService.remove(id, operatorId);
  }

  @Post(':id/adjust-stock')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '调整库存' })
  async adjustStock(
    @Param('id') id: string,
    @Body() body: { quantity: number; reason?: string },
    @CurrentUser('sub') operatorId: string,
  ) {
    return this.reagentService.adjustStock(id, body.quantity, operatorId, body.reason);
  }
}

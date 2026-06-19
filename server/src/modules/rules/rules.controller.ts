import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RulesService } from './rules.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { ToggleRuleDto } from './dto/toggle-rule.dto';
import { Rule } from '../../schemas/rule.schema';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('规则管理')
@Controller('rules')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  @ApiOperation({ summary: '获取规则列表' })
  @ApiResponse({ status: 200, description: '规则列表', type: [Rule] })
  async findAll(): Promise<Rule[]> {
    return this.rulesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取规则详情' })
  @ApiResponse({ status: 200, description: '规则详情', type: Rule })
  async findOne(@Param('id') id: string): Promise<Rule> {
    return this.rulesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建规则' })
  @ApiResponse({ status: 201, description: '创建成功', type: Rule })
  async create(@Body() createRuleDto: CreateRuleDto): Promise<Rule> {
    return this.rulesService.create(createRuleDto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新规则' })
  @ApiResponse({ status: 200, description: '更新成功', type: Rule })
  async update(
    @Param('id') id: string,
    @Body() updateRuleDto: UpdateRuleDto,
  ): Promise<Rule> {
    return this.rulesService.update(id, updateRuleDto);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: '启停规则（记录操作人和生效时间' })
  @ApiResponse({ status: 200, description: '操作成功', type: Rule })
  async toggle(
    @Param('id') id: string,
    @Body() toggleRuleDto: ToggleRuleDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<Rule> {
    return this.rulesService.toggle(id, toggleRuleDto, currentUser);
  }
}

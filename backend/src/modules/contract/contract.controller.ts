import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ContractService } from './contract.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@ApiTags('合同审批')
@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Get()
  @ApiOperation({ summary: '获取合同列表' })
  async findAll(@Query() query: any) {
    return this.contractService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取合同详情' })
  async findOne(@Param('id') id: string) {
    return this.contractService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建合同' })
  async create(@Body() dto: any) {
    return this.contractService.create(dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: '提交审批' })
  async submit(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @CurrentUser() user: User,
  ) {
    return this.contractService.submit(id, user, body.comment);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '审批通过' })
  async approve(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @CurrentUser() user: User,
  ) {
    return this.contractService.approve(id, user, body.comment);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: '审批驳回' })
  async reject(
    @Param('id') id: string,
    @Body() body: { comment?: string },
    @CurrentUser() user: User,
  ) {
    return this.contractService.reject(id, user, body.comment);
  }
}

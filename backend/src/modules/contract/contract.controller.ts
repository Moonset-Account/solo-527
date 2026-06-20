import { Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ContractService, CreateContractDto, QueryContractDto, ReserveNumberDto } from './contract.service';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ContractStatus, UrgencyLevel } from '../../entities/contract.entity';
import { NumberPoolStatus } from '../../entities/contract-number-pool.entity';

@ApiTags('合同管理')
@ApiBearerAuth()
@Controller('contracts')
export class ContractController {
  constructor(private readonly service: ContractService) {}

  @Post('numbers/reserve')
  @RequirePermissions('contract:number:manage')
  async reserveNumber(@Body() dto: ReserveNumberDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.reserveNumber(dto, user.id);
  }

  @Get('numbers/stats')
  @RequirePermissions('contract:number:manage')
  async getNumberPoolStats() {
    return this.service.getNumberPoolStats();
  }

  @Get('numbers/pool')
  @RequirePermissions('contract:number:manage')
  async listNumberPool(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('status') status?: NumberPoolStatus,
  ) {
    return this.service.listNumberPool(page, pageSize, status);
  }

  @Post()
  @RequirePermissions('contract:create')
  async create(@Body() dto: CreateContractDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.createContract(dto, user);
  }

  @Get('query')
  @RequirePermissions('contract:view')
  async query(@Query() query: QueryContractDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.queryContracts(query, user);
  }

  @Get('stats')
  async getStats(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getStats(user);
  }

  @Get('resources/usage')
  @RequirePermissions('query:advanced')
  async getResourcesUsage() {
    return this.service.getResourcesUsage();
  }

  @Post('resources/:id/lock')
  async lockResource(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { lockHours?: number },
  ) {
    return this.service.lockResource(id, user.id, user.realName, body.lockHours || 2);
  }

  @Post('resources/:id/unlock')
  async unlockResource(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.unlockResource(id, user.id);
  }

  @Get(':id')
  @RequirePermissions('contract:view')
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getContract(id);
  }

  @Get(':id/approval-progress')
  async getApprovalProgress(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getApprovalProgress(id);
  }

  @Put(':id')
  @RequirePermissions('contract:update')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Partial<CreateContractDto>,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.updateContract(id, dto, user);
  }

  @Put(':id/verify-materials')
  @RequirePermissions('material:verify')
  async verifyMaterials(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { verified: boolean; remark?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.verifyMaterials(id, body.verified, body.remark || '', user);
  }

  @Post(':id/archive')
  @RequirePermissions('contract:archive')
  async archiveContract(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.archiveContract(id, user);
  }
}

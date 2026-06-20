import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApprovalService, SubmitApprovalDto, ApproveDto, RejectDto, TransferApprovalDto } from './approval.service';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { ApprovalStatus } from '../../entities/approval-flow.entity';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('审批流程')
@ApiBearerAuth()
@Controller('approvals')
export class ApprovalController {
  constructor(private readonly service: ApprovalService) {}

  @Post('submit')
  @RequirePermissions('approval:submit')
  async submitApproval(@Body() dto: SubmitApprovalDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.submitApproval(dto, user);
  }

  @Get('my-tasks')
  async getMyTasks(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('status') status?: ApprovalStatus,
  ) {
    return this.service.getMyApprovalTasks(user, page, pageSize, status);
  }

  @Get('contract/:contractId/history')
  @RequirePermissions('approval:view')
  async getHistory(@Param('contractId', ParseUUIDPipe) contractId: string) {
    return this.service.getApprovalHistory(contractId);
  }

  @Post(':id/approve')
  @RequirePermissions('approval:review')
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.approve(id, dto, user);
  }

  @Post(':id/reject')
  @RequirePermissions('approval:review')
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.reject(id, dto, user);
  }

  @Post(':id/transfer')
  @RequirePermissions('approval:review')
  async transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferApprovalDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.transfer(id, dto, user);
  }
}

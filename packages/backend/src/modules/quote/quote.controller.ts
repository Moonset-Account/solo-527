import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { Quote, QuoteStatus, ProfitWarningLevel } from '../../entities/quote.entity';
import { User } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuoteController {
  constructor(private quoteService: QuoteService) {}

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('status') status?: QuoteStatus,
    @Query('requirementId') requirementId?: string,
    @Query('profitWarning') profitWarning?: ProfitWarningLevel,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.quoteService.findAll(
      user,
      { status, requirementId, profitWarning },
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: User): Promise<Quote> {
    return this.quoteService.findById(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.PRODUCT_MANAGER)
  async create(
    @Body('requirementId') requirementId: string,
    @Body('templateId') templateId: string,
    @CurrentUser() user: User,
  ): Promise<Quote> {
    return this.quoteService.create(requirementId, user, templateId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.PRODUCT_MANAGER)
  async update(
    @Param('id') id: string,
    @Body() data: Partial<Quote>,
    @Body('changeDescription') changeDescription?: string,
    @CurrentUser() user?: User,
  ): Promise<Quote> {
    return this.quoteService.update(id, data, user, changeDescription);
  }

  @Post(':id/submit')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.PRODUCT_MANAGER)
  async submitForApproval(@Param('id') id: string, @CurrentUser() user: User): Promise<Quote> {
    return this.quoteService.submitForApproval(id, user);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async approve(
    @Param('id') id: string,
    @Body('comments') comments: string,
    @CurrentUser() user: User,
  ): Promise<Quote> {
    return this.quoteService.approve(id, user, comments);
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async reject(
    @Param('id') id: string,
    @Body('comments') comments: string,
    @CurrentUser() user: User,
  ): Promise<Quote> {
    return this.quoteService.reject(id, user, comments);
  }

  @Post(':id/send')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.PRODUCT_MANAGER)
  async sendToCustomer(@Param('id') id: string, @CurrentUser() user: User): Promise<Quote> {
    return this.quoteService.sendToCustomer(id, user);
  }

  @Post(':id/response')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.PRODUCT_MANAGER)
  async customerResponse(
    @Param('id') id: string,
    @Body('accepted') accepted: boolean,
    @CurrentUser() user: User,
  ): Promise<Quote> {
    return this.quoteService.customerResponse(id, accepted, user);
  }

  @Post(':id/version')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.PRODUCT_MANAGER)
  async createNewVersion(
    @Param('id') id: string,
    @Body('changeDescription') changeDescription: string,
    @CurrentUser() user: User,
  ): Promise<Quote> {
    return this.quoteService.createNewVersion(id, user, changeDescription);
  }

  @Get(':id/versions')
  async getVersions(@Param('id') id: string, @CurrentUser() user: User) {
    return this.quoteService.getVersions(id, user);
  }

  @Get(':id/compare')
  async compareVersions(
    @Param('id') id: string,
    @Query('v1') v1: number,
    @Query('v2') v2: number,
    @CurrentUser() user: User,
  ) {
    return this.quoteService.compareVersions(id, Number(v1), Number(v2), user);
  }
}

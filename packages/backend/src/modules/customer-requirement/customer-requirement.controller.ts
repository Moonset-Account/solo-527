import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CustomerRequirementService } from './customer-requirement.service';
import { CustomerRequirement, RequirementStatus } from '../../entities/customer-requirement.entity';
import { User } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('requirements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerRequirementController {
  constructor(private requirementService: CustomerRequirementService) {}

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('status') status?: RequirementStatus,
    @Query('keyword') keyword?: string,
    @Query('destination') destination?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.requirementService.findAll(
      user,
      { status, keyword, destination, assignedToId },
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: User): Promise<CustomerRequirement> {
    return this.requirementService.findById(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.PRODUCT_MANAGER)
  async create(
    @Body() data: Partial<CustomerRequirement>,
    @CurrentUser() user: User,
  ): Promise<CustomerRequirement> {
    return this.requirementService.create(data, user);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.PRODUCT_MANAGER)
  async update(
    @Param('id') id: string,
    @Body() data: Partial<CustomerRequirement>,
    @CurrentUser() user: User,
  ): Promise<CustomerRequirement> {
    return this.requirementService.update(id, data, user);
  }

  @Post(':id/submit')
  @Roles(UserRole.ADMIN, UserRole.SALES)
  async submit(@Param('id') id: string, @CurrentUser() user: User): Promise<CustomerRequirement> {
    return this.requirementService.submit(id, user);
  }

  @Post(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.PRODUCT_MANAGER)
  async assign(
    @Param('id') id: string,
    @Body('assignedToId') assignedToId: string,
    @CurrentUser() user: User,
  ): Promise<CustomerRequirement> {
    return this.requirementService.assign(id, assignedToId, user);
  }

  @Post(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: RequirementStatus,
    @Body('comments') comments: string,
    @CurrentUser() user: User,
  ): Promise<CustomerRequirement> {
    return this.requirementService.updateStatus(id, status, user, comments);
  }
}

import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ContractService } from './contract.service';
import { Contract, ContractStatus } from '../../entities/contract.entity';
import { User } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractController {
  constructor(private contractService: ContractService) {}

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('status') status?: ContractStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.contractService.findAll(user, { status }, Number(page), Number(limit));
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: User): Promise<Contract> {
    return this.contractService.findById(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.PRODUCT_MANAGER)
  async create(
    @Body('quoteId') quoteId: string,
    @CurrentUser() user: User,
  ): Promise<Contract> {
    return this.contractService.create(quoteId, user);
  }

  @Post(':id/submit')
  @Roles(UserRole.ADMIN, UserRole.SALES, UserRole.PRODUCT_MANAGER)
  async submitForApproval(@Param('id') id: string, @CurrentUser() user: User): Promise<Contract> {
    return this.contractService.submitForApproval(id, user);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.FINANCE)
  async approve(
    @Param('id') id: string,
    @Body('comments') comments: string,
    @CurrentUser() user: User,
  ): Promise<Contract> {
    return this.contractService.approve(id, user, comments);
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.FINANCE)
  async reject(
    @Param('id') id: string,
    @Body('comments') comments: string,
    @CurrentUser() user: User,
  ): Promise<Contract> {
    return this.contractService.reject(id, user, comments);
  }

  @Post(':id/sign')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async signContract(
    @Param('id') id: string,
    @Body('customerSignature') customerSignature: string,
    @CurrentUser() user: User,
  ): Promise<Contract> {
    return this.contractService.signContract(id, user, customerSignature);
  }
}

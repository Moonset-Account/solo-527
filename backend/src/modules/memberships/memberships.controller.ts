import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  create(@Body() createMembershipDto: any) {
    return this.membershipsService.create(createMembershipDto);
  }

  @Public()
  @Get()
  findAll(@Query() query: any) {
    return this.membershipsService.findAll(query);
  }

  @Public()
  @Get('active')
  findActive() {
    return this.membershipsService.findActive();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.membershipsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMembershipDto: any) {
    return this.membershipsService.update(id, updateMembershipDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.membershipsService.remove(id);
  }

  @Post('sell')
  sellMembership(@Body() sellDto: any, @CurrentUser('_id') userId: string) {
    return this.membershipsService.sellMembership(sellDto, userId);
  }

  @Get('customer/:customerId')
  getCustomerMemberships(@Param('customerId') customerId: string) {
    return this.membershipsService.getCustomerMemberships(customerId);
  }

  @Get('customer-memberships/list')
  getAllCustomerMemberships(@Query() query: any) {
    return this.membershipsService.getAllCustomerMemberships(query);
  }

  @Patch('customer-memberships/:id/use')
  useMembership(@Param('id') id: string, @Body() body: any) {
    return this.membershipsService.useMembership(id, body.times, body.amount);
  }

  @Get('customer-memberships/:id')
  findCustomerMembershipById(@Param('id') id: string) {
    return this.membershipsService.findCustomerMembershipById(id);
  }
}

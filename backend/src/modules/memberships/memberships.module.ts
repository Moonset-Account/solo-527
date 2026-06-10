import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembershipSchema } from './membership.schema';
import { CustomerMembershipSchema } from './customer-membership.schema';
import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Membership', schema: MembershipSchema },
      { name: 'CustomerMembership', schema: CustomerMembershipSchema },
    ]),
  ],
  providers: [MembershipsService],
  controllers: [MembershipsController],
  exports: [MembershipsService],
})
export class MembershipsModule {}

import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { UserSchema } from '../../schemas/user.schema.js';
import { DepartmentSchema } from '../../schemas/department.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Department', schema: DepartmentSchema },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule implements OnModuleInit {
  constructor(private readonly userService: UserService) {}

  async onModuleInit() {
    await this.userService.initDefaultAdmin();
  }
}

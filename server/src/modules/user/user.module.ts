import { Module, OnModuleInit } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';

@Module({
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

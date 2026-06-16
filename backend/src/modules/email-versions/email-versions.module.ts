import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailVersionsService } from './email-versions.service';
import { EmailVersionsController } from './email-versions.controller';
import { EmailVersion, EmailVersionSchema } from './schemas/email-version.schema';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailVersion.name, schema: EmailVersionSchema },
    ]),
    UsersModule,
    JwtModule,
  ],
  controllers: [EmailVersionsController],
  providers: [EmailVersionsService],
  exports: [EmailVersionsService, MongooseModule],
})
export class EmailVersionsModule {}

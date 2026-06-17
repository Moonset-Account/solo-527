import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CounselorsService } from './counselors.service';
import { CounselorsController } from './counselors.controller';
import { Counselor } from '../../entities/counselor.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Counselor, User])],
  controllers: [CounselorsController],
  providers: [CounselorsService],
  exports: [CounselorsService],
})
export class CounselorsModule {}

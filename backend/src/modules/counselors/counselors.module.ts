import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Counselor } from './counselor.entity';
import { CounselorsService } from './counselors.service';
import { CounselorsController } from './counselors.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Counselor])],
  providers: [CounselorsService],
  controllers: [CounselorsController],
  exports: [CounselorsService],
})
export class CounselorsModule {}

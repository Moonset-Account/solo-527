import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewService } from './review.service.js';
import { ReviewController } from './review.controller.js';
import { LogModule } from '../log/log.module.js';
import { ReviewSchema } from '../../schemas/review.schema.js';
import { ItemSchema } from '../../schemas/item.schema.js';
import { DepartmentSchema } from '../../schemas/department.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Review', schema: ReviewSchema },
      { name: 'Item', schema: ItemSchema },
      { name: 'Department', schema: DepartmentSchema },
    ]),
    LogModule,
  ],
  providers: [ReviewService],
  controllers: [ReviewController],
  exports: [ReviewService],
})
export class ReviewModule {}

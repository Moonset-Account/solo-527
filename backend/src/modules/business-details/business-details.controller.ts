import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { BusinessDetailsService } from './business-details.service';
import { AddCommentDto, UpdateBusinessDetailDto } from './dto/business-detail.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import * as fs from 'fs';

@Controller('business-details')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BusinessDetailsController {
  constructor(private readonly service: BusinessDetailsService) {}

  @Get(':anomalyId')
  findByAnomaly(@Param('anomalyId') anomalyId: string) {
    return this.service.findByAnomaly(anomalyId);
  }

  @Patch(':anomalyId')
  update(
    @Param('anomalyId') anomalyId: string,
    @Body() dto: UpdateBusinessDetailDto,
    @CurrentUser() user: any,
  ) {
    return this.service.update(anomalyId, dto, user);
  }

  @Get(':anomalyId/history')
  getHistory(@Param('anomalyId') anomalyId: string) {
    return this.service.getHistory(anomalyId);
  }

  @Post(':anomalyId/comments')
  addComment(
    @Param('anomalyId') anomalyId: string,
    @Body() dto: AddCommentDto,
    @CurrentUser() user: any,
  ) {
    return this.service.addComment(anomalyId, dto, user);
  }

  @Delete(':anomalyId/comments/:commentId')
  deleteComment(
    @Param('anomalyId') anomalyId: string,
    @Param('commentId') commentId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.deleteComment(anomalyId, commentId, user);
  }

  @Post(':anomalyId/attachments')
  @UseInterceptors(FileInterceptor('file'))
  addAttachment(
    @Param('anomalyId') anomalyId: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    return this.service.addAttachment(anomalyId, file, user);
  }

  @Delete(':anomalyId/attachments/:attachmentId')
  deleteAttachment(
    @Param('anomalyId') anomalyId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.deleteAttachment(anomalyId, attachmentId, user);
  }
}

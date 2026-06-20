import { Controller, Post, Get, Put, Param, Query, ParseUUIDPipe, UseInterceptors, UploadedFile, Body, Res, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { FileService, UploadAttachmentDto, QueryAttachmentDto } from './file.service';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { AttachmentStatus } from '../../entities/contract-attachment.entity';

@ApiTags('文件/附件')
@ApiBearerAuth()
@Controller('files')
export class FileController {
  constructor(private readonly service: FileService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @RequirePermissions('file:upload')
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadAttachmentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.saveUploadedFile(file, dto, user);
  }

  @Get('attachments/query')
  @RequirePermissions('file:upload')
  async queryAttachments(@Query() query: QueryAttachmentDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.queryAttachments(query, user);
  }

  @Get('attachments/stats')
  async getStats() {
    return this.service.getStats();
  }

  @Get('attachments/:id')
  async getAttachment(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.getAttachment(id, user);
  }

  @Get('attachments/:id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.service.downloadAttachment(id, user, res);
  }

  @Put('attachments/:id/permission')
  @RequirePermissions('file:permission:manage')
  async updatePermission(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { permissionConfig: any },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.updateAttachmentPermission(id, body.permissionConfig, user);
  }

  @Put('attachments/:id/review')
  @RequirePermissions('material:verify')
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { status: AttachmentStatus; remark?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.reviewAttachment(id, body.status, body.remark || '', user);
  }
}

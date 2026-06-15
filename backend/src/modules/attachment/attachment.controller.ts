import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseInterceptors, UploadedFile, Res, Header } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AttachmentService } from './attachment.service';
import { UpdateAttachmentDto, AttachmentFilterDto } from './dto/attachment.dto';
import { AuditLog } from '@/common/decorators/audit-log.decorator';

@Controller('attachments')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @AuditLog({ action: 'upload', entityType: 'attachment', description: 'Upload attachment' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('entityType') entityType: string,
    @Body('entityId') entityId: string,
    @Body('description') description?: string,
  ) {
    return this.attachmentService.uploadFile(file, entityType, entityId, description);
  }

  @Get()
  findAll(@Query() filters: AttachmentFilterDto) {
    return this.attachmentService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attachmentService.findOne(id);
  }

  @Get(':id/download')
  @Header('Content-Type', 'application/octet-stream')
  async download(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const result = await this.attachmentService.downloadFile(id);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.fileName)}"`);
    res.setHeader('Content-Type', result.mimeType);
    return result.file;
  }

  @Put(':id')
  @AuditLog({ action: 'update', entityType: 'attachment', description: 'Update attachment' })
  update(@Param('id') id: string, @Body() updateAttachmentDto: UpdateAttachmentDto) {
    return this.attachmentService.update(id, updateAttachmentDto);
  }

  @Delete(':id')
  @AuditLog({ action: 'delete', entityType: 'attachment', description: 'Delete attachment' })
  delete(@Param('id') id: string) {
    return this.attachmentService.delete(id);
  }
}

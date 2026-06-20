import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import { AttachmentType } from '../../common/enums/attachment.enum';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/user.enum';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: AttachmentType = AttachmentType.OTHER,
    @Body('materialId') materialId: string,
    @Body('deliveryId') deliveryId: string,
    @Body('exceptionId') exceptionId: string,
    @Body('isKey') isKey: string,
    @Body('remark') remark: string,
    @GetCurrentUser('id') operatorId: string,
  ) {
    return this.attachmentsService.saveFile(file, type, operatorId, {
      materialId,
      deliveryId,
      exceptionId,
      isKey: isKey === 'true',
      remark,
    });
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 20))
  uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('type') type: AttachmentType = AttachmentType.OTHER,
    @Body('materialId') materialId: string,
    @Body('deliveryId') deliveryId: string,
    @Body('exceptionId') exceptionId: string,
    @Body('remark') remark: string,
    @GetCurrentUser('id') operatorId: string,
  ) {
    return this.attachmentsService.saveFiles(files, type, operatorId, {
      materialId,
      deliveryId,
      exceptionId,
      remark,
    });
  }

  @Get('material/:materialId')
  findByMaterial(@Param('materialId') materialId: string) {
    return this.attachmentsService.findByMaterial(materialId);
  }

  @Get('delivery/:deliveryId')
  findByDelivery(@Param('deliveryId') deliveryId: string) {
    return this.attachmentsService.findByDelivery(deliveryId);
  }

  @Get('exception/:exceptionId')
  findByException(@Param('exceptionId') exceptionId: string) {
    return this.attachmentsService.findByException(exceptionId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.attachmentsService.findOne(id);
  }

  @Post(':id/download')
  incrementDownload(@Param('id') id: string) {
    return this.attachmentsService.incrementDownload(id);
  }

  @Put(':id/key')
  @Roles(UserRole.ADMIN, UserRole.PHOTOGRAPHER)
  toggleKey(@Param('id') id: string, @Body('isKey') isKey: boolean) {
    return this.attachmentsService.toggleKey(id, isKey);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetCurrentUser('id') operatorId: string) {
    return this.attachmentsService.remove(id, operatorId);
  }
}

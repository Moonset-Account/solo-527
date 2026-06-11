import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileService } from './file.service.js';
import { UploadPhotoDto } from './dto.js';
import { RolesGuard } from '../auth/roles.guard.js';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FileController {
  constructor(private fileService: FileService) {}

  @Post('files/upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
  }))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('projectId') projectId: string,
    @Request() req: any,
  ) {
    return this.fileService.uploadFile(file, projectId, req.user.id);
  }

  @Post('projects/:projectId/photos')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/photos',
      filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + extname(file.originalname));
      },
    }),
  }))
  async uploadPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Param('projectId') projectId: string,
    @Body() dto: UploadPhotoDto,
  ) {
    return this.fileService.uploadPhoto(file, projectId, dto.description);
  }

  @Delete('files/:id')
  async deleteFile(@Param('id') id: string) {
    return this.fileService.deleteFile(id);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './attachment.entity.js';
import { ProjectPhoto } from './project-photo.entity.js';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentRepo: Repository<Attachment>,
    @InjectRepository(ProjectPhoto)
    private photoRepo: Repository<ProjectPhoto>,
  ) {}

  async uploadFile(file: Express.Multer.File, projectId: string, uploadedBy: string) {
    const attachment = this.attachmentRepo.create({
      projectId,
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedBy,
    });
    return this.attachmentRepo.save(attachment);
  }

  async uploadPhoto(file: Express.Multer.File, projectId: string, description?: string) {
    const photo = this.photoRepo.create({
      projectId,
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      description,
    });
    return this.photoRepo.save(photo);
  }

  async deleteFile(id: string) {
    const attachment = await this.attachmentRepo.findOne({ where: { id } });
    if (!attachment) throw new NotFoundException('File not found');
    await this.attachmentRepo.remove(attachment);
    return { message: 'File deleted' };
  }

  async findByProject(projectId: string) {
    const [attachments, photos] = await Promise.all([
      this.attachmentRepo.find({ where: { projectId } }),
      this.photoRepo.find({ where: { projectId } }),
    ]);
    return { attachments, photos };
  }
}

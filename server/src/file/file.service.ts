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

  async uploadFile(file: Express.Multer.File, entityType: 'contract' | 'project', entityId: string, uploadedBy: string) {
    const attachment = this.attachmentRepo.create({
      entityType,
      entityId,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
      url: `/uploads/${file.filename || file.originalname}`,
      uploadedBy,
    });
    return this.attachmentRepo.save(attachment);
  }

  async uploadPhoto(file: Express.Multer.File, projectId: string, area?: string, uploadedBy?: string) {
    const photo = this.photoRepo.create({
      projectId,
      area,
      url: `/uploads/${file.filename || file.originalname}`,
      thumbnailUrl: `/uploads/thumb_${file.filename || file.originalname}`,
      uploadedBy,
    });
    return this.photoRepo.save(photo);
  }

  async deleteFile(id: string) {
    const attachment = await this.attachmentRepo.findOne({ where: { id } });
    if (!attachment) throw new NotFoundException('File not found');
    await this.attachmentRepo.remove(attachment);
    return { message: 'File deleted' };
  }

  async deletePhoto(id: string) {
    const photo = await this.photoRepo.findOne({ where: { id } });
    if (!photo) throw new NotFoundException('Photo not found');
    await this.photoRepo.remove(photo);
    return { message: 'Photo deleted' };
  }

  async findByProject(projectId: string) {
    const [attachments, photos] = await Promise.all([
      this.attachmentRepo.find({ where: { entityType: 'project', entityId: projectId } }),
      this.photoRepo.find({ where: { projectId } }),
    ]);
    return { attachments, photos };
  }
}

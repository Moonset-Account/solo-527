import { Injectable, NotFoundException, BadRequestException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createReadStream, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Attachment } from '@/database/entities';
import { CreateAttachmentDto, UpdateAttachmentDto, AttachmentFilterDto } from './dto/attachment.dto';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
  ) {}

  async create(createAttachmentDto: CreateAttachmentDto, userId?: string): Promise<Attachment> {
    const attachment = this.attachmentRepository.create({
      entityType: createAttachmentDto.entityType,
      entityId: createAttachmentDto.entityId,
      fileName: createAttachmentDto.fileName,
      originalName: createAttachmentDto.fileName,
      mimeType: createAttachmentDto.fileType,
      size: createAttachmentDto.fileSize,
      storagePath: createAttachmentDto.filePath,
      description: createAttachmentDto.description,
      createdBy: userId,
      updatedBy: userId,
    });

    if (createAttachmentDto.entityType === 'bill') {
      attachment.billId = createAttachmentDto.entityId;
    }

    return this.attachmentRepository.save(attachment);
  }

  async findAll(filters: AttachmentFilterDto): Promise<{ data: Attachment[]; total: number }> {
    const queryBuilder = this.attachmentRepository.createQueryBuilder('attachment');

    if (filters.entityType) {
      queryBuilder.andWhere('attachment.entityType = :entityType', { entityType: filters.entityType });
    }

    if (filters.entityId) {
      queryBuilder.andWhere('attachment.entityId = :entityId', { entityId: filters.entityId });
    }

    if (filters.uploadedBy) {
      queryBuilder.andWhere('attachment.createdBy = :uploadedBy', { uploadedBy: filters.uploadedBy });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('attachment.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('attachment.createdAt <= :endDate', { endDate: filters.endDate });
    }

    const sortBy = filters.sortBy || 'attachment.createdAt';
    const sortOrder = filters.sortOrder || 'DESC';
    queryBuilder.orderBy(sortBy, sortOrder as 'ASC' | 'DESC');

    queryBuilder.skip((filters.page - 1) * filters.limit);
    queryBuilder.take(filters.limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOne(id: string): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    return attachment;
  }

  async update(id: string, updateAttachmentDto: UpdateAttachmentDto, userId?: string): Promise<Attachment> {
    const attachment = await this.findOne(id);

    const updatedAttachment = this.attachmentRepository.merge(attachment, {
      description: updateAttachmentDto.description,
      updatedBy: userId,
    });

    return this.attachmentRepository.save(updatedAttachment);
  }

  async delete(id: string): Promise<void> {
    const attachment = await this.findOne(id);

    const filePath = join(process.cwd(), attachment.storagePath);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch (error) {
        throw new BadRequestException('Failed to delete file');
      }
    }

    await this.attachmentRepository.delete(id);
  }

  async uploadFile(file: Express.Multer.File, entityType: string, entityId: string, description?: string, userId?: string): Promise<Attachment> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const createAttachmentDto: CreateAttachmentDto = {
      entityType: entityType as any,
      entityId,
      fileName: file.filename,
      fileType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
      description,
    };

    return this.create(createAttachmentDto, userId);
  }

  async downloadFile(id: string): Promise<{ file: StreamableFile; fileName: string; mimeType: string }> {
    const attachment = await this.findOne(id);

    const filePath = join(process.cwd(), attachment.storagePath);
    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    const fileStream = createReadStream(filePath);

    return {
      file: new StreamableFile(fileStream),
      fileName: attachment.originalName,
      mimeType: attachment.mimeType,
    };
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import { AttachmentType, AttachmentCategory } from '../../common/enums/attachment.enum';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private attachmentsRepository: Repository<Attachment>,
  ) {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const subdirs = ['materials', 'deliveries', 'exceptions', 'avatars', 'others'];
    subdirs.forEach((d) => {
      const p = path.join(uploadDir, d);
      if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
    });
  }

  async saveFile(file: Express.Multer.File, attachmentType: AttachmentType, operatorId: string, options?: {
    materialId?: string;
    deliveryId?: string;
    exceptionId?: string;
    isKey?: boolean;
    remark?: string;
  }): Promise<Attachment> {
    if (!file) throw new BadRequestException('文件不能为空');

    const category = this.getCategory(file.mimetype);
    const subdir = this.getSubdir(attachmentType);
    const uploadDir = process.env.UPLOAD_DIR || './uploads';

    const ext = path.extname(file.originalname) || '';
    const storedName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    const relativePath = path.join(subdir, storedName);
    const absolutePath = path.join(process.cwd(), uploadDir, relativePath);

    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, file.buffer);

    const fileUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;

    const attachment = this.attachmentsRepository.create({
      originalName: file.originalname,
      storedName,
      filePath: relativePath,
      fileUrl,
      mimetype: file.mimetype,
      size: file.size,
      attachmentType,
      category,
      isKey: options?.isKey || false,
      materialId: options?.materialId,
      deliveryId: options?.deliveryId,
      exceptionId: options?.exceptionId,
      remark: options?.remark,
      createdBy: operatorId,
    });

    return this.attachmentsRepository.save(attachment);
  }

  async saveFiles(files: Express.Multer.File[], attachmentType: AttachmentType, operatorId: string, options?: {
    materialId?: string;
    deliveryId?: string;
    exceptionId?: string;
    remark?: string;
  }): Promise<Attachment[]> {
    if (!files || files.length === 0) return [];
    const results: Attachment[] = [];
    for (const file of files) {
      results.push(await this.saveFile(file, attachmentType, operatorId, options));
    }
    return results;
  }

  async findByIds(ids: string[]): Promise<Attachment[]> {
    if (ids.length === 0) return [];
    return this.attachmentsRepository.findBy({ id: In(ids) });
  }

  async findByMaterial(materialId: string) {
    return this.attachmentsRepository.find({ where: { materialId }, order: { createdAt: 'ASC' } });
  }

  async findByDelivery(deliveryId: string) {
    return this.attachmentsRepository.find({ where: { deliveryId }, order: { createdAt: 'ASC' } });
  }

  async findByException(exceptionId: string) {
    return this.attachmentsRepository.find({ where: { exceptionId }, order: { createdAt: 'ASC' } });
  }

  async findOne(id: string) {
    const attachment = await this.attachmentsRepository.findOne({ where: { id } });
    if (!attachment) throw new NotFoundException('附件不存在');
    return attachment;
  }

  async incrementDownload(id: string) {
    await this.attachmentsRepository.increment({ id }, 'downloadCount', 1);
    return this.findOne(id);
  }

  async remove(id: string, operatorId: string) {
    const attachment = await this.findOne(id);
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const absolutePath = path.join(process.cwd(), uploadDir, attachment.filePath);
    try {
      if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
    } catch {}
    await this.attachmentsRepository.delete(id);
    return { success: true };
  }

  async toggleKey(id: string, isKey: boolean) {
    const attachment = await this.findOne(id);
    attachment.isKey = isKey;
    return this.attachmentsRepository.save(attachment);
  }

  private getCategory(mimetype: string): AttachmentCategory {
    if (!mimetype) return AttachmentCategory.OTHER;
    if (mimetype.startsWith('image/')) return AttachmentCategory.IMAGE;
    if (mimetype.startsWith('video/')) return AttachmentCategory.VIDEO;
    if (mimetype.startsWith('audio/')) return AttachmentCategory.AUDIO;
    if (['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument', 'text/'].some((p) => mimetype.startsWith(p))) {
      return AttachmentCategory.DOCUMENT;
    }
    if (['application/zip', 'application/rar', 'application/7z', 'application/x-tar', 'application/gzip'].some((p) => mimetype.startsWith(p))) {
      return AttachmentCategory.ARCHIVE;
    }
    return AttachmentCategory.OTHER;
  }

  private getSubdir(type: AttachmentType): string {
    const map: Record<AttachmentType, string> = {
      [AttachmentType.MATERIAL_FILE]: 'materials',
      [AttachmentType.MATERIAL_PREVIEW]: 'materials',
      [AttachmentType.DELIVERY_FILE]: 'deliveries',
      [AttachmentType.EXCEPTION_EVIDENCE]: 'exceptions',
      [AttachmentType.SETTLEMENT_PROOF]: 'others',
      [AttachmentType.REMARK_ATTACHMENT]: 'others',
      [AttachmentType.AVATAR]: 'avatars',
      [AttachmentType.OTHER]: 'others',
    };
    return map[type] || 'others';
  }
}

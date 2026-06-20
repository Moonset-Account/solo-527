import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { createHash } from 'crypto';
import { createReadStream as fsCreateReadStream, statSync, existsSync } from 'fs';
import { join, basename } from 'path';
import { Response } from 'express';
import { ContractAttachment, AttachmentType, AttachmentStatus } from '../../entities/contract-attachment.entity';
import { FileResource } from '../../entities/file-resource.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

export interface UploadAttachmentDto {
  contractId: string;
  attachmentType: AttachmentType;
  permissionConfig?: {
    viewUsers: string[];
    downloadUsers: string[];
    viewRoles: string[];
    downloadRoles: string[];
    public: boolean;
  };
}

export interface QueryAttachmentDto {
  page?: number;
  pageSize?: number;
  contractId?: string;
  attachmentType?: AttachmentType;
  status?: AttachmentStatus;
  keyword?: string;
  uploaderId?: string;
}

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(ContractAttachment) private attachmentRepo: Repository<ContractAttachment>,
    @InjectRepository(FileResource) private resourceRepo: Repository<FileResource>,
    @InjectRepository(AuditLog) private auditLogRepo: Repository<AuditLog>,
  ) {}

  async saveUploadedFile(file: Express.Multer.File, dto: UploadAttachmentDto, user: CurrentUserPayload) {
    const fileHash = await this.computeFileHash(file.path);
    const relativePath = file.path.replace(process.cwd(), '').replace(/^\//, '');

    let resource = await this.resourceRepo.findOne({ where: { resourceKey: fileHash } });
    if (!resource) {
      resource = this.resourceRepo.create({
        resourceKey: fileHash,
        resourceName: file.originalname,
        resourceType: dto.attachmentType || file.mimetype,
        size: file.size,
        description: `来自合同 ${dto.contractId} 的附件`,
        contractId: dto.contractId,
      });
      resource = await this.resourceRepo.save(resource);
    }

    const attachment = this.attachmentRepo.create({
      contractId: dto.contractId,
      originalName: file.originalname,
      filePath: relativePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      attachmentType: dto.attachmentType,
      uploaderId: user.id,
      permissionConfig: dto.permissionConfig || {
        viewUsers: [],
        downloadUsers: [],
        viewRoles: [],
        downloadRoles: [],
        public: false,
      },
      fileHash,
    });

    const saved = await this.attachmentRepo.save(attachment);
    await this.addAuditLog(user.id, user.realName, AuditAction.UPLOAD, 'attachment', saved.id, saved.originalName);
    return saved;
  }

  private async computeFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const hash = createHash('md5');
        const stream = fsCreateReadStream(filePath);
        stream.on('data', (d) => hash.update(d));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', reject);
      } catch (e) {
        resolve(Date.now().toString());
      }
    });
  }

  async getAttachment(id: string, user: CurrentUserPayload) {
    const att = await this.attachmentRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.uploader', 'u')
      .leftJoinAndSelect('a.contract', 'c')
      .where('a.id = :id', { id })
      .getOne();
    if (!att) throw new NotFoundException('附件不存在');
    await this.checkViewPermission(att, user);
    att.viewCount = (att.viewCount || 0) + 1;
    await this.attachmentRepo.update(att.id, { viewCount: att.viewCount });
    return att;
  }

  async downloadAttachment(id: string, user: CurrentUserPayload, res: Response) {
    const att = await this.getAttachment(id, user);
    await this.checkDownloadPermission(att, user);

    const fullPath = join(process.cwd(), att.filePath);
    if (!existsSync(fullPath)) throw new NotFoundException('文件不存在');
    const stats = statSync(fullPath);

    att.downloadCount = (att.downloadCount || 0) + 1;
    await this.attachmentRepo.update(att.id, { downloadCount: att.downloadCount });
    await this.addAuditLog(user.id, user.realName, AuditAction.DOWNLOAD, 'attachment', att.id, att.originalName);

    res.setHeader('Content-Type', att.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(att.originalName)}`);
    res.setHeader('Content-Length', stats.size);
    return fsCreateReadStream(fullPath).pipe(res);
  }

  private async checkViewPermission(att: ContractAttachment, user: CurrentUserPayload) {
    if (att.uploaderId === user.id) return;
    const cfg = att.permissionConfig;
    if (!cfg || cfg.public) return;
    if (user.roles?.includes('super_admin') || user.roles?.includes('legal_admin')) return;
    if (cfg.viewUsers?.includes(user.id)) return;
    if (cfg.viewRoles?.some((r) => user.roles?.includes(r))) return;
    throw new ForbiddenException('无权查看此附件');
  }

  private async checkDownloadPermission(att: ContractAttachment, user: CurrentUserPayload) {
    if (att.uploaderId === user.id) return;
    const cfg = att.permissionConfig;
    if (!cfg || cfg.public) return;
    if (user.roles?.includes('super_admin') || user.roles?.includes('legal_admin')) return;
    if (cfg.downloadUsers?.includes(user.id)) return;
    if (cfg.downloadRoles?.some((r) => user.roles?.includes(r))) return;
    throw new ForbiddenException('无权下载此附件');
  }

  async queryAttachments(query: QueryAttachmentDto, user: CurrentUserPayload) {
    const { page = 1, pageSize = 20, contractId, attachmentType, status, keyword, uploaderId } = query;
    const qb = this.attachmentRepo.createQueryBuilder('a').leftJoinAndSelect('a.uploader', 'u');

    if (contractId) qb.andWhere('a.contractId = :cid', { cid: contractId });
    if (attachmentType) qb.andWhere('a.attachmentType = :at', { at: attachmentType });
    if (status) qb.andWhere('a.status = :st', { st: status });
    if (uploaderId) qb.andWhere('a.uploaderId = :uid', { uid: uploaderId });
    if (keyword) qb.andWhere('a.originalName ILIKE :kw', { kw: `%${keyword}%` });

    const isAdmin = user.roles?.includes('super_admin') || user.roles?.includes('legal_admin');
    if (!isAdmin) {
      qb.andWhere(new Brackets((sq) => {
        sq.where('a.uploaderId = :uid', { uid: user.id })
          .orWhere("a.permissionConfig->>'public' = 'true'")
          .orWhere("a.permissionConfig->'viewUsers' @> :uarr::jsonb", { uarr: JSON.stringify([user.id]) });
      }));
    }

    qb.orderBy('a.uploadedAt', 'DESC').skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  async updateAttachmentPermission(id: string, permissionConfig: any, user: CurrentUserPayload) {
    const att = await this.attachmentRepo.findOne({ where: { id } });
    if (!att) throw new NotFoundException('附件不存在');
    if (att.uploaderId !== user.id && !user.roles?.includes('super_admin')) {
      throw new ForbiddenException('只有上传者或管理员能修改权限');
    }
    att.permissionConfig = permissionConfig;
    const saved = await this.attachmentRepo.save(att);
    await this.addAuditLog(user.id, user.realName, AuditAction.UPDATE, 'attachment', id, att.originalName);
    return saved;
  }

  async reviewAttachment(id: string, status: AttachmentStatus, remark: string, user: CurrentUserPayload) {
    const att = await this.attachmentRepo.findOne({ where: { id } });
    if (!att) throw new NotFoundException('附件不存在');
    if (!user.roles?.includes('super_admin') && !user.roles?.includes('legal_admin') && !user.permissions?.includes('material:verify')) {
      throw new ForbiddenException('无审核权限');
    }
    att.status = status;
    att.reviewRemark = remark;
    await this.attachmentRepo.save(att);
    await this.addAuditLog(user.id, user.realName, AuditAction.APPROVE, 'attachment', id, att.originalName, null, { status, remark });
    return att;
  }

  async getStats() {
    const total = await this.attachmentRepo.count();
    const totalSize = await this.attachmentRepo.createQueryBuilder('a')
      .select('COALESCE(SUM(a.fileSize), 0)', 'sum').getRawOne();
    const byType: Record<string, { count: number; size: number }> = {};
    const rows = await this.attachmentRepo
      .createQueryBuilder('a')
      .select('a.attachmentType', 'type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(a.fileSize), 0)', 'size')
      .groupBy('a.attachmentType')
      .getRawMany();
    rows.forEach((r) => {
      byType[r.type] = { count: parseInt(r.count), size: parseFloat(r.size) };
    });
    return { total, totalSize: parseFloat(totalSize.sum || 0), byType };
  }

  private async addAuditLog(userId: string, userName: string, action: AuditAction, targetType: string, targetId: string, targetName?: string, beforeData?: any, afterData?: any, remark?: string) {
    try {
      const log = this.auditLogRepo.create({ userId, userName, action, targetType, targetId, targetName, beforeData, afterData, remark });
      await this.auditLogRepo.save(log);
    } catch (e) {}
  }
}

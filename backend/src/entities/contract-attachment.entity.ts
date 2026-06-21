import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Contract } from './contract.entity';
import { User } from './user.entity';

export enum AttachmentType {
  CONTRACT_MAIN = 'contract_main',
  APPENDIX = 'appendix',
  PROOF = 'proof',
  ID_CARD = 'id_card',
  BUSINESS_LICENSE = 'business_license',
  TAX_CERTIFICATE = 'tax_certificate',
  OTHER = 'other',
}

export enum AttachmentStatus {
  UPLOADED = 'uploaded',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('contract_attachments')
@Index(['contractId', 'attachmentType'])
@Index(['uploaderId'])
export class ContractAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  contractId: string;

  @Column({ type: 'varchar', length: 255, comment: '原始文件名' })
  originalName: string;

  @Column({ type: 'varchar', length: 500, comment: '保存路径' })
  filePath: string;

  @Column({ type: 'varchar', length: 120, comment: '文件类型' })
  mimeType: string;

  @Column({ type: 'bigint', comment: '文件大小(字节)' })
  fileSize: number;

  @Column({
    type: 'enum',
    enum: AttachmentType,
    default: AttachmentType.OTHER,
    comment: '附件类型',
  })
  attachmentType: AttachmentType;

  @Column({
    type: 'enum',
    enum: AttachmentStatus,
    default: AttachmentStatus.UPLOADED,
    comment: '附件状态',
  })
  status: AttachmentStatus;

  @Column({ type: 'text', nullable: true, comment: '审核备注' })
  reviewRemark: string;

  @Column({ type: 'uuid' })
  uploaderId: string;

  @Column({ type: 'json', nullable: true, comment: '权限配置' })
  permissionConfig: {
    viewUsers: string[];
    downloadUsers: string[];
    viewRoles: string[];
    downloadRoles: string[];
    public: boolean;
  };

  @Column({ type: 'integer', default: 0, comment: '下载次数' })
  downloadCount: number;

  @Column({ type: 'integer', default: 0, comment: '预览次数' })
  viewCount: number;

  @Column({ type: 'text', nullable: true, comment: '文件hash' })
  fileHash: string;

  @ManyToOne(() => Contract, (contract) => contract.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contractId' })
  contract: Contract;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'uploaderId' })
  uploader: User;

  @CreateDateColumn({ type: 'timestamptz', comment: '上传时间' })
  uploadedAt: Date;
}

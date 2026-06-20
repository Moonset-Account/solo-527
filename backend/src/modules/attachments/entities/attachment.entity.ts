import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { AttachmentType, AttachmentCategory } from '../../common/enums/attachment.enum';
import { Material } from '../../modules/materials/entities/material.entity';
import { Delivery } from '../../modules/deliveries/entities/delivery.entity';
import { ExceptionRecord } from '../../modules/exceptions/entities/exception-record.entity';

@Entity('attachments')
export class Attachment extends BaseEntity {
  @Column({ length: 255, name: 'original_name' })
  originalName: string;

  @Column({ length: 255, name: 'stored_name' })
  storedName: string;

  @Column({ type: 'text', name: 'file_path' })
  filePath: string;

  @Column({ type: 'text', name: 'file_url' })
  fileUrl: string;

  @Column({ length: 50, nullable: true })
  mimetype: string;

  @Column({ type: 'bigint', nullable: true })
  size: number;

  @Column({
    type: 'enum',
    enum: AttachmentType,
    default: AttachmentType.OTHER,
  })
  attachmentType: AttachmentType;

  @Column({
    type: 'enum',
    enum: AttachmentCategory,
    default: AttachmentCategory.OTHER,
  })
  category: AttachmentCategory;

  @Column({ type: 'boolean', default: false, name: 'is_key' })
  isKey: boolean;

  @Column({ type: 'int', default: 0, name: 'download_count' })
  downloadCount: number;

  @Column({ type: 'uuid', name: 'material_id', nullable: true })
  materialId: string;

  @Column({ type: 'uuid', name: 'delivery_id', nullable: true })
  deliveryId: string;

  @Column({ type: 'uuid', name: 'exception_id', nullable: true })
  exceptionId: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @ManyToOne(() => Material, (material) => material.attachments)
  @JoinColumn({ name: 'material_id' })
  material: Material;

  @ManyToOne(() => Delivery, (delivery) => delivery.attachments)
  @JoinColumn({ name: 'delivery_id' })
  delivery: Delivery;

  @ManyToOne(() => ExceptionRecord, (ex) => ex.attachments)
  @JoinColumn({ name: 'exception_id' })
  exceptionRecord: ExceptionRecord;
}

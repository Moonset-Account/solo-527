import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { ContractAttachment } from '../../entities/contract-attachment.entity';
import { FileResource } from '../../entities/file-resource.entity';
import { AuditLog } from '../../entities/audit-log.entity';

const uploadDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
  for (const sub of ['contracts', 'attachments', 'temp', 'signatures']) {
    mkdirSync(join(uploadDir, sub), { recursive: true });
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([ContractAttachment, FileResource, AuditLog]),
    MulterModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        storage: diskStorage({
          destination: (_req, file, cb) => {
            const subFolder = file.fieldname.includes('contract') ? 'contracts' : 'attachments';
            const dir = join(uploadDir, subFolder, new Date().toISOString().slice(0, 10).replace(/-/g, ''));
            if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
            cb(null, dir);
          },
          filename: (_req, file, cb) => {
            const hash = createHash('md5').update(file.originalname + Date.now()).digest('hex').slice(0, 8);
            cb(null, `${Date.now()}-${hash}${extname(file.originalname)}`);
          },
        }),
        limits: {
          fileSize: 100 * 1024 * 1024,
          files: 20,
        },
        fileFilter: (_req, file, cb) => {
          const allowed = [
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
            '.txt', '.csv', '.zip', '.rar', '.7z', '.ofd',
          ];
          const ext = extname(file.originalname).toLowerCase();
          cb(null, allowed.includes(ext));
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
